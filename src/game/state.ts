import { basic } from "@/ai/heuristics/basic";
import { greedy } from "@/ai/heuristics/greedy";
import { heuristic } from "@/ai/heuristics/heuristic";
import { makeRng, type Rng } from "@/lib/rng";
import { extraLife, goldenTouch, pickAnomaly } from "./anomalies";
import { activateBuddies, createBuddyInstance, pickBuddy, pickBuddyForPlayer } from "./buddies";
import { simulateCombat } from "./combat";
import { applyDamageToPlayer, calcDamage, healHero } from "./damage";
import { baseGoldForTurn, TIER_UPGRADE_BASE } from "./economy";
import { getAllHeroIds, HEROES, theCurator } from "./heroes/index";
import { grantBanana } from "./heroes/king-mukla";
import { ensureCuratorShop } from "./heroes/the-curator";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import { createQuestInstance, getQuest, pickQuest, QUESTS } from "./quests";
import {
  applyComboToBoard,
  buildPool,
  buyMinion,
  freezeShop,
  playMinionToBoard,
  refreshShop,
  reorderBoard,
  rollShopForPlayer,
  sellMinion,
  upgradeTier,
} from "./shop";
import { SPELLS } from "./spells/index";
import { pickTrinket, pickTrinketForPlayer, TRINKETS } from "./trinkets";
import { checkAndProcessTriples } from "./triples";
import type {
  Action,
  AnomalyCard,
  GameState,
  HeroId,
  MinionCard,
  MinionInstance,
  ModifierId,
  PlayerState,
  QuestInstance,
  Tier,
  Tribe,
  TrinketCard,
  TrinketInstance,
} from "./types";
import { getPlayer, updatePlayer } from "./utils";

// ---------------------------------------------------------------------------
// Spell damage helpers
// ---------------------------------------------------------------------------

/** Sum the spellDamage property of all minions on a player's board. */
export function totalSpellDamage(player: PlayerState): number {
  return player.board.reduce((sum, m) => sum + (m.spellDamage ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Hero power
// ---------------------------------------------------------------------------

function useHeroPower(state: GameState, playerId: number, target: unknown, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  const hero = HEROES[player.heroId];
  if (!hero || hero.power.kind !== "active") return state;

  const cost = hero.power.cost;
  if (player.gold < cost) throw new Error(`Not enough gold for hero power (need ${cost})`);
  if (player.heroPowerUsed) throw new Error("Hero power already used this turn");

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - cost,
    heroPowerUsed: true,
  }));

  if (hero.onHeroPower) {
    next = hero.onHeroPower(next, playerId, target, rng);
  }

  return next;
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Spell helpers
// ------->-->-->-->-->-->-->-->-->-->-->-->

function buySpell(state: GameState, playerId: number, shopIndex: number, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  // Spells are in the shop slots after shop size
  const shopItems = player.shop;
  const shopSize = Math.floor(shopItems.length * 0.25); // 1/4 of slots are spells
  const spellSlots = shopItems.slice(-shopSize);

  if (shopIndex < 0 || shopIndex >= spellSlots.length) {
    throw new Error(`No spell at shop index ${shopIndex}`);
  }

  const spellInstance = spellSlots[shopIndex]!;
  const spellCard = SPELLS[spellInstance.cardId];
  if (!spellCard) throw new Error(`Unknown spell: ${spellInstance.cardId}`);

  if (player.gold < spellCard.cost) {
    throw new Error(`Not enough gold to buy spell (need ${spellCard.cost})`);
  }

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - spellCard.cost,
    spells: [...p.spells, spellInstance] as import("./types").SpellInstance[],
  }));
}

