import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "sellemental",
  name: "Sellemental",
  tier: 1,
  tribes: ["Elemental"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onSell: (ctx) => {
      const elemental = instantiate(
        defineMinion({
          id: "sellemental_token",
          name: "Elemental",
          tier: 1,
          tribes: ["Elemental"],
          baseAtk: 1,
          baseHp: 1,
          baseKeywords: [],
          spellDamage: 0,
          hooks: {},
        }),
      );
      const player = ctx.state.players[ctx.playerId];
      return {
        ...ctx.state,
        players: ctx.state.players.map((p, i) =>
          i === ctx.playerId ? { ...p, hand: [...p.hand, elemental] } : p,
        ),
      };
    },
  },
});
