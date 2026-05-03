import type { Tribe } from "../../types";
import { defineMinion } from "../define";

const CONCRETE_TRIBES: Tribe[] = [
  "Beast",
  "Murloc",
  "Demon",
  "Mech",
  "Elemental",
  "Pirate",
  "Dragon",
  "Naga",
  "Quilboar",
  "Undead",
];

export default defineMinion({
  id: "nightmare_amalgam",
  name: "Nightmare Amalgam",
  tier: 2,
  tribes: ["All"],
  baseAtk: 2,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});
