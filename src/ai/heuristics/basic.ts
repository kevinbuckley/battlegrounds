import { COST_BUY } from "@/game/economy";
import { getHero } from "@/game/heroes/index";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard, refreshShop } from "@/game/shop";
import { step } from "@/game/state";
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
 * "Cheapest" = lowest stat-ball among affordable minions.
 * Affordability is determined by actual gold cost (3g or bountyCost), not stat-ball.
 */
function cheapestShopIndex(shop: MinionInstance[], gold: number): number {
  if (shop.length === 0) return -1;
  let cheapest = -1;
  let cheapestScore = Infinity;
  for (let i = 0; i < shop.length; i++) {
    const m = shop[i]!;
    const card = MINIONS[m.cardId];
    if (!card) continue;
    const bountyCost = card.bountyCost ?? 0;
    const baseCost = bountyCost > 0 ? bountyCost : COST_BUY;
    const actualCost = Math.max(1, baseCost - (m.discount ?? 0));
    if (actualCost > gold) continue;
    const score = m.atk + m.hp;
    if (score < cheapestScore) {
      cheapest = i;
      cheapestScore = score;
    }
  }
  return cheapest;
}

/**
 * Index of the first shop minion matching a tribe, -1 if none.
 * Affordability is determined by actual gold cost, not stat-ball.
 */
function matchingTribeIndex(shop: MinionInstance[], gold: number, tribe: string[]): number {
  if (shop.length === 0 || tribe.length === 0) return -1;
  for (let i = 0; i < shop.length; i++) {
    const m = shop[i]!;
    if (!m.tribes.some((t) => tribe.includes(t))) continue;
    const card = MINIONS[m.cardId];
    if (!card) continue;
    const bountyCost = card.bountyCost ?? 0;
    const baseCost = bountyCost > 0 ? bountyCost : COST_BUY;
    const actualCost = Math.max(1, baseCost - (m.discount ?? 0));
    if (actualCost <= gold) {
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

    // --- Use hero power if available (real Battlegrounds AIs use hero powers) ---
    {
      const player = sim.players[me]!;
      const hero = getHero(player.heroId);
      if (
        hero &&
        hero.power.kind === "active" &&
        !player.heroPowerUsed &&
        player.gold >= hero.power.cost
      ) {
        try {
          sim = step(sim, { kind: "HeroPower", player: me, target: null }, rng);
          actions.push({ kind: "HeroPower", player: me, target: null });
        } catch {
          // ignore hero power failure
        }
      }
    }

    // --- Play all hand minions to board, battlecry minions first ---
    {
      let playing = true;
      while (playing) {
        const player = sim.players[me]!;
        if (player.hand.length === 0 || player.board.length >= 7) break;

        // Find the best hand minion: prefer battlecry, then by index
        const handWithBattlecry = player.hand
          .map((m, i) => ({ index: i, hasBattlecry: !!MINIONS[m.cardId]?.hooks?.onBattlecry }))
          .sort((a, b) => (b.hasBattlecry ? 1 : 0) - (a.hasBattlecry ? 1 : 0));

        const targetIndex = handWithBattlecry[0]!.index;
        const boardPos = player.board.length;
        try {
          sim = playMinionToBoard(sim, me, targetIndex, boardPos, rng);
          actions.push({
            kind: "PlayMinion",
            player: me,
            handIndex: targetIndex,
            boardIndex: boardPos,
          });
        } catch {
          playing = false;
        }
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
