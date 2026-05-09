import { nextInstanceId } from "../minions/define";
import type { GameState, Hero, MinionInstance, SpellInstance, Tribe } from "../types";
import { updatePlayer } from "../utils";

export const kingMukla: Hero = {
  id: "king_mukla",
  name: "King Mukla",
  description: "Start each turn with a Banana in your hand.",
  startHp: 30,
  startArmor: 3,
  power: { kind: "active", cost: 1, usesPerTurn: 1, description: "Give opponent 2 Bananas." },

  onHeroPower: (state, playerId, _target) => {
    const player = state.players[playerId];
    if (!player) return state;

    // Find the opponent this player is currently fighting this turn.
    let currentPairing: [import("../types").PlayerId, import("../types").PlayerId] | null = null;
    for (const pairing of state.pairingsHistory) {
      if (pairing[0] === playerId || pairing[1] === playerId) {
        currentPairing = pairing;
      }
    }

    if (!currentPairing) return state;

    const opponentId = currentPairing[0] === playerId ? currentPairing[1] : currentPairing[0];
    const opponent = state.players[opponentId];
    if (!opponent) return state;

    const banana1: SpellInstance = {
      instanceId: nextInstanceId(),
      cardId: "banana",
    };
    const banana2: SpellInstance = {
      instanceId: nextInstanceId(),
      cardId: "banana",
    };

    return updatePlayer(state, opponentId, (p) => ({
      ...p,
      spells: [...p.spells, banana1, banana2],
    }));
  },
};

export function grantBanana(state: GameState, playerId: import("../types").PlayerId): GameState {
  const bananaInstance: SpellInstance = {
    instanceId: nextInstanceId(),
    cardId: "banana",
  };
  return updatePlayer(state, playerId, (p) => ({
    ...p,
    spells: [...p.spells, bananaInstance],
  }));
}
