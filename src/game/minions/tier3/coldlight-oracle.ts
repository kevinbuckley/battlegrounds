import { drawFromPool } from "../../shop";
import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "coldlight_oracle",
  name: "Coldlight Oracle",
  tier: 3,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const tier = player.tier;
      const pool = ctx.state.pool;

      // Draw 2 random minions from the shop pool at the player's tier.
      const { instances, pool: newPool } = drawFromPool(pool, tier, 2, ctx.rng);

      // Only add minions that were actually drawn (pool may be depleted).
      if (instances.length === 0) return ctx.state;

      return updatePlayer({ ...ctx.state, pool: newPool }, ctx.playerId, (p) => ({
        ...p,
        hand: [...p.hand, ...instances],
      }));
    },
  },
});
