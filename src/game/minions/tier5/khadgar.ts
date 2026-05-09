import { defineMinion, instantiate, nextInstanceId } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "khadgar",
  name: "Khadgar",
  tier: 5,
  tribes: ["Mech"],
  baseAtk: 2,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onSummon: (ctx) => {
      // Only trigger for friendly summons (not enemy deathrattles).
      if (ctx.summonedSide !== ctx.selfSide) return;

      // Find all friendly minions (excluding self) to copy from.
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      const candidates = allies.filter((m) => m.instanceId !== ctx.self.instanceId);
      if (candidates.length === 0) return;

      // Check board cap — don't summon if board is full.
      if (allies.length >= 7) return;

      const chosen = ctx.rng.pick(candidates);
      const card = MINIONS[chosen.cardId];
      if (!card) return;

      const copy = instantiate(card);
      copy.instanceId = nextInstanceId();
      const position = allies.length;
      allies.push(copy);
      ctx.emit({
        kind: "Summon",
        card: copy.cardId,
        side: ctx.selfSide,
        position,
      });
    },
  },
});
