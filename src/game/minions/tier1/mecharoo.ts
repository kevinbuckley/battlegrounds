import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "mecharoo",
  name: "Mecharoo",
  tier: 1,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;

      if (allies.length >= 7) return;

      const joeBot = instantiate(
        defineMinion({
          id: "mecharoo_joe_bot",
          name: "Jo-E Bot",
          tier: 1,
          tribes: ["Mech"],
          baseAtk: 1,
          baseHp: 1,
          baseKeywords: [],
          spellDamage: 0,
          hooks: {},
        }),
      );
      allies.push(joeBot);
      ctx.emit({
        kind: "Summon",
        card: joeBot.cardId,
        side,
        position: allies.length - 1,
      });
    },
  },
});
