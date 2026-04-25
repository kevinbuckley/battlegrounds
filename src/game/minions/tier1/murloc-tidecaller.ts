import { defineMinion } from "../define";

export default defineMinion({
  id: "murloc_tidecaller",
  name: "Murloc Tidecaller",
  tier: 1,
  tribes: ["Murloc"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  hooks: {
    // Gains +1 ATK whenever any Murloc is summoned during combat (either side)
    onSummon: (ctx) => {
      if (!ctx.summoned.tribes.includes("Murloc")) return;
      ctx.self.atk += 1;
      ctx.emit({ kind: "Stat", target: ctx.self.instanceId, atk: ctx.self.atk, hp: ctx.self.hp });
    },
  },
});
