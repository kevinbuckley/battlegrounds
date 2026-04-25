import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "imprisoner",
  name: "Imprisoner",
  tier: 2,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: ["taunt"],
  hooks: {
    onDeath: (ctx) => {
      const imp = defineMinion({
        id: "small_imp",
        name: "Small Imp",
        tier: 1,
        tribes: ["Demon"],
        baseAtk: 3,
        baseHp: 3,
        baseKeywords: [],
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
