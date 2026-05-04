import { defineMinion } from "../define";

export default defineMinion({
  id: "unstable_ghoul",
  name: "Unstable Ghoul",
  tier: 2,
  tribes: ["Undead"],
  baseAtk: 1,
  baseHp: 3,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    // Deathrattle: Deal 1 damage to all other minions (not itself)
    onDeath: (ctx) => {
      const selfId = ctx.self.instanceId;
      for (const m of [...ctx.left, ...ctx.right]) {
        if (m.instanceId !== selfId && m.hp > 0) {
          m.hp -= 1;
          ctx.emit({ kind: "Damage", target: m.instanceId, amount: 1 });
        }
      }
    },
  },
});
