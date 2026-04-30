import { buyMinion, playMinionToBoard, refreshShop } from "@/game/shop";
import type { Action, MinionInstance } from "@/game/types";
import type { Rng } from "@/lib/rng";
import type { PlayerView, Strategy } from "../strategy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the first tribe present on the board. Returns empty array if board
 * is empty or has no tribes.
 */
function firstBoardTribe(board: MinionInstance[]): string[] {
  for (const m of board) {
    if (m.tribes.length > 0) return m.tribes;
  }
  return [];
}

/**
 * Index of the cheapest shop minion. -1 if shop is empty.
 */
function cheapestShopIndex(shop: MinionInstance[], gold: number): number {
  if (shop.length === 0) return -1;
  let cheapest = -1;
  let cheapestCost = Infinity;
  for (let i = 0; i < shop.length; i++) {
    const m = shop[i]!;
    const cost = m.atk + m.hp; // cheapest = lowest stat-ball
    if (cost < cheapestCost && cost <= gold) {
      cheapest = i;
      cheapestCost = cost;
    }
  }
  return cheapest;
}

/**
 * Index of the first shop minion matching a tribe, -1 if none.
 */
function matchingTribeIndex(shop: MinionInstance[], gold: number, tribe: string[]): number {
  if (shop.length === 0 || tribe.length === 0) return -1;
  for (let i = 0; i < shop.length; i++) {
    const m = shop[i]!;
    if (m.tribes.some((t) => tribe.includes(t)) && m.atk + m.hp <= gold) {
      return i;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Basic strategy: buy cheapest affordable minion, play all to board.
// This is the "Very Easy" difficulty AI.
// ---------------------------------------------------------------------------

export const basic: Strategy = {
  name: "basic",
  decideRecruitActions(view: PlayerView, rng: Rng): Action[] {
    const { state, me } = view;
    const actions: Action[] = [];
    let sim = state;

    // --- Buy cheapest affordable minion, preferring tribe match ---
    let buying = true;
    while (buying) {
      const player = sim.players[me]!;
      if (player.gold < 3 || player.hand.length >= 10) break;

      // Check if board has a tribe to match
      const tribe = firstBoardTribe(player.board);
      let idx: number;
      if (tribe.length > 0) {
        // Prefer a minion matching the board's first tribe
        idx = matchingTribeIndex(player.shop, player.gold, tribe);
        if (idx === -1) {
          // Fall back to cheapest if no tribe match
          idx = cheapestShopIndex(player.shop, player.gold);
        }
      } else {
        idx = cheapestShopIndex(player.shop, player.gold);
      }
      if (idx === -1) break;

      try {
        sim = buyMinion(sim, me, idx);
        actions.push({ kind: "BuyMinion", player: me, shopIndex: idx });
      } catch {
        buying = false;
      }
    }

    // --- Refresh shop if AI has extra gold and no affordable minion ---
    {
      const player = sim.players[me]!;
      if (player.gold >= 3 && player.shop.length > 0) {
        const idx = cheapestShopIndex(player.shop, player.gold);
        if (idx === -1) {
          try {
            sim = refreshShop(sim, me, rng);
            actions.push({ kind: "RefreshShop", player: me });
          } catch {
            // ignore refresh failure
          }
        }
      }
    }

    // --- Play all hand minions to board ---
    let playing = true;
    while (playing) {
      const player = sim.players[me]!;
      if (player.hand.length === 0 || player.board.length >= 7) break;

      const boardPos = player.board.length;
      try {
        sim = playMinionToBoard(sim, me, 0, boardPos, rng);
        actions.push({ kind: "PlayMinion", player: me, handIndex: 0, boardIndex: boardPos });
      } catch {
        playing = false;
      }
    }

    // --- Sort board by ATK descending before combat ---
    {
      const player = sim.players[me]!;
      player.board.sort((a, b) => b.atk - a.atk);
    }

    actions.push({ kind: "EndTurn", player: me });
    return actions;
  },
};
