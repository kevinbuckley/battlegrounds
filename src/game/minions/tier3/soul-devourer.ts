import { defineMinion } from "../define";

export default defineMinion({
  id: "soul_devourer",
  name: "Soul Devourer",
  tier: 3,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self }) => {
      const player = state.players[playerId];
      if (!player) return state;

      // Find a friendly Demon on the board (excluding self which isn't on board yet)
      const target = player.board.find(
        (m) => m.instanceId !== self.instanceId && m.tribes.includes("Demon"),
      );

      if (!target) return state;

      // Remove the target from the board
      const newBoard = player.board.filter((m) => m.instanceId !== target.instanceId);

      // Gain the consumed minion's stats
      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId
            ? p
            : {
                ...p,
                board: newBoard.map((m) =>
                  m.instanceId === self.instanceId
                    ? {
                        ...m,
                        atk: m.atk + target.atk,
                        hp: m.hp + target.hp,
                        maxHp: m.maxHp + target.hp,
                      }
                    : m,
                ),
              },
        ),
      };
    },
  },
});
