import { defineMinion } from "../define";

export default defineMinion({
  id: "bronze_warden",
  name: "Bronze Warden",
  tier: 3,
  tribes: ["Dragon"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: ["divineShield", "rush"],
  spellDamage: 0,
  hooks: {},
});
