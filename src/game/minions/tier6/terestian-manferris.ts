import { defineMinion } from "../define";

export default defineMinion({
  id: "terestian_manferris",
  name: "Terestian Manferris",
  tier: 6,
  tribes: ["Mech"],
  baseAtk: 5,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      const mechs = allies.filter((m) => m.tribes.includes("Mech"));
      if (mechs.length === 0) return;
      const target = ctx.rng.pick(mechs);
      target.atk += 3;
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
