import type { Hero } from "../types";

export const patchwerk: Hero = {
  id: "patchwerk",
  name: "Patchwerk",
  description: "Start at 60 Health. No Hero Power.",
  startHp: 60,
  startArmor: 0,
  power: { kind: "passive" },
};
