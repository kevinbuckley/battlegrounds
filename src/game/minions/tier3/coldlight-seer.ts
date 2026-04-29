import { defineMinion } from "../define";

export default defineMinion({
  id: "coldlight_seer",
  name: "Coldlight Seer",
  tier: 3,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId }) => {
      const player = state.players[playerId];
      if (!player) return state;

      const newPlayers = state.players.map((p, i) => {
        if (i !== playerId) return p;
        const newBoard = p.board.map((m) => {
          if (m.tribes.includes("Murloc")) {
            const newHp = m.hp + 2;
            return {
              ...m,
              hp: newHp,
              maxHp: Math.max(m.maxHp, newHp),
            };
          }
          return m;
        });
        return { ...p, board: newBoard };
      });

      return { ...state, players: newPlayers };
    },
  },
});
