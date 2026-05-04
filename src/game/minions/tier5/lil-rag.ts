import { defineMinion } from "../define";

export default defineMinion({
  id: "lil-rag",
  name: "Lil' Rag",
  tier: 5,
  tribes: ["Elemental"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onPlay: ({ state, playerId, self }) => {
      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId
            ? p
            : {
                ...p,
                board: p.board.map((m) =>
                  m.instanceId !== self.instanceId && m.tribes.includes("Elemental")
                    ? { ...m, atk: m.atk + 1, hp: m.hp + 1, maxHp: m.maxHp + 1 }
                    : m,
                ),
              },
        ),
      };
    },
  },
});
