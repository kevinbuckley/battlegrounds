import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

/**
 * Pyramad: Hero Power (1) — give a random friendly minion +4 HP.
 * In real Battlegrounds, Pyramad's hero power gives a random friendly
 * minion +4 Health.
 */
export const pyramad: Hero = {
  id: "pyramad",
  name: "Pyramad",
  description: "Hero Power (1): Give a random friendly minion +4 HP.",
  startHp: 30,
  startArmor: 0,
  power: {
    kind: "active",
    cost: 1,
    usesPerTurn: 1,
    description: "Give a random friendly minion +4 HP.",
  },

  onHeroPower: (state, playerId, _target, rng) => {
    const player = getPlayer(state, playerId);
    if (player.board.length === 0) return state;

    const targetIndex = rng.pick(player.board.map((_, i) => i));

    return updatePlayer(state, playerId, (p) => ({
      ...p,
      board: p.board.map((m, i) => {
        if (i !== targetIndex) return m;
        return {
          ...m,
          atk: m.atk,
          hp: m.hp + 4,
          maxHp: m.maxHp + 4,
        };
      }),
    }));
  },
};
