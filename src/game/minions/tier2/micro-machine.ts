import { defineMinion } from "../define";

export default defineMinion({
  id: "micro_machine",
  name: "Micro Machine",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      ctx.self.atk += 1;
      ctx.emit({
        kind: "Stat",
        target: ctx.self.instanceId,
        atk: ctx.self.atk,
        hp: ctx.self.hp,
      });
    },
  },
});
