import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "toxfin",
  name: "Toxfin",
  tier: 4,
  tribes: ["Murloc"],
  baseAtk: 1,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      let newState = ctx.state;
      for (const minion of player.board) {
        if (minion.instanceId === ctx.self.instanceId) continue;
        if (minion.tribes.includes("Murloc")) {
          newState = updatePlayer(newState, ctx.playerId, (p) => {
            const target = p.board.find((m) => m.instanceId === minion.instanceId);
            if (target) {
              target.keywords.add("poisonous");
            }
            return p;
          });
        }
      }
      return newState;
    },
  },
});
