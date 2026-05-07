import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "lil_exorcist",
  name: "Lil' Exorcist",
  tier: 3,
  tribes: [],
  baseAtk: 2,
  baseHp: 2,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const p0 = ctx.state.players[0];
      const p1 = ctx.state.players[1];
      if (!p0 || !p1) return ctx.state;
      const allMinions = [...p0.board, ...p1.board];
      let deathrattleCount = 0;
      for (let i = 0; i < allMinions.length; i++) {
        const m = allMinions[i]!;
        if (m.instanceId === ctx.self.instanceId) continue;
        if (m.hooks.onDeath) {
          deathrattleCount++;
        }
      }
      if (deathrattleCount <= 0) return ctx.state;
      const player = getPlayer(ctx.state, ctx.playerId);
      return updatePlayer(ctx.state, ctx.playerId, (p) => {
        const newBoard = [...p.board];
        const idx = newBoard.findIndex((m) => m.instanceId === ctx.self.instanceId);
        if (idx < 0) return p;
        const target = newBoard[idx]!;
        newBoard[idx] = {
          ...target,
          atk: target.atk + deathrattleCount,
          hp: target.hp + deathrattleCount,
          maxHp: target.maxHp + deathrattleCount,
        };
        return { ...p, board: newBoard };
      });
    },
  },
});
