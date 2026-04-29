import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

const DEATHRATTLE_TIER6: string[] = ["friggent_northvalley", "terestian_manferris"];

export default defineMinion({
  id: "ghastcoiler",
  name: "Ghastcoiler",
  tier: 6,
  tribes: ["Beast"],
  baseAtk: 7,
  baseHp: 7,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      if (allies.length >= 7) return;

      for (let i = 0; i < 2; i++) {
        if (allies.length >= 7) break;
        const chosenId = ctx.rng.pick(DEATHRATTLE_TIER6) as string;
        const card = MINIONS[chosenId];
        if (!card) continue;
        const spawned = instantiate(card);
        allies.push(spawned);
        ctx.emit({
          kind: "Summon",
          card: spawned.cardId,
          side,
          position: allies.length - 1,
        });
      }
    },
  },
});
