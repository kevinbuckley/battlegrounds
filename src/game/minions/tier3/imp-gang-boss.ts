import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "imp_gang_boss",
  name: "Imp Gang Boss",
  tier: 3,
  tribes: ["Demon"],
  baseAtk: 2,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDamageTaken: (ctx) => {
      const imp = defineMinion({
        id: "imp_gang_imp",
        name: "Imp",
        tier: 3,
        tribes: ["Demon"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      });
      const spawned = instantiate(imp);
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
