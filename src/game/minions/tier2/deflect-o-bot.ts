import { defineMinion } from "../define";

export default defineMinion({
  id: "deflect_o_bot",
  name: "Deflect-o-Bot",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: ["divineShield"],
  spellDamage: 0,
  hooks: {
    // Whenever you play a Mech, restore this minion's Divine Shield and
    // give all other friendly Mechs +1 Attack.
    onPlay: ({ state, playerId, self }) => {
      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId
            ? p
            : {
                ...p,
                board: p.board.map((m) =>
                  m.tribes.includes("Mech") && m.instanceId !== self.instanceId
                    ? { ...m, atk: m.atk + 1 }
                    : m.instanceId === self.instanceId
                      ? { ...m, keywords: new Set([...m.keywords, "divineShield" as const]) }
                      : m,
                ),
              },
        ),
      };
    },
  },
});
