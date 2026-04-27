import type { Tier } from "./types";

export const GOLD_PER_TURN_START = 3;
export const GOLD_PER_TURN_CAP = 10;
export const COST_BUY = 3;
export const REFUND_SELL = 1;
export const COST_REFRESH = 1;
export const COST_FREEZE = 0;

export function baseGoldForTurn(turn: number): number {
  return Math.min(GOLD_PER_TURN_START + turn - 1, GOLD_PER_TURN_CAP);
}

export const TIER_UPGRADE_BASE: Record<Exclude<Tier, 1>, number> = {
  2: 5,
  3: 7,
  4: 8,
  5: 9,
  6: 10,
};

export const SHOP_SIZE_BY_TIER: Record<Tier, number> = {
  1: 3,
  2: 4,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
};

// Probability (0–100) that a single shop slot comes from each card tier,
// given the player's current tavern tier. Rows must sum to 100.
// Values are approximate to current BG; tune after playtesting.
export const TIER_ODDS: Record<Tier, Partial<Record<Tier, number>>> = {
  1: { 1: 100 },
  2: { 1: 60, 2: 40 },
  3: { 1: 40, 2: 35, 3: 25 },
  4: { 1: 25, 2: 25, 3: 25, 4: 25 },
  5: { 1: 20, 2: 20, 3: 20, 4: 20, 5: 20 },
  6: { 1: 15, 2: 15, 3: 20, 4: 20, 5: 15, 6: 15 },
};

export const POOL_COUNTS: Record<Tier, number> = {
  1: 18,
  2: 15,
  3: 13,
  4: 11,
  5: 9,
  6: 7,
};
