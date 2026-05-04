import { defineMinion } from "../define";

export default defineMinion({
  id: "dreadscale",
  name: "Dreadscale",
  tier: 8,
  tribes: ["Dragon"],
  baseAtk: 6,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const selfId = ctx.self.instanceId;
      for (const m of [...ctx.left, ...ctx.right]) {
        if (m.instanceId !== selfId && m.hp > 0) {
          m.hp -= 2;
          ctx.emit({ kind: "Damage", target: m.instanceId, amount: 2 });
        }
      }
    },
  },
});
