import type { Hero } from "../types";

/**
 * Jaraxxus: passive — at the start of each recruit turn, demons in your shop
 * each gain +1/+1.
 */
export const jaraxxus: Hero = {
  id: "jaraxxus",
  name: "Jaraxxus",
  description: "At the start of your turn, demons in your shop gain +1/+1.",
  startHp: 30,
  startArmor: 5,
  power: { kind: "passive" },
};
