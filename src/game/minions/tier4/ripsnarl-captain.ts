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
      const attacker = ctx.attacker;
      if (!attacker) return;
      if (attacker.tribes.includes("Pirate")) {
        ctx.self.atk += 2;
        ctx.self.hp += 2;
        ctx.self.maxHp += 2;
        ctx.emit({
          kind: "Stat",
          target: ctx.self.instanceId,
          atk: ctx.self.atk,
          hp: ctx.self.hp,
        });
      }
    },
  },
});