function playSpell(
  state: GameState,
  playerId: number,
  spellIndex: number,
  targetIndex: number | undefined,
  rng: Rng,
): GameState {
  const player = getPlayer(state, playerId);
  const spellInstance = player.spells[spellIndex];
  if (!spellInstance) throw new Error(`No spell at index ${spellIndex}`);

  const spellCard = SPELLS[spellInstance.cardId];
  if (!spellCard) throw new Error(`Unknown spell: ${spellInstance.cardId}`);

  if (spellCard.effects.onPlay) {
    const ctx: Record<string, unknown> = {
      self: {
        instanceId: spellInstance.instanceId,
        cardId: spellInstance.cardId,
        atk: 0,
        hp: 0,
        maxHp: 0,
        keywords: new Set(),
        tribes: [] as string[],
        golden: false,
        spellDamage: 0,
        attachments: {},
        hooks: {},
      } as unknown as import("./types").MinionInstance,
      playerId,
      state,
      rng,
      spellDamage: totalSpellDamage(player),
    };
    if (targetIndex !== undefined) {
      (ctx as { targetIndex: number }).targetIndex = targetIndex;
    }
    const afterSpell = spellCard.effects.onPlay(
      ctx as unknown as import("./types").RecruitCtx & { targetIndex?: number },
    );
    // Fire onCast hooks for all minions on the player's board
    const afterCast = fireOnCastHooks(afterSpell, playerId, rng);
    return applyComboToBoard(afterCast, playerId);
  }

  return applyComboToBoard(state, playerId);
}

/** Fire onCast hooks for all minions on the player's board. */
function fireOnCastHooks(state: GameState, playerId: number, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  let result = state;
  for (const minion of player.board) {
    const cast = minion.hooks?.onCast;
    if (cast) {
      result = cast({
        self: minion,
        playerId,
        state: result,
        rng,
        spellDamage: totalSpellDamage(player),
      });
    }
  }
  return result;
}

const ALL_TRIBES: Tribe[] = [
  "Beast",
  "Murloc",
  "Demon",
  "Mech",
  "Elemental",
  "Pirate",
  "Dragon",
  "Naga",
  "Quilboar",
  "Undead",
];

const LOBBY_TRIBE_COUNT = 5;

// ---------------------------------------------------------------------------
// Top-level reducer
// ---------------------------------------------------------------------------

