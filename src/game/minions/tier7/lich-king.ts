import { defineMinion } from "../define";

export default defineMinion({
  id: "lich_king",
  name: "The Lich King",
  tier: 7,
  tribes: ["Undead"],
  baseAtk: 10,
  baseHp: 10,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      const otherCount = allies.filter((m) => m.instanceId !== ctx.self.instanceId).length;
      const buff = otherCount;
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
