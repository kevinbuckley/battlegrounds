import { defineMinion } from "../define";

export default defineMinion({
  id: "mama_bear",
  name: "Mama Bear",
  tier: 6,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
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
        if (m.instanceId !== ctx.self.instanceId) return m;
        return {
          ...m,
          atk: m.atk + 5,
          hp: m.hp + 5,
          maxHp: m.maxHp + 5,
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
