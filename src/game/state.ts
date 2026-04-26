import { makeRng, type Rng } from "@/lib/rng";
import { baseGoldForTurn, TIER_UPGRADE_BASE } from "./economy";
import { HEROES } from "./heroes/index";
import {
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
import type { Action, GameState, PlayerState, Tier, Tribe } from "./types";
import { getPlayer, updatePlayer } from "./utils";

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

  // Deduct cost and mark used
  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - cost,
    heroPowerUsed: true,
  }));

  // Apply hero-specific effect
  if (hero.onHeroPower) {
    next = hero.onHeroPower(next, playerId, target, rng);
  }

  return next;
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

  // Transition to recruit once every player has a hero
  const allSelected = afterSelect.players.every((p) => p.heroId !== "");
  if (!allSelected) return afterSelect;

  return beginRecruitTurn(afterSelect, rng);
}

// ---------------------------------------------------------------------------
// Recruit phase
// ---------------------------------------------------------------------------

function stepRecruit(state: GameState, action: Action, rng: Rng): GameState {
  switch (action.kind) {
    case "BuyMinion":
      return buyMinion(state, action.player, action.shopIndex, rng);
    case "SellMinion":
      return sellMinion(state, action.player, action.boardIndex);
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
    default:
      return state;
  }
}

function endTurn(state: GameState, playerId: number, rng: Rng): GameState {
  // In a solo game the human's EndTurn triggers the AI turns then combat.
  // For M1 we just stub: mark the player as done and, once all non-eliminated
  // players have ended, begin combat (which is also stubbed) then next recruit.
  // A real implementation will drive AI actions here.

  // For now: immediately transition to next recruit turn for the human player.
  // This will be replaced by the full turn loop in M4+.
  void playerId;
  const nextTurn = state.turn + 1;
  const afterCombat = { ...state, turn: nextTurn };
  return beginRecruitTurn(afterCombat, rng);
}

// ---------------------------------------------------------------------------
// Combat phase (stub — filled in M4+)
// ---------------------------------------------------------------------------

function stepCombat(state: GameState, _action: Action, _rng: Rng): GameState {
  return state;
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

    // Apply upgrade discount (if didn't upgrade last turn and not at max)
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

    // Roll shop (respects freeze)
    next = rollShopForPlayer(next, player.id, rng.fork(`shop:${player.id}:${turn}`));
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
    eliminated: false,
    placement: null,
    aiMemo: {},
  }));

  return {
    seed,
    phase: { kind: "HeroSelection" },
    turn: 0,
    players,
    tribesInLobby,
    pool,
    pairingsHistory: [],
  };
}

// Helper to derive a turn-scoped RNG from game seed (for replay)
export function rngForTurn(state: GameState, label: string): Rng {
  return makeRng(state.seed).fork(`turn:${state.turn}:${label}`);
}
