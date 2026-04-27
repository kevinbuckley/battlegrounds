import { defineMinion } from "../define";

export default defineMinion({
  id: "vulgar_homunculus",
  name: "Vulgar Homunculus",
  tier: 2,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;

      const newPlayers = ctx.state.players.map((p) =>
        p.id === ctx.playerId ? { ...p, hp: p.hp - 2 } : p,
      );

      return { ...ctx.state, players: newPlayers };
    },
  },
});
