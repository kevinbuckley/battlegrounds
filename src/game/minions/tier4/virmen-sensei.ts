import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "virmen_sensei",
  name: "Virmen Sensei",
  tier: 4,
  tribes: ["Dragon"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const board = player.board;
      for (let i = 0; i < board.length; i++) {
        const m = board[i]!;
        if (m.instanceId === ctx.self.instanceId) continue;
        if (!m.tribes.includes("Dragon")) continue;
        return updatePlayer(ctx.state, ctx.playerId, (p) => {
          const newBoard = [...p.board];
          const target = newBoard[i]!;
          newBoard[i] = {
            ...target,
            atk: target.atk + 2,
            hp: target.hp + 2,
            maxHp: target.maxHp + 2,
          };
          return { ...p, board: newBoard };
        });
      }
      return ctx.state;
    },
  },
});
