import { defineMinion } from "../define";

export default defineMinion({
  id: "deathwing",
  name: "Deathwing",
  tier: 8,
  tribes: ["Dragon"],
  baseAtk: 10,
  baseHp: 10,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      // Destroy ALL other minions on both boards
      const { left, right, emit } = ctx;
      for (const m of left) {
        if (m.instanceId !== ctx.self.instanceId) {
          m.hp = 0;
          emit({ kind: "Damage", target: m.instanceId, amount: m.atk });
        }
      }
      for (const m of right) {
        if (m.instanceId !== ctx.self.instanceId) {
          m.hp = 0;
          emit({ kind: "Damage", target: m.instanceId, amount: m.atk });
        }
      }
    },
  },
});
