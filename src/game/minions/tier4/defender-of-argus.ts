import type { Keyword } from "../../types";
import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "defender_of_argus",
  name: "Defender of Argus",
  tier: 4,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const board = player.board;
      const myIdx = board.indexOf(ctx.self);
      if (myIdx === -1) return ctx.state;

      let result = ctx.state;
      const adjacentIndices = new Set<number>();
      if (myIdx > 0) adjacentIndices.add(myIdx - 1);
      if (myIdx < board.length - 1) adjacentIndices.add(myIdx + 1);

      for (const ai of adjacentIndices) {
        const adj = board[ai];
        if (!adj) continue;
        const hasTaunt = adj.keywords.has("taunt" as Keyword);
        const newKeywords = new Set<Keyword>(adj.keywords);
        if (!hasTaunt) newKeywords.add("taunt" as Keyword);
        result = updatePlayer(result, ctx.playerId, (p) => {
          const newBoard = [...p.board];
          const m = newBoard[ai]!;
          newBoard[ai] = {
            ...m,
            atk: m.atk + 1,
            hp: m.hp + 1,
            maxHp: m.maxHp + 1,
            keywords: newKeywords,
          };
          return { ...p, board: newBoard };
        });
      }

      return result;
    },
  },
});
