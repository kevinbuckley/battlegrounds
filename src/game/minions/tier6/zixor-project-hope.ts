import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "zixor_project_hope",
  name: "Zixor, Project Hope",
  tier: 6,
  tribes: ["Elemental"],
  baseAtk: 3,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;
      if (player.board.length >= 7) return ctx.state;

      // Find all tier 5 minion cards
      const tier5Cards = Object.values(MINIONS).filter((c) => c.tier === 5);
      if (tier5Cards.length === 0) return ctx.state;

      const chosen = tier5Cards[(ctx.rng.next() * tier5Cards.length) | 0];
      if (!chosen) return ctx.state;
      const summoned = instantiate(chosen);
      const newBoard = [...player.board, summoned];

      return {
        ...ctx.state,
        players: ctx.state.players.map((p) =>
          p.id === ctx.playerId ? { ...p, board: newBoard } : p,
        ),
      };
    },
  },
});
