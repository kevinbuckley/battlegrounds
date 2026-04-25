import type { Hero } from "../types";

/**
 * Millificent: passive — Mechs in Bob's Tavern always have +1 ATK.
 * (Applied to shop roll results in M8+.)
 */
export const millificentManastorm: Hero = {
  id: "millificent_manastorm",
  name: "Millificent Manastorm",
  description: "Passive: Mechs in Bob's Tavern have +1 Attack.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "passive" },
};
