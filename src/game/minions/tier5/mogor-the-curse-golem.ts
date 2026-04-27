import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "mogor_the_curse_golem",
  name: "Mogor the Curse-Golem",
  tier: 5,
  tribes: ["Mech"],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const newBoard = player.board.map((m) => {
        if (!m.tribes.includes("Mech")) return m;
        return {
          ...m,
          atk: m.atk + 2,
          hp: m.hp + 2,
          maxHp: m.maxHp + 2,
        };
      });
      return updatePlayer(ctx.state, ctx.playerId, (p) => ({ ...p, board: newBoard }));
    },
  },
});
