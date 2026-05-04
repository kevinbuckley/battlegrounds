import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion, instantiate } from "../define";

const MECH_TOKEN_CARD = defineMinion({
  id: "gnoma_mech_token",
  name: "Gnome Mech",
  tier: 1,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

export default defineMinion({
  id: "gnoma_tinker_t4",
  name: "Gnoma Tinker",
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

      const newBoard = [...player.board];
      const token = instantiate(MECH_TOKEN_CARD);
      newBoard.push(token);

      return updatePlayer(ctx.state, ctx.playerId, (p) => ({
        ...p,
        board: newBoard,
      }));
    },
  },
});
