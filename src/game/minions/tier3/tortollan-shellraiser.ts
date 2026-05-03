import { defineMinion } from "../define";

export default defineMinion({
  id: "tortollan_shellraiser",
  name: "Tortollan Shellraiser",
  tier: 3,
  tribes: ["Elemental"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      const friendly = allies.filter((m) => m.instanceId !== ctx.self.instanceId);
      if (friendly.length === 0) return;
      const target = ctx.rng.pick(friendly);
      target.atk += 1;
      target.hp += 3;
      ctx.emit({
        kind: "Stat",
        target: target.instanceId,
        atk: target.atk,
        hp: target.hp,
      });
    },
  },
});
