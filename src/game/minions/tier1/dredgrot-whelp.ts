import { defineMinion } from "../define";

export default defineMinion({
  id: "dredgrot_whelp",
  name: "Dredgrot Whelp",
  tier: 1,
  tribes: ["Beast", "Elemental"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: ["reborn"],
  spellDamage: 0,
  hooks: {},
});
