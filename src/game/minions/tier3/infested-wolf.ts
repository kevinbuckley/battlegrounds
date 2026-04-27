import { defineMinion, instantiate } from "../define";

const SPIDER_CARD = defineMinion({
  id: "spider_token",
  name: "Spider",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

export default defineMinion({
  id: "infested_wolf",
  name: "Infested Wolf",
  tier: 3,
  tribes: ["Beast"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Deathrattle: Summon two 1/1 Spiders.
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const board = side === "left" ? ctx.left : ctx.right;
      const slots = 7 - board.length;
      if (slots <= 0) return;
      const count = Math.min(2, slots);
      for (let i = 0; i < count; i++) {
        const spider = instantiate(SPIDER_CARD);
        board.push(spider);
        ctx.emit({
          kind: "Summon",
          card: spider.cardId,
          side,
          position: board.length - 1,
        });
      }
    },
  },
});
