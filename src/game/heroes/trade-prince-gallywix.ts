import type { Rng } from "@/lib/rng";
import { instantiate } from "../minions/define";
import { MINIONS } from "../minions/index";
import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

export const tradePrinceGallywix: Hero = {
  id: "trade-prince-gallywix",
  name: "Trade Prince Gallywix",
  description:
    "Hero Power (2): Discover a minion from your opponent's board and add it to your hand.",
  startHp: 40,
  startArmor: 0,
  power: { kind: "active", cost: 2, usesPerTurn: 1 },

  onHeroPower: (state, playerId, _target, rng: Rng) => {
    const player = getPlayer(state, playerId);

    // Find the opponent this player is currently fighting this turn.
    // pairingsHistory stores [leftId, rightId] for each fight.
    // The most recent pairing involving this player is the current opponent.
    let currentPairing: [import("../types").PlayerId, import("../types").PlayerId] | null = null;
    for (const pairing of state.pairingsHistory) {
      if (pairing[0] === playerId || pairing[1] === playerId) {
        currentPairing = pairing;
      }
    }

    if (!currentPairing) return state;

    const opponentId = currentPairing[0] === playerId ? currentPairing[1] : currentPairing[0];
    const opponent = getPlayer(state, opponentId);

    // Get alive minions from opponent's board
    const aliveBoard = opponent.board.filter((m) => m.hp > 0);
    if (aliveBoard.length === 0) return state;

    // Pick a random minion from the opponent's board
    const idx = Math.floor(rng.next() % aliveBoard.length);
    const chosen = aliveBoard[idx];
    if (!chosen) return state;

    // Instantiate a copy of the chosen minion's card
    const card = MINIONS[chosen.cardId];
    if (!card) return state;

    const copy = instantiate(card);

    return updatePlayer(state, playerId, (p) => ({
      ...p,
      hand: [...p.hand, copy],
    }));
  },
};
