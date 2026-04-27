import { defineMinion } from "../define";

export default defineMinion({
  id: "frostbound-golem",
  name: "Frostbound Golem",
  tier: 3,
  tribes: ["Elemental"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: ["freeze"],
  spellDamage: 0,
  hooks: {},
});
