import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

export const lichBazHial: Hero = {
  id: "lich_bazhial",
  name: "Lich Baz'hial",
  description: "Hero Power (2): Lose 3 HP, gain 2 gold.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "active", cost: 2, usesPerTurn: 1 },

  onHeroPower: (state, playerId) => {
    const player = getPlayer(state, playerId);

    return updatePlayer(state, playerId, (p) => ({
      ...p,
      hp: p.hp - 3,
      gold: p.gold + 2,
    }));
  },
};
