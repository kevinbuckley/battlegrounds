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
    // Deathrattle: Give a random friendly minion Divine Shield (skips those that
    // already have one; if all have divine shield, does nothing).
    onDeath: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      const eligible = allies.filter((m) => !m.keywords.has("divineShield"));
      if (eligible.length === 0) return;
      const target = ctx.rng.pick(eligible);
      target.keywords.add("divineShield");
      ctx.emit({ kind: "Stat", target: target.instanceId, atk: target.atk, hp: target.hp });
    },
  },
});
