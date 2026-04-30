import type { Tribe } from "../../types";
import { defineMinion } from "../define";

export default defineMinion({
  id: "lightfang_enforcer",
  name: "Lightfang Enforcer",
  tier: 5,
  tribes: ["Beast"],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // End of turn: Give a friendly minion of each tribe on your board +2/+1.
    onTurnEnd: ({ state, playerId, self }) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      const friendlyMinions = player.board.filter((m) => m.instanceId !== self.instanceId);
      if (friendlyMinions.length === 0) return state;

      // Collect all tribes present on the board (excluding self)
      const tribesOnBoard = new Set<Tribe>();
      for (const m of friendlyMinions) {
        for (const t of m.tribes) {
          tribesOnBoard.add(t);
        }
      }

      if (tribesOnBoard.size === 0) return state;

      // For each tribe on the board, find a friendly minion of that tribe and buff it +2/+1.
      // A single minion can satisfy multiple tribes if it has multiple tribes.
      let newBoard = player.board;
      for (const tribe of tribesOnBoard) {
        const target = friendlyMinions.find((m) => m.tribes.includes(tribe));
        if (!target) continue;
        newBoard = newBoard.map((m) =>
          m.instanceId === target.instanceId
            ? { ...m, atk: m.atk + 2, hp: m.hp + 1, maxHp: Math.max(m.maxHp, m.hp + 1) }
            : m,
        );
      }

      return {
        ...state,
        players: state.players.map((p) => (p.id === playerId ? { ...p, board: newBoard } : p)),
      };
    },
  },
});
