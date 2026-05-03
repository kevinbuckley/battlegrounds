import { defineMinion } from "../define";

export default defineMinion({
  id: "pack_leader",
  name: "Pack Leader",
  tier: 2,
  tribes: ["Beast"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onShopSummon: (ctx) => {
      const summoned = ctx.summoned;
      if (!summoned) return ctx.state;
      if (!summoned.tribes.includes("Beast")) return ctx.state;

      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;

      const newBoard = player.board.map((m) => {
        if (m.instanceId !== summoned.instanceId) return m;
        return {
          ...m,
          atk: m.atk + 3,
        };
      });

      return {
        ...ctx.state,
        players: ctx.state.players.map((p) =>
          p.id === ctx.playerId ? { ...p, board: newBoard } : p,
        ),
      };
    },
  },
});
