import { defineMinion } from "../define";

export default defineMinion({
  id: "unstable_ghoul",
  name: "Unstable Ghoul",
  tier: 2,
  tribes: ["Undead"],
  baseAtk: 1,
  baseHp: 3,
  baseKeywords: ["taunt"],
  hooks: {
    // Deathrattle: Deal 1 damage to all minions
    onDeath: (ctx) => {
      for (const m of [...ctx.left, ...ctx.right]) {
        if (m.hp > 0) {
          m.hp -= 1;
          ctx.emit({ kind: "Damage", target: m.instanceId, amount: 1 });
        }
      }
    },
  },
});
