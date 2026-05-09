import { defineMinion } from "../define";

export default defineMinion({
  id: "cave_hydra",
  name: "Cave Hydra",
  tier: 4,
  tribes: ["Beast"],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: ["cleave"],
  description: "Cleave",
  spellDamage: 0,
  hooks: {},
});