export function step(state: GameState, action: Action, rng: Rng): GameState {
  switch (state.phase.kind) {
    case "HeroSelection":
      return stepHeroSelection(state, action, rng);
    case "Recruit":
      return stepRecruit(state, action, rng);
    case "Combat":
      return stepCombat(state, action, rng);
    case "GameOver":
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hero selection phase
// ---------------------------------------------------------------------------

function stepHeroSelection(state: GameState, action: Action, rng: Rng): GameState {
  if (action.kind !== "SelectHero") return state;

  const hero = HEROES[action.heroId];
  if (!hero) throw new Error(`Unknown hero: ${action.heroId}`);

  const afterSelect = updatePlayer(state, action.player, (p) => ({
    ...p,
    heroId: action.heroId,
    hp: hero.startHp,
    armor: hero.startArmor,
  }));

  // Auto-assign random heroes to AI players who don't have one yet.
  let stateWithAI = afterSelect;
  const availableHeroes = getAllHeroIds().filter(
    (id: HeroId) => id !== action.heroId && id !== "stub_hero",
  );
  const shuffled = rng.shuffle(availableHeroes);
  let aiIdx = 0;
  for (let i = 1; i < stateWithAI.players.length; i++) {
    const p = stateWithAI.players[i];
    if (p && p.heroId === "") {
      const aiHeroId = (shuffled[aiIdx++] ?? "stub_hero") as HeroId;
      const aiHero = HEROES[aiHeroId];
      if (!aiHero) throw new Error(`AI hero not found: ${aiHeroId}`);
      stateWithAI = updatePlayer(stateWithAI, i, (player) => ({
        ...player,
        heroId: aiHeroId,
        hp: aiHero.startHp,
        armor: aiHero.startArmor,
      }));
    }
  }

  const allSelected = stateWithAI.players.every((p) => p.heroId !== "");
  if (!allSelected) return stateWithAI;

  return beginRecruitTurn(stateWithAI, rng);
}

// ---------------------------------------------------------------------------
// Recruit phase
// ---------------------------------------------------------------------------

function stepRecruit(state: GameState, action: Action, rng: Rng): GameState {
  switch (action.kind) {
    case "BuyMinion":
      return buyMinion(state, action.player, action.shopIndex, rng);
    case "BuySpell":
      return buySpell(state, action.player, action.shopIndex, rng);
    case "PlaySpell":
      return playSpell(state, action.player, action.spellIndex, action.targetIndex, rng);
    case "SellMinion":
      return "handIndex" in action
        ? sellMinion(state, action.player, action.handIndex, true)
        : sellMinion(state, action.player, action.boardIndex);
    case "PlayMinion":
      return playMinionToBoard(state, action.player, action.handIndex, action.boardIndex, rng);
    case "ReorderBoard":
      return reorderBoard(state, action.player, action.from, action.to);
    case "RefreshShop":
      return refreshShop(state, action.player, rng);
    case "FreezeShop":
      return freezeShop(state, action.player);
    case "UpgradeTier":
      return upgradeTier(state, action.player);
    case "HeroPower":
      return useHeroPower(state, action.player, action.target, rng);
    case "EndTurn":
      return endTurn(state, action.player, rng);
    case "PickDiscover":
      return pickDiscover(state, action.player, action.index);
    case "DismissDiscover":
      return dismissDiscover(state, action.player);
    default:
      return state;
  }
}

const AI_STRATEGIES: Array<import("@/ai/strategy").Strategy> = [basic, greedy, heuristic];

/** Execute AI recruit actions for all non-player-0 players before combat. */
function executeAiRecruitActions(state: GameState, nextTurn: number, rng: Rng): GameState {
  let result = { ...state, turn: nextTurn };

  for (let i = 1; i < result.players.length; i++) {
    const aiPlayer = result.players[i];
    if (!aiPlayer || aiPlayer.eliminated) continue;

    const strategy = AI_STRATEGIES[i % AI_STRATEGIES.length]!;
    const aiRng = rng.fork(`ai:recruit:${i}:${nextTurn}`);

    const aiView: import("@/ai/strategy").PlayerView = {
      state: result,
      me: i,
    };

    const actions = strategy.decideRecruitActions(aiView, aiRng);

    for (const action of actions) {
      if (action.kind === "EndTurn") break;

      switch (action.kind) {
        case "BuyMinion": {
          result = buyMinion(result, action.player, action.shopIndex);
          break;
        }
        case "SellMinion": {
          result =
            "handIndex" in action
              ? sellMinion(result, action.player, action.handIndex, true)
              : sellMinion(result, action.player, action.boardIndex);
          break;
        }
        case "PlayMinion": {
          result = playMinionToBoard(
            result,
            action.player,
            action.handIndex,
            action.boardIndex,
            aiRng,
          );
          break;
        }
        case "UpgradeTier": {
          result = upgradeTier(result, action.player);
          break;
        }
        case "RefreshShop": {
          result = refreshShop(result, action.player, aiRng);
          break;
        }
        case "FreezeShop": {
          result = freezeShop(result, action.player);
          break;
        }
        case "ReorderBoard": {
          result = reorderBoard(result, action.player, action.from, action.to);
          break;
        }
        default:
          break;
      }
    }
  }

  return result;
}

function endTurn(state: GameState, playerId: number, rng: Rng): GameState {
  const nextTurn = state.turn + 1;
  let result = { ...state, turn: nextTurn };

  // Fire onTurnEnd hooks for all minions on the player's board
  const player = getPlayer(result, playerId);
  if (!player.eliminated) {
    for (const minion of player.board) {
      if (minion.hooks?.onTurnEnd) {
        const ctx: import("./types").RecruitCtx = {
          self: minion,
          playerId,
          state: result,
          rng,
          spellDamage: totalSpellDamage(player),
        };
        result = minion.hooks.onTurnEnd(ctx);
      }
    }
  }

  // Check for triples at end of turn (between rounds)
  result = checkAndProcessTriples(result, playerId, rng);

  // Execute AI recruit actions for non-player-0 before combat
  result = executeAiRecruitActions(result, nextTurn, rng);

  // Transition to combat phase
  result = {
    ...result,
    phase: { kind: "Combat" as const, turn: nextTurn },
  };

  // Immediately resolve combat and transition back to Recruit
  return resolveCombat(result, rng);
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Discover handlers
// ------->-->-->-->-->-->-->-->-->-->-->-->

function pickDiscover(state: GameState, playerId: number, index: number): GameState {
  const player = getPlayer(state, playerId);
  const offer = player.discoverOffer?.offers[index];
  if (!offer) return state;

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    hand: [...p.hand, offer.minion],
    discoverOffer: null,
  }));
}

