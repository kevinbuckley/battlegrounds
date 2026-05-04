import { defineMinion } from "../define";

export default defineMinion({
  id: "razorgore_the_untamed",
  name: "Razorgore the Untamed",
  tier: 6,
  tribes: ["Dragon"],
  baseAtk: 2,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      const dragonCount = allies.filter(
        (m) => m.tribes.includes("Dragon") && m.instanceId !== ctx.self.instanceId,
      ).length;
      const buff = dragonCount * 2;
      ctx.self.atk += buff;
      ctx.self.hp += buff;
      ctx.self.maxHp += buff;
      ctx.emit({
        kind: "Stat",
        target: ctx.self.instanceId,
        atk: ctx.self.atk,
        hp: ctx.self.hp,
      });
    },
  },
});
