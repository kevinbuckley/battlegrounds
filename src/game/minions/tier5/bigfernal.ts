import { defineMinion } from "../define";

export default defineMinion({
  id: "bigfernal",
  name: "Bigfernal",
  tier: 5,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onShopSummon: (ctx) => {
      const summoned = ctx.summoned;
      if (!summoned) return ctx.state;
      if (!summoned.tribes.includes("Demon")) return ctx.state;
      if (summoned.instanceId === ctx.self.instanceId) return ctx.state;

      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;

      const newBoard = player.board.map((m) => {
        if (m.instanceId !== ctx.self.instanceId) return m;
        return {
          ...m,
          atk: m.atk + 2,
          hp: m.hp + 2,
          maxHp: m.maxHp + 2,
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
