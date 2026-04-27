import { defineMinion } from "../define";

export const bountyMinion = defineMinion({
  id: "bounty_minion",
  name: "Bounty Minion",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: ["bounty"],
  spellDamage: 0,
  bountyCost: 1,
  hooks: {},
});
