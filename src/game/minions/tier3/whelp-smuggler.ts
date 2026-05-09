import type { MinionHooks, RecruitCtx } from "../../types";
import { updatePlayer } from "../../utils";
import { defineMinion } from "../define";

const hooks: MinionHooks = {
  onShopSummon: (ctx: RecruitCtx) => {
    const summoned = ctx.summoned;
    if (!summoned) return ctx.state;
    if (!summoned.tribes.includes("Dragon")) return ctx.state;

    const player = ctx.state.players[ctx.playerId];
    if (!player) return ctx.state;

    // Find all friendly Dragons on the board (excluding the summoned one)
    const dragons = player.board.filter(
      (m) => m.tribes.includes("Dragon") && m.instanceId !== summoned.instanceId,
    );

    if (dragons.length === 0) return ctx.state;

    // Pick a random friendly Dragon and give it +2 HP
    const target = ctx.rng.pick(dragons);

    return updatePlayer(ctx.state, ctx.playerId, (p) => {
      const newBoard = p.board.map((m) => {
        if (m.instanceId === target.instanceId) {
          const newHp = m.hp + 2;
          return {
            ...m,
            hp: newHp,
            maxHp: Math.max(m.maxHp, newHp),
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
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks,
});
