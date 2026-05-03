import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

/**
 * Reno Jackson: Hero Power (5), once per game — make a friendly minion golden.
 * In real Battlegrounds, Reno Jackson's hero power turns a minion golden.
 */
export const renoJackson: Hero = {
  id: "reno_jackson",
  name: "Reno Jackson",
  description: "Hero Power (5): Make a friendly minion golden. (Once per game)",
  startHp: 30,
  startArmor: 7,
  power: { kind: "active", cost: 5, usesPerTurn: 1 },

  onHeroPower: (state, playerId, target) => {
    const boardIndex = typeof target === "number" ? target : 0;
    const player = getPlayer(state, playerId);
    const minion = player.board[boardIndex];
    if (!minion) return state;

    // Sum actual stats of the minion being made golden (preserves buffs).
    // A golden minion has 2x base stats, but we preserve the actual stats
    // from buffs already applied (matching triple merge behavior).
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      renoJacksonUsed: true,
      board: p.board.map((m, i) =>
        i === boardIndex
          ? {
              ...m,
              golden: true,
              atk: m.atk,
              hp: m.hp,
              maxHp: m.maxHp,
            }
          : m,
      ),
    }));
  },
};
