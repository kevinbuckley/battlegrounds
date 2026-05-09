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
        attacker.atk += 2;
        attacker.hp += 2;
        attacker.maxHp += 2;
        ctx.emit({
          kind: "Stat",
          target: attacker.instanceId,
          atk: attacker.atk,
          hp: attacker.hp,
        });
      }
    },
  },
});
