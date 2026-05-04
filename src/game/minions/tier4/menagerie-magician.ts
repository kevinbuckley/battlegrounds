import { defineMinion } from "../define";

export default defineMinion({
  id: "menagerie_magician",
  name: "Menagerie Magician",
  tier: 4,
  tribes: [],
  baseAtk: 4,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, rng }) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      const tribes: Array<"Beast" | "Dragon" | "Murloc"> = ["Beast", "Dragon", "Murloc"];
      let modified = false;
      let newState = state;

      for (const tribe of tribes) {
        const target = player.board.find(
          (m) => m.cardId !== "menagerie_magician" && m.tribes.includes(tribe),
        );
        if (!target) continue;

        newState = {
          ...newState,
          players: newState.players.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  board: p.board.map((m) =>
                    m.instanceId === target.instanceId ? { ...m, atk: m.atk + 2, hp: m.hp + 2 } : m,
                  ),
                }
              : p,
          ),
        };
        modified = true;
      }

      return modified ? newState : state;
    },
  },
});
