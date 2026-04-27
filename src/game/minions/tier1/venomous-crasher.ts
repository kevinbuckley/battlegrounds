import { defineMinion } from "../define";

export default defineMinion({
  id: "venomous_crasher",
  name: "Venomous Crasher",
  tier: 1,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: ["poisonous"],
  spellDamage: 0,
  hooks: {},
});
