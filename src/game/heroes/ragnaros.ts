import type { Hero } from "../types";

/**
 * Ragnaros: passive flag only — the start-of-combat 8-damage effect is wired
 * through a start-of-combat hook that the combat simulator checks for heroes.
 * (Full implementation added in M8+ when hero combat effects are supported.)
 */
export const ragnaros: Hero = {
  id: "ragnaros",
  name: "Ragnaros the Firelord",
  description: "At the start of combat, deal 8 damage to the lowest-Attack enemy minion.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "passive" },
};
