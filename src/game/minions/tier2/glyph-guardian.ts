import { defineMinion } from "../define";

export default defineMinion({
  id: "glyph_guardian",
  name: "Glyph Guardian",
  tier: 2,
  tribes: ["Dragon"],
  baseAtk: 2,
  baseHp: 4,
  baseKeywords: [],
  hooks: {
    // Whenever this attacks, double its own ATK
    onAttack: (ctx) => {
      ctx.self.atk *= 2;
      ctx.emit({ kind: "Stat", target: ctx.self.instanceId, atk: ctx.self.atk, hp: ctx.self.hp });
    },
  },
});
