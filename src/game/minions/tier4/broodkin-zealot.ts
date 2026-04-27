import { defineMinion } from "../define";

export default defineMinion({
  id: "broodkin_zealot",
  name: "Broodkin Zealot",
  tier: 4,
  tribes: ["Elemental"],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: ["cleave"],
  spellDamage: 0,
  hooks: {},
});
