import type { Hero } from "../types";

/**
 * Ysera: passive — at the start of each turn, add a random Dragon to Bob's Tavern.
 * (Full shop-injection effect implemented in M8+.)
 */
export const ysera: Hero = {
  id: "ysera",
  name: "Ysera",
  description: "At the start of your turn, add a Dragon to Bob's Tavern.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "passive" },
};
