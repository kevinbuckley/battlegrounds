import { defineMinion } from "../define";

export default defineMinion({
  id: "taunt_minion",
  name: "Taunt Minion",
  tier: 1,
  tribes: [],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {},
});