function dismissDiscover(state: GameState, playerId: number): GameState {
  const player = getPlayer(state, playerId);
  if (!player.discoverOffer) return state;

  return updatePlayer(state, playerId, (p) => ({ ...p, discoverOffer: null }));
}

// ---------------------------------------------------------------------------
// Combat phase
// ---------------------------------------------------------------------------

function findLowestAtkMinion(board: MinionInstance[]): MinionInstance | null {
  if (board.length === 0) return null;
  let lowest = board[0]!;
  for (let i = 1; i < board.length; i++) {
    const m = board[i]!;
    if (m.atk < lowest.atk) {
      lowest = m;
    }
  }
  return lowest;
}

function applyRagnarosPassive(
  state: GameState,
  ragnarosId: import("./types").PlayerId,
  opponentId: import("./types").PlayerId,
  rng: Rng,
): GameState {
  const opponent = getPlayer(state, opponentId);
  const aliveBoard = opponent.board.filter((m) => m.hp > 0);
  if (aliveBoard.length === 0) return state;

  // Find lowest-ATK enemy minion (ties broken by board position)
  let lowest = aliveBoard[0]!;
  for (let i = 1; i < aliveBoard.length; i++) {
    const m = aliveBoard[i]!;
    if (m.atk < lowest.atk) {
      lowest = m;
    }
  }

  const idx = opponent.board.indexOf(lowest);
  if (idx === -1) return state;

  return updatePlayer(state, opponentId, (p) => {
    const newBoard = [...p.board];
    const mi = newBoard[idx]!;
    newBoard[idx] = { ...mi, hp: mi.hp - 8 };
    return { ...p, board: newBoard };
  });
}

function applyRagnarosAfterCombat(
  state: GameState,
  leftId: import("./types").PlayerId,
  rightId: import("./types").PlayerId,
): GameState {
  let result = state;
  const left = getPlayer(result, leftId);
  const right = getPlayer(result, rightId);

  // Ragnaros on left side: deal 8 damage to lowest-ATK enemy minion (right side)
  if (left.heroId === "ragnaros") {
    const enemyBoard = right.board.filter((m) => m.hp > 0);
    if (enemyBoard.length > 0) {
      const target = findLowestAtkMinion(enemyBoard);
      if (target) {
        const idx = right.board.indexOf(target);
        if (idx !== -1) {
          result = updatePlayer(result, rightId, (p) => {
            const newBoard = [...p.board];
            const mi = newBoard[idx]!;
            newBoard[idx] = { ...mi, hp: mi.hp - 8 };
            return { ...p, board: newBoard };
          });
        }
      }
    }
  }

  // Ragnaros on right side: deal 8 damage to lowest-ATK enemy minion (left side)
  if (right.heroId === "ragnaros") {
    const enemyBoard = left.board.filter((m) => m.hp > 0);
    if (enemyBoard.length > 0) {
      const target = findLowestAtkMinion(enemyBoard);
      if (target) {
        const idx = left.board.indexOf(target);
        if (idx !== -1) {
          result = updatePlayer(result, leftId, (p) => {
            const newBoard = [...p.board];
            const mi = newBoard[idx]!;
            newBoard[idx] = { ...mi, hp: mi.hp - 8 };
            return { ...p, board: newBoard };
          });
        }
      }
    }
  }

  // Filter out dead minions from both boards
  result = updatePlayer(result, leftId, (p) => ({
    ...p,
    board: p.board.filter((m) => m.hp > 0),
  }));
  result = updatePlayer(result, rightId, (p) => ({
    ...p,
    board: p.board.filter((m) => m.hp > 0),
  }));

  return result;
}

