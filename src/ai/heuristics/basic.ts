import { buyMinion, playMinionToBoard } from "@/game/shop";
import type { Action, MinionInstance } from "@/game/types";
import type { Rng } from "@/lib/rng";
import type { PlayerView, Strategy } from "../strategy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Index of the cheapest shop minion. -1 if shop is empty. */
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

    // --- Buy cheapest affordable minion ---
    let buying = true;
    while (buying) {
      const player = sim.players[me]!;
      if (player.gold < 3 || player.hand.length >= 10) break;

      const idx = cheapestShopIndex(player.shop, player.gold);
      if (idx === -1) break;

      try {
        sim = buyMinion(sim, me, idx);
        actions.push({ kind: "BuyMinion", player: me, shopIndex: idx });
      } catch {
        buying = false;
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

    actions.push({ kind: "EndTurn", player: me });
    return actions;
  },
};
