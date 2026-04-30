import { defineMinion } from "../define";

export default defineMinion({
  id: "scavenging_hyena",
  name: "Scavenging Hyena",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onAllyDeath: (ctx) => {
      if (!ctx.dead.tribes.includes("Beast")) return;
      ctx.self.atk += 2;
      ctx.self.hp += 1;
      ctx.self.maxHp = Math.max(ctx.self.maxHp, ctx.self.hp);
      ctx.emit({ kind: "Stat", target: ctx.self.instanceId, atk: ctx.self.atk, hp: ctx.self.hp });
    },
  },
});
