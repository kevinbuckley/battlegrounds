import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "harvest_golem",
  name: "Harvest Golem",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 2,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Deathrattle: Summon a 2/1 Mech
    onDeath: (ctx) => {
      const golem = defineMinion({
        id: "small_mech",
        name: "Small Mech",
        tier: 1,
        tribes: ["Mech"],
        baseAtk: 2,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
  hooks: {},
      });
      const spawned = instantiate(golem);
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
