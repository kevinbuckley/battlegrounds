import type { Hero } from "../types";

/**
 * A.F. Kay: start_of_game — skip your first two Recruit turns but start at
 * Tavern Tier 3 with a full shop. (Effect applied in M8+ state machine.)
 */
export const afKay: Hero = {
  id: "af_kay",
  name: "A.F. Kay",
  description: "Skip your first two turns. Start at Tavern Tier 3.",
  startHp: 40,
  startArmor: 3,
  power: { kind: "start_of_game" },
};
