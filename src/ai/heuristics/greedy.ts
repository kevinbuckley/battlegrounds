import type { Rng } from "@/lib/rng";
import type { Action, MinionInstance } from "@/game/types";
import { buyMinion, playMinionToBoard, sellMinion } from "@/game/shop";
import type { PlayerView, Strategy } from "../strategy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple stat-ball score: higher = more valuable. */
function minionScore(m: MinionInstance): number {
  return m.atk + m.hp;
}

/** Index of the shop minion with the best score. -1 if shop is empty. */
function bestShopIndex(shop: MinionInstance[]): number {
  if (shop.length === 0) return -1;
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < shop.length; i++) {
    const score = minionScore(shop[i]!);
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}

/** Index of the weakest board minion. */
function weakestBoardIndex(board: MinionInstance[]): number {
  let worst = 0;
  let worstScore = Infinity;
  for (let i = 0; i < board.length; i++) {
    const score = minionScore(board[i]!);
    if (score < worstScore) {
      worst = i;
      worstScore = score;
    }
  }
  return worst;
}

// ---------------------------------------------------------------------------
// Greedy strategy: buy highest-stat minion, sell weakest if needed, play all.
// This is the "Easy" difficulty AI.
// ---------------------------------------------------------------------------

export const greedy: Strategy = {
  name: "greedy",
  decideRecruitActions(view: PlayerView, rng: Rng): Action[] {
    const { state, me } = view;
    const actions: Action[] = [];
    let sim = state;

    // --- Buy loop ---
    let buying = true;
    while (buying) {
      const player = sim.players[me]!;
      if (player.gold < 3 || player.hand.length >= 10) break;

      const idx = bestShopIndex(player.shop);
      if (idx === -1) break;

      try {
        sim = buyMinion(sim, me, idx);
        actions.push({ kind: "BuyMinion", player: me, shopIndex: idx });
      } catch {
        buying = false;
      }
    }

    // --- Sell weakest board minion if board is full and we have hand cards ---
    {
      const player = sim.players[me]!;
      if (player.board.length >= 7 && player.hand.length > 0) {
        const weakIdx = weakestBoardIndex(player.board);
        try {
          sim = sellMinion(sim, me, weakIdx);
          actions.push({ kind: "SellMinion", player: me, boardIndex: weakIdx });
        } catch {
          // ignore
        }
      }
    }

    // --- Play all hand minions to board ---
    let playing = true;
    while (playing) {
      const player = sim.players[me]!;
      if (player.hand.length === 0 || player.board.length >= 7) break;

      const boardPos = player.board.length; // append to end
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
