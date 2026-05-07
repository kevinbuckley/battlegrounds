import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "mechano_egg",
  name: "Mechano-Egg",
  tier: 5,
  tribes: ["Mech"],
  baseAtk: 0,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;

      if (allies.length >= 7) return;

      const robossaur = instantiate({
        id: "mechano_egg_robosaur",
        name: "Robosaur",
        tier: 5,
        tribes: ["Mech"],
        baseAtk: 8,
        baseHp: 8,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      });
      allies.push(robossaur);
      ctx.emit({
        kind: "Summon",
        card: robossaur.cardId,
        side,
        position: allies.length - 1,
      });
    },
  },
});
