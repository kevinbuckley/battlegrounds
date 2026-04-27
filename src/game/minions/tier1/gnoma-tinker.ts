import { defineMinion } from "../define";

export default defineMinion({
  id: "gnoma_tinker",
  name: "Gnoma Tinker",
  tier: 1,
  tribes: ["Elemental"],
  baseAtk: 1,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = ctx.state.players[ctx.playerId];
      return {
        ...ctx.state,
        players: ctx.state.players.map((p, i) =>
          i === ctx.playerId ? { ...p, gold: p.gold + 1 } : p,
        ),
      };
    },
  },
});
