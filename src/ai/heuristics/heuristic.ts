import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard, sellMinion, upgradeTier } from "@/game/shop";
import { SPELLS } from "@/game/spells/index";
import type { Action, MinionInstance, PlayerState } from "@/game/types";
import type { Rng } from "@/lib/rng";
import type { PlayerView, Strategy } from "../strategy";

function isSpellInShop(m: MinionInstance): boolean {
  return SPELLS[m.cardId as keyof typeof SPELLS] !== undefined;
}

// ---------------------------------------------------------------------------
// Minion scoring
// ---------------------------------------------------------------------------

/**
 * Base score: stat-ball + slight bonus for keywords.
 */
function minionScore(m: MinionInstance): number {
  let score = m.atk + m.hp;
  if (m.keywords.has("divineShield")) score += 3;
  if (m.keywords.has("taunt")) score += 1;
  if (m.keywords.has("poisonous")) score += 4;
  if (m.keywords.has("windfury")) score += 2;
  if (m.keywords.has("reborn")) score += 2;
  return score;
}

/**
 * Board synergy bonus: extra points for a shop minion if its tribes match
 * the majority tribe on the current board.
 */
function synergyBonus(m: MinionInstance, board: MinionInstance[]): number {
  if (board.length === 0 || m.tribes.length === 0) return 0;
  const boardTribes = board.flatMap((b) => b.tribes);
  const mTribeSet = new Set(m.tribes);
  const overlap = boardTribes.filter((t) => mTribeSet.has(t)).length;
  return overlap * 2;
}

/**
 * Combined shop score used for buy decisions.
 */
function shopMinionScore(shop: MinionInstance, board: MinionInstance[]): number {
  return minionScore(shop) + synergyBonus(shop, board);
}

function bestShopIndex(shop: MinionInstance[], board: MinionInstance[]): number {
  if (shop.length === 0) return -1;
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < shop.length; i++) {
    const item = shop[i]!;
    if (isSpellInShop(item)) continue;
    const score = shopMinionScore(item, board);
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}

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
// Tier-up decision
// ---------------------------------------------------------------------------

/**
 * Should we spend gold on upgrading the tavern tier this turn?
 *
 * Upgrade rule: cost is low enough that we can still afford at least 1 buy
 * (costs 3 gold) after upgrading.  Equivalent to: upgradeCost ≤ gold − 3.
 *
 * At very late turns, also upgrade greedily if cost ≤ 2 (just do it).
 */
function shouldUpgrade(player: PlayerState): boolean {
  if (player.tier >= 6) return false;
  const cost = player.upgradeCost;
  if (cost === 0) return true; // free upgrade, always take it
  return cost <= player.gold - 3; // still leaves room for a buy
}

// ---------------------------------------------------------------------------
// Heuristic strategy — Medium/Hard difficulty
// ---------------------------------------------------------------------------

export const heuristic: Strategy = {
  name: "heuristic",
  decideRecruitActions(view: PlayerView, rng: Rng): Action[] {
    const { state, me } = view;
    const actions: Action[] = [];
    let sim = state;

    // --- Tier upgrade (do this first; it adjusts gold before buy decisions) ---
    {
      const player = sim.players[me]!;
      if (shouldUpgrade(player)) {
        try {
          sim = upgradeTier(sim, me);
          actions.push({ kind: "UpgradeTier", player: me });
        } catch {
          // Can't afford or already max — skip
        }
      }
    }

    // --- Buy loop ---
    let buying = true;
    while (buying) {
      const player = sim.players[me]!;
      if (player.gold < 3 || player.hand.length >= 10) break;

      const idx = bestShopIndex(player.shop, player.board);
      if (idx === -1) break;

      // Check: is the best shop minion worth buying vs. what's on our board?
      const shopCandidate = player.shop[idx]!;
      const boardWorstScore =
        player.board.length > 0 ? minionScore(player.board[weakestBoardIndex(player.board)]!) : -1;
      const candidateScore = shopMinionScore(shopCandidate, player.board);

      // Only buy if better than the weakest board minion (accounting for sell refund)
      // or if board isn't full yet.
      if (player.board.length < 7 || candidateScore > boardWorstScore + 1) {
        try {
          sim = buyMinion(sim, me, idx);
          actions.push({ kind: "BuyMinion", player: me, shopIndex: idx });
        } catch {
          buying = false;
        }
      } else {
        buying = false;
      }
    }

    // --- Sell weakest board minion if board is full and hand has better ---
    {
      const player = sim.players[me]!;
      if (player.board.length >= 7 && player.hand.length > 0) {
        const weakIdx = weakestBoardIndex(player.board);
        const weakScore = minionScore(player.board[weakIdx]!);
        const handBest = Math.max(...player.hand.map(minionScore));
        if (handBest > weakScore) {
          try {
            sim = sellMinion(sim, me, weakIdx);
            actions.push({ kind: "SellMinion", player: me, boardIndex: weakIdx });
          } catch {
            // ignore
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

// Re-export card tier for use in lobby sim
export function cardTier(cardId: string): number {
  return MINIONS[cardId]?.tier ?? 1;
}
