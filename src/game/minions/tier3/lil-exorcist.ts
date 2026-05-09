import type { RecruitCtx } from "../../types";
import { updatePlayer } from "../../utils";
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
    onBattlecry: (ctx: RecruitCtx) => {
      const p0 = ctx.state.players[0];
      const p1 = ctx.state.players[1];
      if (!p0 || !p1) return ctx.state;

      // Count Deathrattle minions on both boards (excluding self)
      const allMinions = [...p0.board, ...p1.board];
      let deathrattleCount = 0;
      for (const m of allMinions) {
        if (m.instanceId === ctx.self.instanceId) continue;
        if (m.hooks.onDeath) {
          deathrattleCount++;
        }
      }

      if (deathrattleCount <= 0) return ctx.state;

      // Give Lil' Exorcist itself +1/+1 per Deathrattle minion on both boards
      return updatePlayer(ctx.state, ctx.playerId, (p) => {
        const newBoard = p.board.map((m) => {
          if (m.instanceId === ctx.self.instanceId) {
            return {
              ...m,
              atk: m.atk + deathrattleCount,
              hp: m.hp + deathrattleCount,
              maxHp: m.maxHp + deathrattleCount,
            };
          }
          return m;
        });
        return { ...p, board: newBoard };
      });
    },
  },
});
