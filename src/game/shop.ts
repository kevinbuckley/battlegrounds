import type { Rng } from "@/lib/rng";
import {
  COST_BUY,
  COST_REFRESH,
  POOL_COUNTS,
  REFUND_SELL,
  SHOP_SIZE_BY_TIER,
  TIER_ODDS,
  TIER_UPGRADE_BASE,
} from "./economy";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import type {
  GameState,
  MinionCard,
  MinionCardId,
  MinionInstance,
  PlayerId,
  Tier,
  Tribe,
} from "./types";
import { getPlayer, updatePlayer } from "./utils";

// ---------------------------------------------------------------------------
// Pool management
// ---------------------------------------------------------------------------

export function buildPool(activeTribes: Tribe[]): Record<MinionCardId, number> {
  const pool: Record<MinionCardId, number> = {};
  for (const [id, card] of Object.entries(MINIONS)) {
    if (isTribeEligible(card, activeTribes)) {
      pool[id] = POOL_COUNTS[card.tier] ?? 0;
    }
  }
  return pool;
}

function isTribeEligible(card: MinionCard, activeTribes: Tribe[]): boolean {
  if (card.tribes.length === 0) return true;
  if (card.tribes.includes("All")) return activeTribes.length > 0;
  return card.tribes.some((t) => activeTribes.includes(t));
}

// Pick a card-tier slot using the BG probability table, falling back to any
// available tier if the chosen tier is exhausted in the pool.
function pickCardFromPool(
  pool: Record<MinionCardId, number>,
  playerTier: Tier,
  rng: Rng,
): MinionCardId | null {
  const odds = TIER_ODDS[playerTier];

  // Weighted tier selection via cumulative distribution
  let roll = rng.next() * 100;
  let chosenTier: Tier = 1;
  for (let t = 1 as Tier; t <= playerTier; t++) {
    const weight = odds[t as Tier] ?? 0;
    roll -= weight;
    if (roll <= 0) {
      chosenTier = t as Tier;
      break;
    }
    if (weight > 0) chosenTier = t as Tier; // track last tier with weight as fallback
  }

  // Draw from the chosen tier; if empty fall back to any available tier ≤ playerTier
  const inChosenTier = Object.entries(pool)
    .filter(([id, n]) => n > 0 && MINIONS[id]?.tier === chosenTier)
    .map(([id]) => id);

  if (inChosenTier.length > 0) return rng.pick(inChosenTier) as MinionCardId;

  const anyAvailable = Object.entries(pool)
    .filter(([id, n]) => n > 0 && (MINIONS[id]?.tier ?? 99) <= playerTier)
    .map(([id]) => id);

  return anyAvailable.length > 0 ? (rng.pick(anyAvailable) as MinionCardId) : null;
}

export function drawFromPool(
  pool: Record<MinionCardId, number>,
  playerTier: Tier,
  count: number,
  rng: Rng,
): { instances: MinionInstance[]; pool: Record<MinionCardId, number> } {
  const newPool = { ...pool };
  const instances: MinionInstance[] = [];

  for (let i = 0; i < count; i++) {
    const id = pickCardFromPool(newPool, playerTier, rng);
    if (id === null) break;
    const card = MINIONS[id];
    if (!card) break;
    newPool[id] = (newPool[id] ?? 0) - 1;
    instances.push(instantiate(card));
  }

  return { instances, pool: newPool };
}

export function returnToPool(
  pool: Record<MinionCardId, number>,
  instances: MinionInstance[],
): Record<MinionCardId, number> {
  const newPool = { ...pool };
  for (const inst of instances) {
    newPool[inst.cardId] = (newPool[inst.cardId] ?? 0) + 1;
  }
  return newPool;
}

// ---------------------------------------------------------------------------
// Per-player shop roll (called at turn start or after refresh)
// ---------------------------------------------------------------------------

import { checkAndProcessTriples } from "./triples";

export function rollShopForPlayer(state: GameState, playerId: PlayerId, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  if (player.shopFrozen) {
    // Frozen: keep shop, clear freeze for next turn
    return updatePlayer(state, playerId, (p) => ({ ...p, shopFrozen: false }));
  }

  const size = SHOP_SIZE_BY_TIER[player.tier];
  // Return current shop to pool
  const poolAfterReturn = returnToPool(state.pool, player.shop);
  // Draw fresh shop
  const { instances, pool } = drawFromPool(poolAfterReturn, player.tier, size, rng);

  return {
    ...updatePlayer(state, playerId, (p) => ({ ...p, shop: instances })),
    pool,
  };
}

