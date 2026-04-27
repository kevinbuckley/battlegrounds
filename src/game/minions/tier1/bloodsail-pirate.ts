import { defineMinion } from "../define";

export default defineMinion({
  id: "bloodsail_pirate",
  name: "Bloodsail Pirate",
  tier: 1,
  tribes: ["Pirate"],
  baseAtk: 1,
  baseHp: 2,
  baseKeywords: ["collateralDamage1"],
  spellDamage: 0,
  hooks: {},
});
