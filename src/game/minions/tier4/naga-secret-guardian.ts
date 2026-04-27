import { defineMinion } from "../define";

export default defineMinion({
  id: "naga_secret_guardian",
  name: "Naga Secret Guardian",
  tier: 4,
  tribes: ["Naga"],
  baseAtk: 4,
  baseHp: 2,
  baseKeywords: ["taunt", "divineShield"],
  spellDamage: 0,
  hooks: {},
});
