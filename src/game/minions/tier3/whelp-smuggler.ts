import type { MinionHooks, MinionInstance, RecruitCtx } from "../../types";
import { updatePlayer } from "../../utils";
import { defineMinion } from "../define";

const hooks: MinionHooks = {
  onShopSummon: (ctx: RecruitCtx) => {
    const summoned = ctx.summoned;
    if (!summoned) return ctx.state;
    if (!summoned.tribes.includes("Dragon")) return ctx.state;

    const player = ctx.state.players[ctx.playerId];
    if (!player) return ctx.state;
    if (player.board.length >= 7) return ctx.state;

    // Give the summoned Dragon +2/+2
    return updatePlayer(ctx.state, ctx.playerId, (p) => {
      const newBoard = p.board.map((m) => {
        if (m.instanceId === summoned.instanceId) {
          return {
            ...m,
            atk: m.atk + 2,
            hp: m.hp + 2,
            maxHp: m.maxHp + 2,
          };
        }
        return m;
      });
      return { ...p, board: newBoard };
    });
  },
};

export default defineMinion({
  id: "whelp_smuggler",
  name: "Whelp Smuggler",
  tier: 3,
  tribes: ["Dragon"],
  baseAtk: 3,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks,
});
