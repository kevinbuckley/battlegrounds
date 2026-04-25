import type { Hero } from "../types";

export const stubHero: Hero = {
  id: "stub_hero",
  name: "Stub Hero",
  description: "A placeholder hero used in tests.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "passive" },
};
