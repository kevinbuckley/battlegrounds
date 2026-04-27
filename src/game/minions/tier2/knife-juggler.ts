import { defineMinion } from "../define";

export default defineMinion({
  id: "knife_juggler",
  name: "Knife Juggler",
  tier: 2,
  tribes: [],
  baseAtk: 3,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // After a friendly minion is summoned during combat, deal 1 damage to a
    // random enemy minion.
    onSummon: (ctx) => {
      const enemy = ctx.selfSide === "left" ? ctx.right : ctx.left;
      if (enemy.length === 0) return;
      const target = ctx.rng.pick(enemy);
      target.hp -= 1;
      ctx.emit({ kind: "Damage", target: target.instanceId, amount: 1 });
      if (target.hp <= 0) {
        ctx.emit({ kind: "Death", source: target.instanceId });
      }
    },
  },
});
