import { defineMinion } from "../define";

export default defineMinion({
  id: "swat_recruit",
  name: "Swat Recruit",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: ["rush"],
  spellDamage: 0,
  hooks: {},
});
