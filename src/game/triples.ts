import type { Rng } from "@/lib/rng";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import type { MinionCardId, MinionInstance, PlayerId, Tier } from "./types";
import { getPlayer, updatePlayer } from "./utils";

/**
 * Find all card ids that appear >= 3 times across a player's board + hand.
 * Returns groups of up to 3 for each card that qualifies.
 */
function findTripleGroups(
  board: MinionInstance[],
  hand: MinionInstance[],
): Array<{ cardId: MinionCardId; copies: MinionInstance[] }> {
  const countMap = new Map<MinionCardId, MinionInstance[]>();

  for (const m of board) {
    if (!countMap.has(m.cardId)) countMap.set(m.cardId, []);
    countMap.get(m.cardId)!.push(m);
  }
  for (const m of hand) {
    if (!countMap.has(m.cardId)) countMap.set(m.cardId, []);
    countMap.get(m.cardId)!.push(m);
  }

  const groups: Array<{ cardId: MinionCardId; copies: MinionInstance[] }> = [];
  for (const [cardId, copies] of countMap) {
    while (copies.length >= 3) {
      const trip = copies.splice(0, 3);
      groups.push({ cardId, copies: trip });
    }
  }

  return groups;
}

/**
 * Check for triples across a player's board + hand. Replace every group of 3
 * identical minions with a single golden minion (2× stats). Then discover
 * a random minion from tier+1 and add it to hand.  Return the updated state,
 * or the original if no triples were found.
 */
export function checkAndProcessTriples(
  state: import("./types").GameState,
  playerId: PlayerId,
  rng: Rng,
): import("./types").GameState {
  const player = getPlayer(state, playerId);
  const groups = findTripleGroups(player.board, player.hand);

  if (groups.length === 0) return state;

  let result = state;

  for (const group of groups) {
    const cardId = group.cardId;
    const copies = group.copies;

    const board = [...player.board];
    const hand = [...player.hand];

    // Determine where all 3 copies live originally (for golden placement)
    // and filter them out
    let goldenTarget: { slot: "board" | "hand"; origIndex: number } | null = null;

    for (const c of copies) {
      const hIdx = hand.findIndex((m) => m.instanceId === c.instanceId);
      const bIdx = board.findIndex((m) => m.instanceId === c.instanceId);
      if (hIdx !== -1) {
        if (!goldenTarget) {
          goldenTarget = { slot: "hand", origIndex: hIdx };
        }
        hand.splice(hIdx, 1);
      } else if (bIdx !== -1) {
        if (!goldenTarget) {
          goldenTarget = { slot: "board", origIndex: bIdx };
        }
        board.splice(bIdx, 1);
      }
    }

    // Make the 3rd copy golden (2x stats)
    const baseCard = MINIONS[cardId];
    if (!baseCard) continue;

    const golden: MinionInstance = {
      ...baseCard,
      instanceId: copies[0]!.instanceId,
      cardId,
      golden: true,
      atk: baseCard.baseAtk * 2,
      hp: baseCard.baseHp * 2,
      maxHp: baseCard.baseHp * 2,
      keywords: new Set([...baseCard.baseKeywords]),
      attachments: {},
    };
    const third = copies[2];
    if (!third) continue;

    golden.instanceId = third.instanceId;

    // Place golden at the first removed copy's original position
    let targetIdx = goldenTarget?.origIndex ?? 0;
    const targetArr = goldenTarget?.slot === "hand" ? hand : board;
    if (targetArr.length === 0 || targetIdx >= targetArr.length) {
      targetIdx = 0;
    }
    targetArr.splice(targetIdx, 0, golden);

    result = updatePlayer(result, playerId, (p) => ({ ...p, board, hand }));
  }

  // Discover phase: offer a random minion from tier+1 (only if below tier 6)
  const playerState = getPlayer(result, playerId);
  if (playerState.tier >= 6) return result;

  const nextTier = (playerState.tier + 1) as Tier;
  const eligibleIds = Object.keys(MINIONS).filter(
    (id): id is MinionCardId => MINIONS[id as MinionCardId]?.tier === nextTier,
  );

  if (eligibleIds.length === 0) return result;

  const shuffled = [...eligibleIds].sort(() => rng.next() - 0.5);
  const picks = shuffled.slice(0, Math.min(3, eligibleIds.length));

  if (picks.length === 0) return result;

  const chosenIdx = Math.floor(rng.next() * picks.length);
  const chosen = picks[chosenIdx];

  if (!chosen) return result;

  const cardDef = MINIONS[chosen];
  if (!cardDef) return result;

  const discovered = instantiate(cardDef);

  return updatePlayer(result, playerId, (p) => ({ ...p, hand: [...p.hand, discovered] }));
}
