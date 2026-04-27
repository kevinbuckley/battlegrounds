import { defineMinion, instantiate } from "../define";

const STALKER_CARD = defineMinion({
  id: "stalker",
  name: "Stalker",
  tier: 5,
  tribes: ["Beast"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

export default defineMinion({
  id: "friggent_northvalley",
  name: "Friggent Northvalley",
  tier: 6,
  tribes: ["Beast"],
  baseAtk: 5,
  baseHp: 7,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      if (allies.length >= 7) return;

      const stalker = instantiate(STALKER_CARD);
      allies.push(stalker);
      ctx.emit({
        kind: "Summon",
        card: stalker.cardId,
        side,
        position: allies.length - 1,
      });
    },
  },
});
