import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

export const georgeTheFallen: Hero = {
  id: "george_the_fallen",
  name: "George the Fallen",
  description: "Hero Power (2): Give a friendly minion Divine Shield.",
  startHp: 35,
  startArmor: 5,
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
          ? { ...m, keywords: new Set([...m.keywords, "divine_shield" as const]) }
          : m,
      ),
    }));
  },
};
