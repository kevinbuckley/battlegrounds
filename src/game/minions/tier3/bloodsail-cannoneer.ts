import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "bloodsail_cannoneer",
  name: "Bloodsail Cannoneer",
  tier: 3,
  tribes: ["Pirate"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
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
            atk: target.atk + 3,
            hp: target.hp,
            maxHp: target.maxHp,
          };
          return { ...p, board: newBoard };
        });
      }
      return ctx.state;
    },
  },
});
