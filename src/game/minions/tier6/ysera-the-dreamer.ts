import { defineMinion } from "../define";

export default defineMinion({
  id: "ysera_the_dreamer",
  name: "Ysera the Dreamer",
  tier: 6,
  tribes: ["Dragon"],
  baseAtk: 0,
  baseHp: 5,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const enemies = ctx.selfSide === "left" ? ctx.right : ctx.left;
      if (enemies.length === 0) return;
      const target = ctx.rng.pick(enemies);
      target.atk = 1;
      target.hp = 1;
      target.maxHp = 1;
      target.tribes = ["Dragon"];
      target.keywords.add("taunt");
      ctx.emit({
        kind: "Transform",
        target: target.instanceId,
        from: ctx.self.instanceId,
      });
      ctx.emit({
        kind: "Stat",
        target: target.instanceId,
        atk: target.atk,
        hp: target.hp,
      });
    },
  },
});