// ---------------------------------------------------------------------------
// Shop actions — each returns a new GameState or throws on invalid input
// ---------------------------------------------------------------------------

export function buyMinion(
  state: GameState,
  playerId: PlayerId,
  shopIndex: number,
  rng: Rng | null = null,
): GameState {
  const player = getPlayer(state, playerId);

  if (player.gold < COST_BUY)
    throw new Error(`Not enough gold to buy (have ${player.gold}, need ${COST_BUY})`);
  if (player.hand.length >= 10) throw new Error("Hand is full");

  const minion = player.shop[shopIndex];
  if (!minion) throw new Error(`No minion at shop index ${shopIndex}`);

  let result = updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - COST_BUY,
    hand: [...p.hand, minion],
    shop: p.shop.filter((_, i) => i !== shopIndex),
  }));

  // Check for triples after adding to hand
  if (rng) {
    result = checkAndProcessTriples(result, playerId, rng);
  }

  return result;
}

export function sellMinion(state: GameState, playerId: PlayerId, boardIndex: number): GameState {
  const player = getPlayer(state, playerId);
  const minion = player.board[boardIndex];
  if (!minion) throw new Error(`No minion at board index ${boardIndex}`);

  const newPool = returnToPool(state.pool, [minion]);
  const newState = updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold + REFUND_SELL,
    board: p.board.filter((_, i) => i !== boardIndex),
  }));
  return { ...newState, pool: newPool };
}

export function playMinionToBoard(
  state: GameState,
  playerId: PlayerId,
  handIndex: number,
  boardIndex: number,
  rng: Rng,
): GameState {
  const player = getPlayer(state, playerId);
  if (player.board.length >= 7) throw new Error("Board is full (max 7 minions)");

  const minion = player.hand[handIndex];
  if (!minion) throw new Error(`No minion at hand index ${handIndex}`);

  const newHand = player.hand.filter((_, i) => i !== handIndex);
  const newBoard = [...player.board];
  const clamped = Math.min(boardIndex, newBoard.length);
  newBoard.splice(clamped, 0, minion);

  let afterPlay = updatePlayer(state, playerId, (p) => ({ ...p, hand: newHand, board: newBoard }));

  const battlecry = minion.hooks?.onBattlecry;
  if (battlecry) {
    afterPlay = battlecry({ self: minion, playerId, state: afterPlay, rng });
  }

  return afterPlay;
}

export function reorderBoard(
  state: GameState,
  playerId: PlayerId,
  from: number,
  to: number,
): GameState {
  const player = getPlayer(state, playerId);
  if (!player.board[from]) throw new Error(`No minion at board index ${from}`);
  const board = [...player.board];
  const [moved] = board.splice(from, 1) as [MinionInstance];
  board.splice(to, 0, moved);
  return updatePlayer(state, playerId, (p) => ({ ...p, board }));
}

export function refreshShop(state: GameState, playerId: PlayerId, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  if (player.gold < COST_REFRESH)
    throw new Error(`Not enough gold to refresh (have ${player.gold}, need ${COST_REFRESH})`);

  const afterGold = updatePlayer(state, playerId, (p) => ({ ...p, gold: p.gold - COST_REFRESH }));
  // Return shop to pool, draw fresh
  const poolAfterReturn = returnToPool(afterGold.pool, player.shop);
  const size = SHOP_SIZE_BY_TIER[player.tier];
  const { instances, pool } = drawFromPool(poolAfterReturn, player.tier, size, rng);

  return {
    ...updatePlayer(afterGold, playerId, (p) => ({ ...p, shop: instances, shopFrozen: false })),
    pool,
  };
}

export function freezeShop(state: GameState, playerId: PlayerId): GameState {
  return updatePlayer(state, playerId, (p) => ({ ...p, shopFrozen: true }));
}

export function upgradeTier(state: GameState, playerId: PlayerId): GameState {
  const player = getPlayer(state, playerId);
  if (player.tier >= 6) throw new Error("Already at max tier");
  if (player.gold < player.upgradeCost)
    throw new Error(`Not enough gold to upgrade (have ${player.gold}, need ${player.upgradeCost})`);

  const newTier = (player.tier + 1) as Tier;
  const nextUpgradeCost =
    newTier < 6 ? (TIER_UPGRADE_BASE[(newTier + 1) as Exclude<Tier, 1>] ?? 0) : 0;

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - p.upgradeCost,
    tier: newTier,
    upgradeCost: nextUpgradeCost,
    upgradedThisTurn: true,
  }));
}
