import type { Hero } from "../types";

/**
 * Jandice Barov: passive — after selling a minion, add a random minion of the
 * same tier to Bob's Tavern. (onSell hook wired in M8+.)
 */
export const jandiceBarov: Hero = {
  id: "jandice_barov",
  name: "Jandice Barov",
  description: "Passive: After you sell a minion, add a random minion of the same tier to Bob's Tavern.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "passive" },
};
