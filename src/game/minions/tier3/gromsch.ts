import { defineMinion, instantiate } from "../define";

const GRUNT_CARD = defineMinion({
  id: "grunt",
  name: "Grunt",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

export default defineMinion({
  id: "gromsch",
  name: "Gromsch",
  tier: 3,
  tribes: ["Beast"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      if (allies.length >= 7) return;

      const grunt = instantiate(GRUNT_CARD);
      allies.push(grunt);
      ctx.emit({
        kind: "Summon",
        card: grunt.cardId,
        side,
        position: allies.length - 1,
      });
    },
  },
});
