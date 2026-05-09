import { defineMinion } from "../define";

export default defineMinion({
  id: "scavenging_hyena",
  name: "Scavenging Hyena",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  description: "After a friendly Beast dies, gain +2/+1.",
  spellDamage: 0,
  hooks: {
    onAllyDeath: (ctx) => {
      if (!ctx.dead.tribes.includes("Beast")) return;
      const atkGain = ctx.self.golden ? 4 : 2;
      const hpGain = ctx.self.golden ? 2 : 1;
      ctx.self.atk += atkGain;
      ctx.self.hp += hpGain;
      ctx.self.maxHp = Math.max(ctx.self.maxHp, ctx.self.hp);
      ctx.emit({ kind: "Stat", target: ctx.self.instanceId, atk: ctx.self.atk, hp: ctx.self.hp });
    },
  },
});
