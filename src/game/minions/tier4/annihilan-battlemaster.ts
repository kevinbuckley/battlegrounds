import { defineMinion } from "../define";

export default defineMinion({
  id: "annihilan_battlemaster",
  name: "Annihilan Battlemaster",
  tier: 4,
  tribes: ["Demon"],
  baseAtk: 1,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onAllyAttack: (ctx) => {
      const attacker = ctx.attacker;
      if (!attacker) return;
      if (attacker.tribes.includes("Demon")) {
        ctx.self.atk += 2;
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
