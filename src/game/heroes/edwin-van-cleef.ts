import type { Hero } from "../types";
import { updatePlayer } from "../utils";

export const edwinVanCleef: Hero = {
  id: "edwin_van_cleef",
  name: "Edwin Van Cleef",
  description: "Hero Power (4): Give all minions in your hand +1/+1.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "active", cost: 4, usesPerTurn: 1 },

  onHeroPower: (state, playerId) => {
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      hand: p.hand.map((m) => ({ ...m, atk: m.atk + 1, hp: m.hp + 1, maxHp: m.maxHp + 1 })),
    }));
  },
};
