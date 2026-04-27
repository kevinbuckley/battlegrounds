import { defineMinion } from "../define";

export default defineMinion({
  id: "soul_juggler",
  name: "Soul Juggler",
  tier: 3,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // After a friendly demon dies, deal 3 damage to a random enemy minion.
    onAllyDeath: (ctx) => {
      if (!ctx.self.tribes.includes("Demon")) return;
      if (ctx.dead.instanceId === ctx.self.instanceId) return;
      if (!ctx.dead.tribes.includes("Demon")) return;
      const enemy = ctx.selfSide === "left" ? ctx.right : ctx.left;
      if (enemy.length === 0) return;
      const target = ctx.rng.pick(enemy);
      target.hp -= 3;
      ctx.emit({ kind: "Damage", target: target.instanceId, amount: 3 });
      if (target.hp <= 0) {
        ctx.emit({ kind: "Death", source: target.instanceId });
      }
    },
  },
});
