import type { MinionInstance, Tribe } from "../../types";
import { defineMinion, nextInstanceId } from "../define";

export default defineMinion({
  id: "markku",
  name: "Markku, the Murloc",
  tier: 3,
  tribes: ["Murloc"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, rng }) => {
      const player = state.players[playerId];
      if (!player) return state;
      const availableSlots = 7 - player.board.length;
      if (availableSlots <= 0) return state;

      const murlocs: MinionInstance[] = [];
      for (const m of player.board) {
        if (m.tribes.includes("Murloc")) {
          murlocs.push(m);
        }
      }
      if (murlocs.length === 0) return state;

      const source = rng.pick(murlocs);
      const copy: MinionInstance = {
        instanceId: nextInstanceId(),
        cardId: source.cardId,
        atk: source.atk,
        hp: source.hp,
        maxHp: source.maxHp,
        keywords: new Set(source.keywords),
        tribes: source.tribes,
        golden: source.golden,
        spellDamage: source.spellDamage,
        attachments: { ...source.attachments },
        hooks: source.hooks,
      };

      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId ? p : { ...p, board: [...p.board, copy] },
        ),
      };
    },
  },
});
