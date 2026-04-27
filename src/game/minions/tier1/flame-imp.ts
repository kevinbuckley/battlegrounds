import { defineMinion } from "../define";

export default defineMinion({
  id: "flame_imp",
  name: "Flame Imp",
  tier: 1,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId }) => {
      const player = state.players[playerId];
      if (!player) return state;
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === playerId ? { ...p, hp: Math.max(0, p.hp - 2) } : p,
        ),
      };
    },
  },
});
