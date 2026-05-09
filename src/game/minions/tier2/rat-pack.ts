import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "rat_pack",
  name: "Rat Pack",
  tier: 2,
  tribes: ["Beast"],
  baseAtk: 2,
  baseHp: 2,
  baseKeywords: [],
  description: "Deathrattle: Summon 1/1 Rats equal to this minion's ATK.",
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      const numRats = ctx.self.atk;
      for (let i = 0; i < numRats; i++) {
        if (allies.length >= 7) break;
        const rat = instantiate(
          defineMinion({
            id: "rat_pack_rat",
            name: "Rat",
            tier: 2,
            tribes: ["Beast"],
            baseAtk: 1,
            baseHp: 1,
            baseKeywords: [],
            spellDamage: 0,
            hooks: {},
          }),
        );
        allies.push(rat);
        ctx.emit({
          kind: "Summon",
          card: rat.cardId,
          side,
          position: allies.length - 1,
        });
      }
    },
  },
});
