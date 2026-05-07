import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "southsea-strongarm",
  name: "Southsea Strongarm",
  tier: 3,
  tribes: ["Pirate"],
  baseAtk: 5,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const count = player.piratesBoughtThisTurn;
      if (count <= 0) return ctx.state;

      const board = player.board;
      for (let i = 0; i < board.length; i++) {
        const m = board[i]!;
        if (m.instanceId === ctx.self.instanceId) continue;
        if (!m.tribes.includes("Pirate")) continue;
        return updatePlayer(ctx.state, ctx.playerId, (p) => {
          const newBoard = [...p.board];
          const target = newBoard[i]!;
          newBoard[i] = {
            ...target,
            atk: target.atk + 1,
            hp: target.hp + 1,
            maxHp: target.maxHp + 1,
          };
          return { ...p, board: newBoard };
        });
      }
      return ctx.state;
    },
  },
});
