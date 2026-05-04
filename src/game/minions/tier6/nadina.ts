import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "nadina_the_red",
  name: "Nadina the Red",
  tier: 6,
  tribes: ["Demon"],
  baseAtk: 7,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;

      for (const m of allies) {
        if (m.instanceId === ctx.self.instanceId) continue;
        if (m.keywords.has("divineShield")) continue;
        const card = MINIONS[m.cardId];
        if (!card) continue;
        if (card.hooks.onDeath) {
          m.keywords.add("divineShield");
        }
      }
    },
  },
});
