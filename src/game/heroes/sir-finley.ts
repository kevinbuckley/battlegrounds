import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

export const sirFinley: Hero = {
  id: "sir_finley",
  name: "Sir Finley Mrrgglton",
  description: "Hero Power (2): Give a friendly minion +1/+1.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "active", cost: 2, usesPerTurn: 1 },

  onHeroPower: (state, playerId, target) => {
    const boardIndex = typeof target === "number" ? target : 0;
    const player = getPlayer(state, playerId);
    const minion = player.board[boardIndex];
    if (!minion) return state;

    return updatePlayer(state, playerId, (p) => ({
      ...p,
      board: p.board.map((m, i) =>
        i === boardIndex
          ? { ...m, atk: m.atk + 1, hp: m.hp + 1, maxHp: m.maxHp + 1 }
          : m,
      ),
    }));
  },
};
