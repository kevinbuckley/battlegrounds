import type { MinionInstance } from "../../types";
import { defineMinion, nextInstanceId } from "../define";

export default defineMinion({
  id: "deck_swabbie",
  name: "Deck Swabbie",
  tier: 1,
  tribes: ["Pirate"],
  baseAtk: 2,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self }) => {
      const player = state.players[playerId];
      if (!player) return state;

      // Find a friendly Pirate on the board (excluding self which isn't on board yet)
      const target = player.board.find(
        (m) => m.instanceId !== self.instanceId && m.tribes.includes("Pirate"),
      );

      if (!target) return state;

      const targetIndex = player.board.indexOf(target);
      const updatedBoard = player.board.map((m, i) => {
        if (i !== targetIndex) return m;
        return {
          ...m,
          atk: m.atk + 1,
          hp: m.hp + 1,
          maxHp: m.maxHp + 1,
        };
      });

      return {
        ...state,
        players: state.players.map((p, i) => (i !== playerId ? p : { ...p, board: updatedBoard })),
      };
    },
  },
});
