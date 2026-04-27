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

const ALL_ANOMALIES: AnomalyCard[] = [goldenTouch, heavyHitters, doubleDown];

export function getAnomaly(id: string): AnomalyCard {
  const match = ALL_ANOMALIES.find((a) => a.id === id);
  if (!match) throw new Error(`Unknown anomaly: ${id}`);
  return match;
}

export function getAllAnomalyIds(): string[] {
  return ALL_ANOMALIES.map((a) => a.id);
}

export function pickAnomaly(rng: Rng): AnomalyCard {
  const idx = Math.floor(rng.next() % ALL_ANOMALIES.length);
  return ALL_ANOMALIES[idx]!;
}
