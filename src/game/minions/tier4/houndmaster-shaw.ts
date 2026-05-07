import { defineMinion } from "../define";

export default defineMinion({
  id: "houndmaster_shaw",
  name: "Houndmaster Shaw",
  tier: 4,
  tribes: ["Beast"],
  baseAtk: 3,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const ally of allies) {
        if (ally.instanceId !== ctx.self.instanceId) {
          if (!ally.keywords.has("rush")) {
            ally.keywords.add("rush");
          }
          ctx.emit({
            kind: "Stat",
            target: ally.instanceId,
            atk: ally.atk,
            hp: ally.hp,
          });
        }
      }
    },
  },
});
