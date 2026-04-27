import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion } from "../define";

export default defineMinion({
  id: "bloodsail_corsair",
  name: "Bloodsail Corsair",
  tier: 4,
  tribes: ["Pirate"],
  baseAtk: 4,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const enemies: { playerId: number; boardIndex: number }[] = [];
      for (const p of ctx.state.players) {
        if (p.eliminated || p.id === ctx.playerId) continue;
        for (let i = 0; i < p.board.length; i++) {
          if (p.board[i]) enemies.push({ playerId: p.id, boardIndex: i });
        }
      }
      if (enemies.length === 0) return ctx.state;

      const idx = ctx.rng.next() % enemies.length;
      const target = enemies[idx]!;
      const targetPlayer = getPlayer(ctx.state, target.playerId);
      const targetMinion = targetPlayer.board[target.boardIndex];
      if (!targetMinion) return ctx.state;

      return updatePlayer(ctx.state, target.playerId, (p) => {
        const newBoard = [...p.board];
        const mi = newBoard[target.boardIndex]!;
        newBoard[target.boardIndex] = { ...mi, hp: mi.hp - 2 };
        return { ...p, board: newBoard };
      });
    },
  },
});
