import { defineMinion } from "../define";

export default defineMinion({
  id: "combo_minion",
  name: "Combo Minion",
  tier: 1,
  tribes: [],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: ["combo"],
  spellDamage: 0,
  hooks: {},
});
