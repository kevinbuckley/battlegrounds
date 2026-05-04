import { defineMinion } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "fiendish_servant",
  name: "Fiendish Servant",
  tier: 1,
  tribes: ["Demon"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const atk = ctx.self.atk;
      if (atk <= 0) return;

      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      const candidates = allies.filter((m) => m.instanceId !== ctx.self.instanceId);
      if (candidates.length === 0) return;

      const target = ctx.rng.pick(candidates);
      target.atk += atk;
      ctx.emit({
        kind: "Stat",
        target: target.instanceId,
        atk: target.atk,
        hp: target.hp,
      });
    },
  },
});
