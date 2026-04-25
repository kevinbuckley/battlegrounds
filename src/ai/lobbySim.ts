import type { Rng } from "@/lib/rng";
import { makeRng } from "@/lib/rng";
import { makeInitialState, beginRecruitTurn } from "@/game/state";
import {
  buyMinion,
  freezeShop,
  playMinionToBoard,
  refreshShop,
  reorderBoard,
  sellMinion,
  upgradeTier,
} from "@/game/shop";
import { simulateCombat } from "@/game/combat";
import { calcDamage, applyDamageToPlayer } from "@/game/damage";
import { getAllHeroIds, HEROES } from "@/game/heroes/index";
import { makePlayerView } from "./strategy";
import type { GameState, Action, PlayerId } from "@/game/types";
import type { Strategy } from "./strategy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LobbyResult {
  seed: number;
  placements: Array<{ player: number; strategy: string; placement: number }>;
  turns: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Apply a single recruit-phase action directly (bypassing the state-machine
 * EndTurn side-effect so the lobby sim can drive timing itself).
 */
function applyRecruitAction(state: GameState, action: Action, rng: Rng): GameState {
  switch (action.kind) {
    case "BuyMinion":
      return buyMinion(state, action.player, action.shopIndex);
    case "SellMinion":
      return sellMinion(state, action.player, action.boardIndex);
    case "PlayMinion":
      return playMinionToBoard(state, action.player, action.handIndex, action.boardIndex, rng);
    case "UpgradeTier":
      return upgradeTier(state, action.player);
    case "RefreshShop":
      return refreshShop(state, action.player, rng);
    case "FreezeShop":
      return freezeShop(state, action.player);
    case "ReorderBoard":
      return reorderBoard(state, action.player, action.from, action.to);
    case "EndTurn":
      return state; // lobby sim handles turn advancement
    default:
      return state;
  }
}

/**
 * Randomly pair alive players for combat.  With an odd number of players,
 * the last player in the shuffled list gets a bye (no fight this round).
 */
function createPairings(aliveIds: PlayerId[], rng: Rng): Array<[PlayerId, PlayerId]> {
  const shuffled = rng.shuffle([...aliveIds]);
  const pairs: Array<[PlayerId, PlayerId]> = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    pairs.push([shuffled[i]!, shuffled[i + 1]!]);
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const MAX_TURNS = 60;           // safety limit to prevent infinite loops
const STALEMATE_THRESHOLD = 5;  // consecutive all-draw turns before force-elim

export function runLobby(seed: number, strategies: Strategy[]): LobbyResult {
  if (strategies.length !== 8) {
    throw new Error(`Lobby requires 8 strategies, got ${strategies.length}`);
  }

  const rng = makeRng(seed);
  let state = makeInitialState(seed);

  // ---- Hero selection ----
  const heroPool = getAllHeroIds();
  for (let i = 0; i < 8; i++) {
    const heroId = rng.fork(`hero_pick:${i}`).pick(heroPool);
    const hero = HEROES[heroId]!;
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id !== i ? p : { ...p, heroId, hp: hero.startHp, armor: hero.startArmor },
      ),
    };
  }

  // ---- Begin turn 1 (sets gold, rolls shops, resets per-turn flags) ----
  state = beginRecruitTurn({ ...state, turn: 1 }, rng.fork("begin:1"));

  const placements: Array<{ player: number; strategy: string; placement: number }> = [];
  let placementRank = 8; // 8th place assigned first
  let stalemateTurns = 0; // consecutive turns where all combats were draws

  // ---- Main game loop ----
  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const alivePlayers = state.players.filter((p) => !p.eliminated);
    if (alivePlayers.length <= 1) break;

    // ---- Recruit phase ----
    for (const player of alivePlayers) {
      const strategy = strategies[player.id]!;
      const view = makePlayerView(state, player.id);
      const recruitRng = rng.fork(`recruit:${player.id}:${turn}`);
      const actions = strategy.decideRecruitActions(view, recruitRng);

      for (const action of actions) {
        if (action.kind === "EndTurn") break; // stop applying on EndTurn
        try {
          state = applyRecruitAction(state, action, recruitRng);
        } catch {
          // Invalid action from AI — skip silently
        }
      }
    }

    // ---- Combat phase ----
    const aliveIds = state.players.filter((p) => !p.eliminated).map((p) => p.id);
    const pairings = createPairings(aliveIds, rng.fork(`pairings:${turn}`));

    let anyDamageThisTurn = false;
    for (const [leftId, rightId] of pairings) {
      const leftPlayer = state.players[leftId]!;
      const rightPlayer = state.players[rightId]!;

      const combatRng = rng.fork(`combat:${leftId}v${rightId}:${turn}`);
      const result = simulateCombat(leftPlayer.board, rightPlayer.board, combatRng);

      if (result.winner === "left") {
        const dmg = calcDamage(rightPlayer.tier, result.survivorsLeft);
        state = applyDamageToPlayer(state, rightId, dmg);
        anyDamageThisTurn = true;
      } else if (result.winner === "right") {
        const dmg = calcDamage(leftPlayer.tier, result.survivorsRight);
        state = applyDamageToPlayer(state, leftId, dmg);
        anyDamageThisTurn = true;
      }
      // draws deal no damage
    }

    // ---- Stalemate detection ----
    // When the card pool is tiny all surviving players converge on identical
    // boards; every combat becomes a draw and the game can never end naturally.
    // After STALEMATE_THRESHOLD consecutive all-draw turns, force-eliminate the
    // player with the lowest HP (ties broken by player id).
    if (!anyDamageThisTurn) {
      stalemateTurns++;
      if (stalemateTurns >= STALEMATE_THRESHOLD) {
        const alive = state.players.filter((p) => !p.eliminated);
        if (alive.length > 1) {
          const victim = alive.reduce((a, b) =>
            a.hp < b.hp ? a : b.hp < a.hp ? b : a.id < b.id ? a : b,
          );
          state = applyDamageToPlayer(state, victim.id, victim.hp + victim.armor);
          stalemateTurns = 0;
        }
      }
    } else {
      stalemateTurns = 0;
    }

    // ---- Elimination check ----
    // applyDamageToPlayer already sets eliminated:true when hp<=0, so we
    // detect *newly* eliminated players by p.eliminated && p.placement===null.
    for (const p of state.players) {
      if (p.eliminated && p.placement === null) {
        state = {
          ...state,
          players: state.players.map((pl) =>
            pl.id === p.id ? { ...pl, placement: placementRank } : pl,
          ),
        };
        placements.push({
          player: p.id,
          strategy: strategies[p.id]!.name,
          placement: placementRank,
        });
        placementRank--;
      }
    }

    // ---- Check for winner ----
    const stillAlive = state.players.filter((p) => !p.eliminated);
    if (stillAlive.length <= 1) break;

    // ---- Begin next recruit turn ----
    state = beginRecruitTurn({ ...state, turn: turn + 1 }, rng.fork(`begin:${turn + 1}`));
  }

  // ---- Assign remaining placements (survivors) ----
  const survivors = state.players.filter((p) => !p.eliminated);
  // Sort survivors by HP descending (higher HP = better placement among survivors)
  const sortedSurvivors = [...survivors].sort((a, b) => b.hp - a.hp);
  for (let i = 0; i < sortedSurvivors.length; i++) {
    const rank = i + 1;
    const p = sortedSurvivors[i]!;
    placements.push({ player: p.id, strategy: strategies[p.id]!.name, placement: rank });
  }

  // Sort final placements by placement rank
  placements.sort((a, b) => a.placement - b.placement);

  return { seed, placements, turns: state.turn };
}
