import { defineMinion } from "../define";

export default defineMinion({
  id: "mama_bear",
  name: "Mama Bear",
  tier: 6,
  tribes: ["Beast"],
  baseAtk: 5,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onSummon: ({ self, summoned }) => {
      if (summoned.instanceId === self.instanceId) return;
      if (!summoned.tribes.includes("Beast")) return;

      self.atk += 5;
      self.hp += 5;
      self.maxHp += 5;
    },
  },
});
