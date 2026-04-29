import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "kalecgos_arcane_aspect",
  name: "Kalecgos, Arcane Aspect",
  tier: 6,
  tribes: ["Dragon"],
  baseAtk: 4,
  baseHp: 8,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onCast: (ctx) => {
      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;
      const newBoard = player.board.map((m) => ({
        ...m,
        atk: m.atk + 1,
        hp: m.hp + 1,
        maxHp: m.maxHp + 1,
      }));
      return {
        ...ctx.state,
        players: ctx.state.players.map((p) =>
          p.id === ctx.playerId ? { ...p, board: newBoard } : p,
        ),
      };
    },
  },
});
