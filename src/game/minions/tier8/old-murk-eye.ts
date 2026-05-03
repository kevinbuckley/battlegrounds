import type { MinionHooks, MinionInstance, RecruitCtx } from "../../types";
import { updatePlayer } from "../../utils";
import { defineMinion } from "../define";

const hooks: MinionHooks = {
  onShopSummon: (ctx: RecruitCtx) => {
    const player = ctx.state.players[ctx.playerId];
    if (!player) return ctx.state;
    if (player.board.length >= 7) return ctx.state;

    // Find all friendly murlocs on board (excluding self)
    const murlocs: MinionInstance[] = [];
    for (let i = 0; i < player.board.length; i++) {
      const m = player.board[i];
      if (m && m.tribes.includes("Murloc") && m.instanceId !== ctx.self.instanceId) {
        murlocs.push(m);
      }
    }

    if (murlocs.length === 0) return ctx.state;

    // Give a random murloc +2/+2
    const target = ctx.rng.pick(murlocs);
    return updatePlayer(ctx.state, ctx.playerId, (p) => {
      const newBoard = [...p.board];
      for (let i = 0; i < newBoard.length; i++) {
        const m = newBoard[i];
        if (m && m.instanceId === target.instanceId) {
          newBoard[i] = {
            ...m,
            atk: m.atk + 2,
            hp: m.hp + 2,
            maxHp: m.maxHp + 2,
          };
          break;
        }
      }
      return { ...p, board: newBoard };
    });
  },
};

export default defineMinion({
  id: "old_murk_eye_t8",
  name: "Old Murk-Eye (T8)",
  tier: 8,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks,
});
