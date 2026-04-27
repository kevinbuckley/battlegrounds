import { defineMinion } from "../define";

export default defineMinion({
  id: "metaltooth_leaper",
  name: "Metaltooth Leaper",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Battlecry: Give all OTHER friendly Mechs +2 ATK
    onBattlecry: ({ state, playerId, self }) => {
      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId
            ? p
            : {
                ...p,
                board: p.board.map((m) =>
                  m.instanceId !== self.instanceId && m.tribes.includes("Mech")
                    ? { ...m, atk: m.atk + 2 }
                    : m,
                ),
              },
        ),
      };
    },
  },
});
