import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "imp_mama",
  name: "Imp Mama",
  tier: 6,
  tribes: ["Demon"],
  baseAtk: 6,
  baseHp: 8,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDamageTaken: (ctx) => {
      const dmg = ctx.self.atk;
      if (dmg <= 0) return;
      ctx.self.atk += 1;
      ctx.self.hp += 1;
      const imp = defineMinion({
        id: "imp_mama_imp",
        name: "Imp",
        tier: 6,
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
