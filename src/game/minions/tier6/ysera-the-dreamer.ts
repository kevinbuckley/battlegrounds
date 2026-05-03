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
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      // Find friendly minions that are NOT Ysera herself
      const candidates = allies.filter((m) => m.instanceId !== ctx.self.instanceId);
      if (candidates.length === 0) return;
      // Pick a random friendly minion to transform
      const target = ctx.rng.pick(candidates);
      target.atk = 0;
      target.hp = 5;
      target.maxHp = 5;
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
