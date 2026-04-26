import type { MinionInstance, Tribe } from "../../types";
import { defineMinion } from "../define";

export default defineMinion({
  id: "murloc_tidehunter",
  name: "Murloc Tidehunter",
  tier: 1,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  hooks: {
    onBattlecry: ({ state, playerId, rng }) => {
      const player = state.players[playerId];
      if (!player) return state;
      const availableSlots = 7 - player.board.length;
      if (availableSlots <= 0) return state;

      const whelp: MinionInstance = {
        instanceId: `tidehunter_whelp_${playerId}_${Date.now()}_${rng.next()}`,
        cardId: "murloc_tidehunter_whelp",
        atk: 1,
        hp: 1,
        maxHp: 1,
        keywords: new Set(),
        tribes: ["Murloc"] as Tribe[],
        golden: false,
        attachments: {},
        hooks: {},
      };

      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId ? p : { ...p, board: [...p.board, whelp] },
        ),
      };
    },
  },
});
