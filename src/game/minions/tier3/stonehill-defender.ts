import { defineMinion } from "../define";

export default defineMinion({
  id: "stonehill-defender",
  name: "Stonehill Defender",
  tier: 3,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 4,
  baseKeywords: ["taunt", "divineShield"],
  spellDamage: 0,
  hooks: {},
});
