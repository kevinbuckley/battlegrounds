import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "king_of_beasts",
  name: "King of Beasts",
  tier: 6,
  tribes: ["Beast"],
  baseAtk: 2,
  baseHp: 6,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const otherBeasts = player.board.filter(
        (m) => m.instanceId !== ctx.self.instanceId && m.tribes.includes("Beast"),
      ).length;
      const newBoard = player.board.map((m) => {
        if (m.instanceId !== ctx.self.instanceId) return m;
        return {
          ...m,
          atk: m.atk + otherBeasts,
        };
      });
      return updatePlayer(ctx.state, ctx.playerId, (p) => ({ ...p, board: newBoard }));
    },
  },
});
