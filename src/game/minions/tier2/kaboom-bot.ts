import { defineMinion } from "../define";

export default defineMinion({
  id: "kaboom_bot",
  name: "Kaboom Bot",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 3,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const enemies = side === "left" ? ctx.right : ctx.left;
      if (enemies.length > 0) {
        const target = ctx.rng.pick(enemies);
        target.hp -= 4;
        ctx.emit({ kind: "Damage", target: target.instanceId, amount: 4 });
      }
    },
  },
});
