import { defineMinion } from "../define";

export default defineMinion({
  id: "big_fernal",
  name: "Bigfernal",
  tier: 5,
  tribes: ["Demon"],
  baseAtk: 1,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Gains +2/+2 whenever another friendly demon is summoned during combat.
    onSummon: (ctx) => {
      const summoned = ctx.summoned;
      if (!summoned) return;
      // Only trigger for OTHER demons, not Bigfernal itself.
      if (summoned.cardId === "big_fernal") return;
      if (!summoned.tribes.includes("Demon")) return;
      ctx.self.atk += 2;
      ctx.self.hp += 2;
      ctx.self.maxHp += 2;
      ctx.emit({
        kind: "Stat",
        target: ctx.self.instanceId,
        atk: ctx.self.atk,
        hp: ctx.self.hp,
      });
    },
  },
});
