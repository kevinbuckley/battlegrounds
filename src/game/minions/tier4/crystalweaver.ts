import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "crystalweaver",
  name: "Crystalweaver",
  tier: 4,
  tribes: ["Dragon"],
  baseAtk: 4,
  baseHp: 4,
  baseKeywords: ["cleave"],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const board = player.board;
      let result = ctx.state;
      for (const minion of board) {
        if (minion.instanceId === ctx.self.instanceId) continue;
        if (!minion.tribes.includes("Demon")) continue;
        result = updatePlayer(result, ctx.playerId, (p) => {
          const newBoard = [...p.board];
          const idx = newBoard.indexOf(minion);
          const m = newBoard[idx]!;
          newBoard[idx] = {
            ...m,
            atk: m.atk + 2,
            hp: m.hp + 2,
            maxHp: m.maxHp + 2,
          };
          return { ...p, board: newBoard };
        });
      }
      return result;
    },
  },
});
