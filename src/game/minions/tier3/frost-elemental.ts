import { defineMinion } from "../define";

export default defineMinion({
  id: "frost_elemental",
  name: "Frost Elemental",
  tier: 3,
  tribes: ["Elemental"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: ["freeze"],
  spellDamage: 0,
  hooks: {},
});
