import { defineMinion } from "../define";

export default defineMinion({
  id: "grombi_the_rotunda",
  name: "Grombi the Rotunda",
  tier: 2,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: ["magnetic"],
  spellDamage: 0,
  hooks: {
    onAllyKill: ({ self, dead }) => {
      const atkGain = 2;
      const hpGain = 2;
      self.atk += atkGain;
      self.hp += hpGain;
      self.maxHp += hpGain;
    },
  },
});
