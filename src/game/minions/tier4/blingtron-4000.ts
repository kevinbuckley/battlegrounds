import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion, instantiate } from "../define";

const ROBOT_PUP_CARD = defineMinion({
  id: "robot_pup",
  name: "Robot Pup",
  tier: 1,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

export default defineMinion({
  id: "blingtron_4000",
  name: "Blingtron 4000",
  tier: 4,
  tribes: ["Mech"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      if (player.board.length >= 7) return ctx.state;

      const mechCount = player.board.filter((m) => m.tribes.includes("Mech")).length;
      const pupsToSummon = Math.min(mechCount, 7 - player.board.length);
      const newBoard = [...player.board];
      for (let i = 0; i < pupsToSummon; i++) {
        const pup = instantiate(ROBOT_PUP_CARD);
        newBoard.push(pup);
      }

      return updatePlayer(ctx.state, ctx.playerId, (p) => ({ ...p, board: newBoard }));
    },
  },
});
