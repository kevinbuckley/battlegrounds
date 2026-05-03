import { defineMinion } from "../define";

export default defineMinion({
  id: "pogo_hopper",
  name: "Pogo-Hopper",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;

      const count = player.pogoHoppersPlayed;
      if (count === 0) {
        return {
          ...ctx.state,
          players: ctx.state.players.map((p) =>
            p.id === ctx.playerId ? { ...p, pogoHoppersPlayed: p.pogoHoppersPlayed + 1 } : p,
          ),
        };
      }

      const newBoard = player.board.map((m) => {
        if (m.instanceId !== ctx.self.instanceId) return m;
        return {
          ...m,
          atk: m.atk + count,
          hp: m.hp + count,
        };
      });

      const updatedPlayer = {
        ...player,
        pogoHoppersPlayed: player.pogoHoppersPlayed + 1,
        board: newBoard,
      };

      return {
        ...ctx.state,
        players: ctx.state.players.map((p) => (p.id === ctx.playerId ? updatedPlayer : p)),
      };
    },
  },
});
