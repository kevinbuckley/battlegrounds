import { defineMinion } from "../define";

export default defineMinion({
  id: "gazelle_t1",
  name: "Gazelle",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: ["rush"],
  spellDamage: 0,
  hooks: {},
});