function resolveCombat(state: GameState, rng: Rng): GameState {
  // Collect alive players in order
  const alivePlayers = state.players.filter((p) => !p.eliminated);

  // Sort by id
  const sortedPlayers = [...alivePlayers].sort((a, b) => a.id - b.id);

  // Pair players: avoid immediate rematches, randomize within constraints
  const pairings = pairPlayers(sortedPlayers, state.pairingsHistory, state.turn, rng);

  // Simulate each fight
  let result: GameState = state;

  for (const [leftId, rightId] of pairings) {
    const left = getPlayer(result, leftId);
    const right = getPlayer(result, rightId);

    // Skip if either player was eliminated in a previous fight this round
    if (left.eliminated && !isGhost(result, leftId)) continue;
    if (right.eliminated && !isGhost(result, rightId)) continue;

    const leftBoard = left.board.filter((m) => m.hp > 0);
    const rightBoard = right.board.filter((m) => m.hp > 0);

    const combatResult = simulateCombat(leftBoard, rightBoard, rng, result.modifierState.anomaly);

    result = applyCombatResult(result, leftId, rightId, combatResult);

    // Apply Ragnaros hero passive after combat result: deal 8 damage to lowest-ATK enemy minion
    result = applyRagnarosAfterCombat(result, leftId, rightId);
  }

  // Process quest progress for all players after combat resolves
  result = processQuests(result, rng);

  // Check for game over
  const remainingAlive = result.players.filter((p) => !p.eliminated);
  if (remainingAlive.length <= 1) {
    const winner = (
      remainingAlive.length === 1 ? remainingAlive[0]!.id : 0
    ) as import("./types").PlayerId;
    // Set placements for eliminated players
    let placement = 2; // 1st is the winner
    for (const p of result.players) {
      if (!p.eliminated && p.id !== winner) {
        p.placement = placement++;
      }
    }
    if (placement <= 8) {
      // Any remaining unplaced players get remaining placements
      for (const p of result.players) {
        if (p.placement === null && p.id !== winner) {
          p.placement = placement++;
        }
      }
    }
    result = {
      ...result,
      phase: { kind: "GameOver" as const, winner },
    };
  } else {
    // Transition back to Recruit phase for the next turn
    result = beginRecruitTurn(result, rng);
  }

  return result;
}

function processQuests(state: GameState, rng: Rng): GameState {
  let result = state;

  for (const player of result.players) {
    if (player.eliminated) continue;

    const quest = player.quests[0];
    if (!quest || quest.completed) continue;

    // Skip if quests modifier is not active for this player
    if (!result.modifiers.includes("quests")) continue;

    const questCard = getQuest(quest.cardId);

    // Call onProgress to increment quest progress
    result = questCard.onProgress(result, player.id, rng);

    // Re-read the updated quest
    const updatedPlayer = getPlayer(result, player.id);
    const updatedQuest = updatedPlayer.quests[0];
    if (!updatedQuest) continue;

    // Check if quest is now complete
    if (questCard.isComplete(result, player.id)) {
      // Apply the quest reward
      result = questCard.onReward(result, player.id, rng);

      // Mark quest as completed
      const rewardPlayer = getPlayer(result, player.id);
      const existingQuest = rewardPlayer.quests[0];
      if (!existingQuest) continue;
      const completedQuest: QuestInstance = {
        instanceId: existingQuest.instanceId,
        cardId: existingQuest.cardId,
        progress: existingQuest.progress,
        target: existingQuest.target,
        completed: true,
      };
      result = updatePlayer(result, player.id, (p) => ({
        ...p,
        quests: [completedQuest],
      }));

      // Also update modifierState.quests
      if (result.modifierState.quests) {
        result.modifierState.quests = {
          ...result.modifierState.quests,
          [player.id]: completedQuest,
        };
      }
    }
  }

  return result;
}

function stepCombat(state: GameState, action: Action, rng: Rng): GameState {
  // Combat resolves automatically when entering the Combat phase.
  // The action (if any) is ignored — combat is a resolved phase.
  return resolveCombat(state, rng);
}

