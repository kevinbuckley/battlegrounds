import { defineMinion } from "../define";

export default defineMinion({
  id: "grombi_the_rotunda_elemental",
  name: "Grombi the Rotunda",
  tier: 3,
  tribes: ["Elemental"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
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
