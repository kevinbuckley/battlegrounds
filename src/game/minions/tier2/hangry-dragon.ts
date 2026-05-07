import { defineMinion } from "../define";

export default defineMinion({
  id: "hangry_dragon",
  name: "Hangry Dragon",
  tier: 2,
  tribes: ["Dragon"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onTurnStart: (ctx) => {
      const player = ctx.state.players[ctx.playerId];
      const opponentId = (ctx.playerId === 0 ? 7 : 0) as number;
      const opponent = ctx.state.players[opponentId];
      if (player && opponent && player.hp > opponent.hp) {
        ctx.self.atk += 2;
        ctx.self.hp += 2;
        ctx.self.maxHp += 2;
      }
      return ctx.state;
    },
  },
});
