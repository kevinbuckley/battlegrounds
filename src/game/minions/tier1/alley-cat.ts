import type { MinionInstance } from "../../types";
import { defineMinion } from "../define";

export default defineMinion({
  id: "alley_cat",
  name: "Alley Cat",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Battlecry: Summon a random minion from your hand.
    onBattlecry: ({ state, playerId, self, rng }) => {
      const player = state.players[playerId];
      if (!player) return state;

      // Filter out the Alley Cat itself and any non-minion entries
      const candidates = player.hand.filter(
        (m: MinionInstance) => m.instanceId !== self.instanceId,
      );
      if (candidates.length === 0 || player.board.length >= 7) return state;

      const idx = Math.floor(rng.next() * candidates.length);
      const chosen = candidates[idx]!;
      const newBoard = [...player.board, chosen];
      const newHand = player.hand.filter((m: MinionInstance) => m.instanceId !== chosen.instanceId);

      return {
        ...state,
        players: state.players.map((p, i) =>
          i === playerId ? { ...p, board: newBoard, hand: newHand } : p,
        ),
      };
    },
  },
});
