import type { MinionHooks, MinionInstance, RecruitCtx } from "../../types";
import { updatePlayer } from "../../utils";
import { defineMinion } from "../define";

const hooks: MinionHooks = {
  onShopSummon: (ctx: RecruitCtx) => {
    const summoned = ctx.summoned;
    if (!summoned) return ctx.state;
    if (!summoned.tribes.includes("Beast")) return ctx.state;

    const player = ctx.state.players[ctx.playerId];
    if (!player) return ctx.state;
    if (player.board.length >= 7) return ctx.state;

    // Give ALL friendly Beasts +5/+5 (including Goldrinn itself if on board)
    return updatePlayer(ctx.state, ctx.playerId, (p) => {
      const newBoard = p.board.map((m) => {
        if (m.tribes.includes("Beast")) {
          return {
            ...m,
            atk: m.atk + 5,
            hp: m.hp + 5,
            maxHp: m.maxHp + 5,
          };
        }
        return m;
      });
      return { ...p, board: newBoard };
    });
  },
};

export default defineMinion({
  id: "goldrinn",
  name: "Goldrinn the Great Wolf",
  tier: 5,
  tribes: ["Beast"],
  baseAtk: 4,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks,
});
