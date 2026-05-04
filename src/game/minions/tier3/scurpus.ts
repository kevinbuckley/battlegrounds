import type { MinionInstance, Tribe } from "../../types";
import { defineMinion, nextInstanceId } from "../define";

export default defineMinion({
  id: "scurpus",
  name: "Scurpus",
  tier: 3,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, rng, self }) => {
      const player = state.players[playerId];
      if (!player) return state;

      // Count other minions on the player's board that have a battlecry
      // Exclude this Scurpus instance itself (which isn't on the board yet during battlecry)
      const battlecryCount = player.board.filter(
        (m) => m.instanceId !== self.instanceId && m.hooks?.onBattlecry,
      ).length;

      if (battlecryCount <= 0) return state;

      const availableSlots = 7 - player.board.length;
      const toSummon = Math.min(battlecryCount, availableSlots);

      if (toSummon <= 0) return state;

      const snakes: MinionInstance[] = [];
      for (let i = 0; i < toSummon; i++) {
        snakes.push({
          instanceId: `scurpus_snake_${playerId}_${nextInstanceId()}`,
          cardId: "scurpus_snake",
          baseAtk: 1,
          baseHp: 1,
          atk: 1,
          hp: 1,
          maxHp: 1,
          keywords: new Set(),
          tribes: ["Beast"],
          golden: false,
          attachments: {},
          spellDamage: 0,
          hooks: {},
        });
      }

      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId ? p : { ...p, board: [...p.board, ...snakes] },
        ),
      };
    },
  },
});
