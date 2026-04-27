import { nextInstanceId } from "../minions/define";
import type { GameState, Hero, MinionInstance, SpellInstance, Tribe } from "../types";
import { updatePlayer } from "../utils";

export const kingMukla: Hero = {
  id: "king_mukla",
  name: "King Mukla",
  description: "Start each turn with a Banana in your hand.",
  startHp: 30,
  startArmor: 3,
  power: { kind: "passive" },
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
