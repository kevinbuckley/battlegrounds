import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "bristleback_boys",
  name: "Bristleback Boys",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const whelp = defineMinion({
        id: "bristleback_boys_whelp",
        name: "Bristleback Whelp",
        tier: 1,
        tribes: ["Beast"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      });
      const spawned = instantiate(whelp);
      const side = ctx.selfSide;
      if (side === "left") {
        ctx.left.push(spawned);
      } else {
        ctx.right.push(spawned);
      }
      ctx.emit({
        kind: "Summon",
        card: spawned.cardId,
        side,
        position: (side === "left" ? ctx.left : ctx.right).length - 1,
      });
    },
  },
});
