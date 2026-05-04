import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "voidlord",
  name: "Voidlord",
  tier: 5,
  tribes: ["Demon"],
  baseAtk: 3,
  baseHp: 9,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;

      for (let i = 0; i < 3; i++) {
        if (allies.length >= 7) break;
        const token = instantiate({
          id: "voidlord_taunt_demon",
          name: "Voidlord Taunt Demon",
          tier: 5,
          tribes: ["Demon"],
          baseAtk: 1,
          baseHp: 3,
          baseKeywords: ["taunt"],
          spellDamage: 0,
          hooks: {},
        });
        allies.push(token);
        ctx.emit({
          kind: "Summon",
          card: token.cardId,
          side,
          position: allies.length - 1,
        });
      }
    },
  },
});
