import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "baelgun",
  name: "Baelgun, Equipment Maker",
  tier: 5,
  tribes: [],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const board = player.board;
      for (let i = 0; i < board.length; i++) {
        const m = board[i]!;
        if (m.instanceId === ctx.self.instanceId) continue;
        if (!m.tribes.includes("Mech")) continue;
        return updatePlayer(ctx.state, ctx.playerId, (p) => {
          const newBoard = [...p.board];
          const target = newBoard[i]!;
          newBoard[i] = {
            ...target,
            atk: target.atk + 2,
            hp: target.hp + 2,
            maxHp: target.maxHp + 2,
            keywords: new Set([...target.keywords, "magnetic" as const]),
          };
          return { ...p, board: newBoard };
        });
      }
      return ctx.state;
    },
  },
});
