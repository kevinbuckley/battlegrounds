import type { Hero } from "../types";

/**
 * Sindragosa: passive — at the end of your turn, frozen minions in your shop
 * each gain +1/+1.
 */
export const sindragosa: Hero = {
  id: "sindragosa",
  name: "Sindragosa",
  description: "At the end of your turn, frozen minions in your shop each gain +1/+1.",
  startHp: 40,
  startArmor: 5,
  power: { kind: "passive" },
};
