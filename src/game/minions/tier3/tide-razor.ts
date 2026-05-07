import type { MinionInstance } from "../../types";
import { defineMinion } from "../define";

export default defineMinion({
  id: "tide_razor_t3",
  name: "Tide-Razor",
  tier: 3,
  tribes: ["Murloc"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self }) => {
      const player = state.players[playerId];
      if (!player) return state;

      // Find a friendly Murloc on the board (excluding self which isn't on board yet)
      const target = player.board.find(
        (m) => m.instanceId !== self.instanceId && m.tribes.includes("Murloc"),
      );

      if (!target) return state;

      const targetIndex = player.board.indexOf(target);
      const newKeywords = new Set(target.keywords);
      newKeywords.add("rush" as import("../../types").Keyword);
      const updatedBoard = player.board.map((m, i) => {
        if (i !== targetIndex) return m;
        return {
          ...m,
          atk: m.atk + 1,
          hp: m.hp + 1,
          maxHp: m.maxHp + 1,
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
