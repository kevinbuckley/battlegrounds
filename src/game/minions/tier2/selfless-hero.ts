import { defineMinion } from "../define";

export default defineMinion({
  id: "selfless_hero",
  name: "Selfless Hero",
  tier: 2,
  tribes: [],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Deathrattle: Give a random friendly minion Divine Shield
    onDeath: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      if (allies.length === 0) return;
      const target = ctx.rng.pick(allies);
      if (target.keywords.has("divineShield")) return; // already has one
      target.keywords.add("divineShield");
      ctx.emit({ kind: "Stat", target: target.instanceId, atk: target.atk, hp: target.hp });
    },
  },
});
