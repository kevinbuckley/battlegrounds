import type { Rng } from "@/lib/rng";
import type { AnomalyCard, GameState } from "../types";

export const goldenTouch: AnomalyCard = {
  id: "golden_touch",
  name: "Golden Touch",
  description: "All shop minions spawn with Divine Shield.",
  onSetup: (state: GameState, _rng: Rng): void => {
    for (const player of state.players) {
      if (player.eliminated) continue;
      const newShop = player.shop.map((minion) => ({
        ...minion,
        keywords: new Set([...minion.keywords, "divineShield" as const]),
      }));
      const idx = state.players.indexOf(player);
      state.players[idx] = { ...player, shop: newShop };
    }
  },
};

export const heavyHitters: AnomalyCard = {
  id: "heavy_hitters",
  name: "Heavy Hitters",
  description: "Only minions with 3+ attack appear in the shop.",
  onSetup: (state: GameState, _rng: Rng): void => {
    for (const player of state.players) {
      if (player.eliminated) continue;
      const filteredShop = player.shop.filter((minion) => minion.atk >= 3);
      const idx = state.players.indexOf(player);
      state.players[idx] = { ...player, shop: filteredShop };
    }
  },
};

export const doubleDown: AnomalyCard = {
  id: "double_down",
  name: "Double Down",
  description: "All shop minions spawn with Cleave.",
  onSetup: (state: GameState, _rng: Rng): void => {
    for (const player of state.players) {
      if (player.eliminated) continue;
      const newShop = player.shop.map((minion) => ({
        ...minion,
        keywords: new Set([...minion.keywords, "cleave" as const]),
      }));
      const idx = state.players.indexOf(player);
      state.players[idx] = { ...player, shop: newShop };
    }
  },
};

export const liquified: AnomalyCard = {
  id: "liquified",
  name: "Liquified",
  description: "All shop minions spawn with Rush.",
  onSetup: (state: GameState, _rng: Rng): void => {
    for (const player of state.players) {
      if (player.eliminated) continue;
      const newShop = player.shop.map((minion) => ({
        ...minion,
        keywords: new Set([...minion.keywords, "rush" as const]),
      }));
      const idx = state.players.indexOf(player);
      state.players[idx] = { ...player, shop: newShop };
    }
  },
};

export const armoredUp: AnomalyCard = {
  id: "armored_up",
  name: "Armored Up",
  description: "All shop minions spawn with 1 additional Health.",
  onSetup: (state: GameState, _rng: Rng): void => {
    for (const player of state.players) {
      if (player.eliminated) continue;
      const newShop = player.shop.map((minion) => ({
        ...minion,
        hp: minion.hp + 1,
      }));
      const idx = state.players.indexOf(player);
      state.players[idx] = { ...player, shop: newShop };
    }
  },
};

export const tavernDiscount: AnomalyCard = {
  id: "tavern_discount",
  name: "Tavern Discount",
  description: "All shop minions cost 1 less gold (minimum 1).",
  onSetup: (_state: GameState, _rng: Rng): void => {
    // Discount is applied per-shop-roll in shop.ts based on modifierState.anomaly.
  },
};

export const bigLeague: AnomalyCard = {
  id: "big_league",
  name: "Big League",
  description: "All minions start combat with +1/+1.",
  onSetup: (_state: GameState, _rng: Rng): void => {
    // Big League is applied per-combat in combat.ts based on modifierState.anomaly.
  },
};

export const extraLife: AnomalyCard = {
  id: "extra_life",
  name: "Extra Life",
  description: "Each player gets one free revive the first time they reach 0 HP.",
  onSetup: (state: GameState, _rng: Rng): void => {
    for (const player of state.players) {
      if (player.eliminated) continue;
      const idx = state.players.indexOf(player);
      state.players[idx] = { ...player, extraLifeUsed: false };
    }
  },
};

const ALL_ANOMALIES: AnomalyCard[] = [
  goldenTouch,
  heavyHitters,
  doubleDown,
  liquified,
  armoredUp,
  tavernDiscount,
  bigLeague,
  extraLife,
];

export function getAnomaly(id: string): AnomalyCard {
  const match = ALL_ANOMALIES.find((a) => a.id === id);
  if (!match) throw new Error(`Unknown anomaly: ${id}`);
  return match;
}

export function getAllAnomalyIds(): string[] {
  return ALL_ANOMALIES.map((a) => a.id);
}

export function pickAnomaly(rng: Rng): AnomalyCard {
  return rng.pick(ALL_ANOMALIES);
}
