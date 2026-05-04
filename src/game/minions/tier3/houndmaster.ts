import type { MinionInstance } from "../../types";
import { defineMinion } from "../define";

export default defineMinion({
  id: "houndmaster",
  name: "Houndmaster",
  tier: 3,
  tribes: [],
  baseAtk: 4,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self }) => {
      const player = state.players[playerId];
      if (!player) return state;

      // Find a friendly Beast on the board (excluding self which isn't on board yet)
      const target = player.board.find(
        (m) => m.instanceId !== self.instanceId && m.tribes.includes("Beast"),
      );

      if (!target) return state;

      const targetIndex = player.board.indexOf(target);
      const updatedBoard = player.board.map((m, i) => {
        if (i !== targetIndex) return m;
        const newKeywords = new Set(m.keywords);
        newKeywords.add("taunt" as import("../../types").Keyword);
        return {
          ...m,
          atk: m.atk + 2,
          hp: m.hp + 2,
          maxHp: m.maxHp + 2,
          keywords: newKeywords,
        };
      });

      return {
        ...state,
        players: state.players.map((p, i) => (i !== playerId ? p : { ...p, board: updatedBoard })),
      };
    },
  },
});
