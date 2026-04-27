import { defineMinion, instantiate } from "../define";

const FAWN_CARD = defineMinion({
  id: "fawn",
  name: "Fawn",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

export default defineMinion({
  id: "gazelle",
  name: "Gazelle",
  tier: 3,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = ctx.state.players.find((p) => p.id === ctx.playerId);
      if (!player) return ctx.state;
      if (player.board.length >= 7) return ctx.state;

      const fawn = instantiate(FAWN_CARD);
      const newBoard = [...player.board, fawn];

      return {
        ...ctx.state,
        players: ctx.state.players.map((p) =>
          p.id === ctx.playerId ? { ...p, board: newBoard } : p,
        ),
      };
    },
  },
});
