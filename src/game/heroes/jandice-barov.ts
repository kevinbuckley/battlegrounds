import type { Rng } from "@/lib/rng";
import { makeRng } from "@/lib/rng";
import { MINIONS } from "../minions/index";
import { drawFromPool, returnToPool } from "../shop";
import type { GameState, Hero, MinionInstance, PlayerId, Tier, Tribe } from "../types";
import { getPlayer, updatePlayer } from "../utils";

/**
 * Jandice Barov: passive — after selling a minion, add a random minion of the
 * same tier to Bob's Tavern.
 */
export const jandiceBarov: Hero = {
  id: "jandice_barov",
  name: "Jandice Barov",
  description:
    "Passive: After you sell a minion, add a random minion of the same tier to Bob's Tavern.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "passive" },

  onSell: (state: GameState, playerId: PlayerId): GameState => {
    const player = getPlayer(state, playerId);
    const tier = player.tier;
    const pool = state.pool;

    // Find eligible minions at the same tier that are still in the pool
    const eligibleIds: string[] = [];
    for (const [id, count] of Object.entries(pool)) {
      if (count > 0 && (MINIONS[id as keyof typeof MINIONS]?.tier ?? 99) === tier) {
        eligibleIds.push(id);
      }
    }

    if (eligibleIds.length === 0) return state;

    const rng = makeRng(state.seed).fork(`jandice:${playerId}:${state.turn}`);
    const chosenId = rng.pick(eligibleIds);
    const card = MINIONS[chosenId as keyof typeof MINIONS];

    if (!card) return state;

    // Draw one from pool
    const { instances, pool: newPool } = drawFromPool(pool, tier, 1, rng);

    if (instances.length === 0) return state;

    return updatePlayer({ ...state, pool: newPool }, playerId, (p) => ({
      ...p,
      shop: [...p.shop, ...instances],
    }));
  },
};
