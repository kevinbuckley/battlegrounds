import { defineMinion } from "../define";

export default defineMinion({
  id: "ripsnarl_captain",
  name: "Ripsnarl Captain",
  tier: 4,
  tribes: ["Pirate"],
  baseAtk: 3,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onAllyAttack: (ctx) => {
      const tribe = ctx.target.tribes;
      if (tribe.includes("Pirate")) {
        ctx.target.atk += 2;
        ctx.target.hp += 2;
        ctx.target.maxHp += 2;
        ctx.emit({
          kind: "Stat",
          target: ctx.target.instanceId,
          atk: ctx.target.atk,
          hp: ctx.target.hp,
        });
      }
    },
  },
});