function isGhost(state: GameState, playerId: import("./types").PlayerId): boolean {
  // Ghost players are identified by having a frozen board from a previous round
  // For now, all eliminated players are ghosts in odd-count rounds
  return false;
}

function pairPlayers(
  players: import("./types").PlayerState[],
  pairingHistory: Array<[import("./types").PlayerId, import("./types").PlayerId]>,
  turn: number,
  rng: import("@/lib/rng").Rng,
): Array<[import("./types").PlayerId, import("./types").PlayerId]> {
  if (players.length === 0) return [];

  // Simple pairing: sort by id, pair adjacent players
  // In a full implementation, this would avoid immediate rematches
  const sorted = [...players].sort((a, b) => a.id - b.id);
  const pairings: Array<[import("./types").PlayerId, import("./types").PlayerId]> = [];

  for (let i = 0; i + 1 < sorted.length; i += 2) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a && b) {
      pairings.push([a.id, b.id]);
    }
  }

  // If odd number, last player gets a bye (or fights ghost — handled separately)
  // For now, skip the last player
  return pairings;
}

function applyCombatResult(
  state: GameState,
  leftId: import("./types").PlayerId,
  rightId: import("./types").PlayerId,
  combatResult: import("./types").CombatResult,
): GameState {
  let result = state;
  const { winner, survivorsLeft, survivorsRight } = combatResult;

  if (winner === "draw") {
    // No damage dealt on draws
    return result;
  }

  const isLeftWinner = winner === "left";
  const winnerId = isLeftWinner ? leftId : rightId;
  const loserId = isLeftWinner ? rightId : leftId;

  const winnerPlayer = getPlayer(result, winnerId);
  const loserPlayer = getPlayer(result, loserId);

  // Calculate damage: loserTier + sum(tiers of surviving winning minions)
  const survivors = isLeftWinner ? survivorsLeft : survivorsRight;
  const damage = calcDamage(loserPlayer.tier, survivors);

  // Check for Extra Life anomaly: if the loser would be eliminated and hasn't used their extra life, revive them instead.
  const isExtraLife = result.modifierState.anomaly === "extra_life";
  if (isExtraLife) {
    const loser = getPlayer(result, loserId);
    if (!loser.eliminated && !loser.extraLifeUsed) {
      const wouldBeEliminated = loser.hp - (damage - Math.min(loser.armor, damage)) <= 0;
      if (wouldBeEliminated) {
        // Revive: set to 1 HP, restore board from previous round (stored as hand), use extra life
        let revived = updatePlayer(result, loserId, (p) => ({
          ...p,
          hp: 1,
          armor: 0,
          board: [],
          extraLifeUsed: true,
        }));
        // Save current board to hand before clearing (the board they had going into combat)
        const savedBoard = loser.board.filter((m) => m.hp > 0);
        if (savedBoard.length > 0) {
          revived = updatePlayer(revived, loserId, (p) => ({
            ...p,
            hand: savedBoard,
          }));
        }
        // Still record the pairing but skip damage application
        const newPairing: [import("./types").PlayerId, import("./types").PlayerId] = [
          leftId,
          rightId,
        ] as [import("./types").PlayerId, import("./types").PlayerId];
        return {
          ...revived,
          pairingsHistory: [...revived.pairingsHistory, newPairing],
        };
      }
    }
  }

  // Apply damage to loser
  result = applyDamageToPlayer(result, loserId, damage);

  // Update pairings history
  const newPairing: [import("./types").PlayerId, import("./types").PlayerId] = [
    leftId,
    rightId,
  ] as [import("./types").PlayerId, import("./types").PlayerId];
  result = {
    ...result,
    pairingsHistory: [...result.pairingsHistory, newPairing],
  };

  // Update boards with survivors
  result = updatePlayer(result, winnerId, (p) => ({
    ...p,
    board: survivors,
  }));

  // Apply lifesteal healing to the winner's hero
  const lifestealTotal = combatResult.transcript
    .filter((e) => e.kind === "Lifesteal")
    .reduce((sum, e) => sum + (e as { kind: "Lifesteal"; amount: number }).amount, 0);
  if (lifestealTotal > 0) {
    result = healHero(result, winnerId, lifestealTotal);
  }

  // Loser's board is cleared (they lost)
  const loser = getPlayer(result, loserId);
  if (!loser.eliminated) {
    // If not eliminated, keep their board but they took damage
    // Their minions still died in combat
    result = updatePlayer(result, loserId, (p) => ({
      ...p,
      board: [],
    }));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Turn transitions
// ---------------------------------------------------------------------------

export function beginRecruitTurn(state: GameState, rng: Rng): GameState {
  const turn = state.turn === 0 ? 1 : state.turn;
  const gold = baseGoldForTurn(turn);

  let next: GameState = {
    ...state,
    phase: { kind: "Recruit", turn },
    turn,
  };

  for (const player of state.players) {
    if (player.eliminated) continue;

    const discountedCost =
      !player.upgradedThisTurn && player.tier < 6
        ? Math.max(0, player.upgradeCost - 1)
        : player.upgradeCost;

    next = updatePlayer(next, player.id, (p) => ({
      ...p,
      gold,
      upgradeCost: discountedCost,
      upgradedThisTurn: false,
      heroPowerUsed: false,
    }));

    next = rollShopForPlayer(next, player.id, rng.fork(`shop:${player.id}:${turn}`));

    // Ysera passive: add a random Dragon from the current tier to the shop
    if (player.id === 0 && player.heroId === "ysera") {
      const allMinionCards = Object.values(MINIONS) as MinionCard[];
      const dragonMinions = allMinionCards.filter(
        (m) => m.tribes.includes("Dragon") && m.tier === player.tier,
      );
      if (dragonMinions.length > 0) {
        const idx = Math.floor(rng.next() % dragonMinions.length);
        const chosen = dragonMinions[idx]!;
        const minionInstance = instantiate(chosen);
        next = updatePlayer(next, player.id, (p) => ({
          ...p,
          shop: [...p.shop, minionInstance],
        }));
      }
    }

    // The Curator passive: ensure shop contains at least one of each tribe on board
    if (player.id === 0 && player.heroId === theCurator.id) {
      next = ensureCuratorShop(next, player.id, rng);
    }

    // King Mukla passive: grant a Banana each turn
    if (player.id === 0 && player.heroId === "king_mukla") {
      next = grantBanana(next, player.id);
    }

    // Activate buddies that have reached their activation turn
    next = activateBuddies(next, player.id, rng);

    // Sindragosa passive: frozen shop minions gain +1/+1 at end of turn
    if (player.id === 0 && player.heroId === "sindragosa" && player.shopFrozen) {
      const shop = player.shop;
      if (shop.length > 0) {
        const buffedShop = shop.map((m) => ({
          ...m,
          atk: m.atk + 1,
          hp: m.hp + 1,
          maxHp: m.maxHp + 1,
        }));
        next = updatePlayer(next, player.id, (p) => ({ ...p, shop: buffedShop }));
      }
    }

    // Jaraxxus passive: demons in shop gain +1/+1 at start of turn
    if (player.id === 0 && player.heroId === "jaraxxus") {
      const shop = player.shop;
      if (shop.length > 0) {
        const buffedShop = shop.map((m) => {
          if (m.tribes.includes("Demon")) {
            return {
              ...m,
              atk: m.atk + 1,
              hp: m.hp + 1,
              maxHp: m.maxHp + 1,
            };
          }
          return m;
        });
        next = updatePlayer(next, player.id, (p) => ({ ...p, shop: buffedShop }));
      }
    }
  }

  return next;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function makeInitialState(seed: number): GameState {
  const rng = makeRng(seed);
  const tribesInLobby = rng.shuffle(ALL_TRIBES).slice(0, LOBBY_TRIBE_COUNT) as Tribe[];
  const pool = buildPool(tribesInLobby);

  const players: PlayerState[] = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    name: i === 0 ? "You" : `AI ${i}`,
    heroId: "",
    hp: 0,
    armor: 0,
    gold: 0,
    tier: 1,
    upgradeCost: TIER_UPGRADE_BASE[2],
    board: [],
    hand: [],
    shop: [],
    shopFrozen: false,
    upgradedThisTurn: false,
    heroPowerUsed: false,
    extraLifeUsed: false,
    eliminated: false,
    placement: null,
    aiMemo: {},
    spells: [],
    discoverOffer: null,
    trinkets: [],
    quests: [],
    buddies: [],
  }));

  // Roll for modifiers per 10-lobby-modifiers.md spec
  const allModifiers: ModifierId[] = ["trinkets", "spells", "anomalies", "quests", "buddies"];
  const activeModifiers: ModifierId[] = [];
  for (const mod of allModifiers) {
    if (rng.next() < 0.5) activeModifiers.push(mod as ModifierId);
  }

  let modifiersState: GameState["modifierState"] = {};

  if (activeModifiers.includes("anomalies")) {
    const anomaly = pickAnomaly(rng);
    const game: GameState = {
      seed,
      phase: { kind: "HeroSelection" },
      turn: 0,
      players,
      tribesInLobby,
      pool,
      pairingsHistory: [],
      modifiers: activeModifiers,
      modifierState: {},
    };
    anomaly.onSetup(game, rng);
    modifiersState = { anomaly: anomaly.id };
  }

  if (activeModifiers.includes("trinkets")) {
    modifiersState = { ...modifiersState, trinkets: [] as TrinketInstance[] };
    const trinketState: GameState = {
      seed,
      phase: { kind: "HeroSelection" },
      turn: 0,
      players,
      tribesInLobby,
      pool,
      pairingsHistory: [],
      modifiers: activeModifiers,
      modifierState: { ...modifiersState },
    };
    for (const player of trinketState.players) {
      const picked = pickTrinketForPlayer(trinketState, player.id, rng);
      if (!picked) continue;
      const instance: TrinketInstance = {
        instanceId: `trinket_${player.id}`,
        cardId: picked.id,
        applied: false,
      };
      trinketState.players[player.id] = {
        ...player,
        trinkets: [
          ...((player as PlayerState & { trinkets?: TrinketInstance[] }).trinkets ?? []),
          instance,
        ],
      };
      modifiersState = {
        ...modifiersState,
        trinkets: [...((modifiersState.trinkets as TrinketInstance[]) ?? []), instance],
      };
    }
  }

  if (activeModifiers.includes("quests")) {
    const questState: GameState = {
      seed,
      phase: { kind: "HeroSelection" },
      turn: 0,
      players,
      tribesInLobby,
      pool,
      pairingsHistory: [],
      modifiers: activeModifiers,
      modifierState: { ...modifiersState },
    };
    const quest = pickQuest(rng);
    const questInstance = createQuestInstance(quest.id, 0, rng);
    const questPlayerState: PlayerState = {
      ...questState.players[0]!,
      quests: [questInstance],
    };
    questState.players[0] = questPlayerState;
    modifiersState = {
      ...modifiersState,
      quests: { 0: questInstance },
    };
  }

  if (activeModifiers.includes("buddies")) {
    const buddyState: GameState = {
      seed,
      phase: { kind: "HeroSelection" },
      turn: 0,
      players,
      tribesInLobby,
      pool,
      pairingsHistory: [],
      modifiers: activeModifiers,
      modifierState: { ...modifiersState },
    };
    const buddy = pickBuddy(rng);
    const buddyInstance = createBuddyInstance(buddy.id, 0, buddy.activationTurn, rng);
    const buddyPlayerState: PlayerState = {
      ...buddyState.players[0]!,
      buddies: [buddyInstance],
    };
    buddyState.players[0] = buddyPlayerState;
    modifiersState = {
      ...modifiersState,
      buddies: { 0: [buddyInstance] },
    };
  }

  return {
    seed,
    phase: { kind: "HeroSelection" },
    turn: 0,
    players,
    tribesInLobby,
    pool,
    pairingsHistory: [],
    modifiers: activeModifiers,
    modifierState: modifiersState,
  };
}

export function rngForTurn(state: GameState, label: string): Rng {
  return makeRng(state.seed).fork(`turn:${state.turn}:${label}`);
}
