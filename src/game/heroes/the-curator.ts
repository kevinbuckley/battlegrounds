import type { Rng } from "@/lib/rng";
import { instantiate } from "../minions/define";
import { MINIONS } from "../minions/index";
import type { Hero, MinionCard, MinionInstance } from "../types";

/**
 * The Curator: passive — the shop always contains at least one minion of
 * each tribe represented on your board after rolling.
 */
export const theCurator: Hero = {
  id: "the_curator",
  name: "The Curator",
  description: "Your shop always contains at least one of each tribe on your board.",
  startHp: 40,
  startArmor: 5,
  power: { kind: "passive" },
};

/**
 * Ensure the shop contains at least one minion of each tribe present on
 * the player's board. Replaces excess shop slots (beyond the target size)
 * with minions of missing tribes, preserving deterministic RNG ordering.
 */
export function ensureCuratorShop(
  state: import("../types").GameState,
  playerId: import("../types").PlayerId,
  rng: Rng,
): import("../types").GameState {
  const player = state.players[playerId];
  if (!player) return state;

  // Collect tribes present on the board (excluding "All" which matches everything)
  const boardTribes = new Set<string>();
  for (const m of player.board) {
    for (const t of m.tribes) {
      if (t !== "All") {
        boardTribes.add(t);
      }
    }
  }

  if (boardTribes.size === 0) return state;

  const shop = [...player.shop];
  const targetSize = 3 + Math.min(player.tier - 1, 4); // matches SHOP_SIZE_BY_TIER
  const maxShopSize = Math.min(targetSize, 7);

  // Check which tribes are already represented in the shop
  const shopTribes = new Set<string>();
  for (const m of shop) {
    if ("tribes" in m) {
      for (const t of (m as { tribes: string[] }).tribes) {
        if (t !== "All") {
          shopTribes.add(t);
        }
      }
    }
  }

  // Find tribes that are on the board but NOT in the shop
  const missingTribes = Array.from(boardTribes).filter((t) => !shopTribes.has(t));

  if (missingTribes.length === 0) return state;

  let currentShop = shop;

  for (const tribe of missingTribes) {
    // Find minions of this tribe at the player's tier
    const candidates: MinionCard[] = Object.values(MINIONS)
      .filter(
        (mc) => mc.tier === player.tier && mc.tribes.includes(tribe as import("../types").Tribe),
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    if (candidates.length === 0) continue;

    const chosen = rng.pick(candidates);
    const instance = instantiate(chosen);

    // If shop is at max size, remove the last slot and add the new minion
    // Otherwise just add to shop
    if (currentShop.length >= maxShopSize) {
      currentShop = [...currentShop.slice(0, -1), instance];
    } else {
      currentShop = [...currentShop, instance];
    }
  }

  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, shop: currentShop } : p)),
  };
}
