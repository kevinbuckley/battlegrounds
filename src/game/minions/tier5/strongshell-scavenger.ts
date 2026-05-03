import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "strongshell_scavenger",
  name: "Strongshell Scavenger",
  tier: 5,
  tribes: [],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      let newState = ctx.state;
      for (const minion of player.board) {
        if (minion.instanceId === ctx.self.instanceId) continue;
        if (minion.keywords.has("taunt")) {
          newState = updatePlayer(newState, ctx.playerId, (p) => {
            const target = p.board.find((m) => m.instanceId === minion.instanceId);
            if (target) {
              target.atk += 2;
              target.hp += 2;
              target.maxHp += 2;
            }
            return p;
          });
        }
      }
      return newState;
    },
  },
});
