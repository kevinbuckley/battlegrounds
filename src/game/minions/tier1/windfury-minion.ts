import { defineMinion } from "@/game/minions/define";

export const WindfuryMinion = defineMinion({
  id: "windfury-minion",
  name: "Windfury Minion",
  tier: 1,
  tribes: [],
  baseAtk: 2,
  baseHp: 3,
  baseKeywords: ["windfury"],
  spellDamage: 0,
  hooks: {},
});
