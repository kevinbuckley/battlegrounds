import { defineMinion } from "../define";

export default defineMinion({
  id: "dragonspawn_lieutenant",
  name: "Dragonspawn Lieutenant",
  tier: 1,
  tribes: ["Dragon"],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {},
});
