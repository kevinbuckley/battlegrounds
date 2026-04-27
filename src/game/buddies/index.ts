import type { Rng } from "@/lib/rng";
import { instantiate } from "../minions/define";
import { MINIONS } from "../minions/index";
import type { BuddyCard, BuddyInstance, GameState, PlayerId, PlayerState } from "../types";

export const ymber: BuddyCard = {
  id: "ymber",
  name: "Ymber",
  description: "A 1/1 Beast with Rush. Activates after 3 turns.",
  heroId: "",
  minionCardId: "rush_minion",
  activationTurn: 3,
};

export const rolo: BuddyCard = {
  id: "rolo",
  name: "RoLo",
  description: "A 2/2 Mech with Cleave. Activates after 4 turns.",
  heroId: "",
  minionCardId: "broodkin_zealot",
  activationTurn: 4,
};

export const goblinMinion: BuddyCard = {
  id: "goblin_minion",
  name: "Goblin Minion",
  description: "A 1/1 Elemental. Activates after 2 turns.",
  heroId: "",
  minionCardId: "gnoma_tinker",
  activationTurn: 2,
};

export const BUDDIES: Record<string, BuddyCard> = {
  [ymber.id]: ymber,
  [rolo.id]: rolo,
  [goblinMinion.id]: goblinMinion,
};

export function getBuddy(id: string): BuddyCard {
  const buddy = BUDDIES[id];
  if (!buddy) throw new Error(`Unknown buddy: ${id}`);
  return buddy;
}

export function getAllBuddyIds(): string[] {
  return Object.keys(BUDDIES);
}

export function pickBuddy(rng: Rng): BuddyCard {
  const ids = getAllBuddyIds();
  const idx = Math.floor(rng.next() * ids.length);
  return getBuddy(ids[idx]!);
}

export function createBuddyInstance(
  cardId: string,
  playerId: PlayerId,
  activationTurn: number,
  rng: Rng,
): BuddyInstance {
  return {
    instanceId: `buddy_${playerId}`,
    cardId,
    activated: false,
    activationTurn,
  };
}

export function activateBuddies(state: GameState, playerId: PlayerId, rng: Rng): GameState {
  const player = state.players[playerId];
  if (!player) return state;

  let result = state;
  for (const buddy of player.buddies) {
    if (buddy.activated) continue;
    if (result.turn < buddy.activationTurn) continue;

    const buddyCard = getBuddy(buddy.cardId);
    const minionCard = MINIONS[buddyCard.minionCardId];
    if (!minionCard) continue;

    const minion = instantiate(minionCard);
    result = updatePlayer(result, playerId, (p) => ({
      ...p,
      hand: [...p.hand, minion],
    }));

    result = updatePlayer(result, playerId, (p) => ({
      ...p,
      buddies: p.buddies.map((b) =>
        b.instanceId === buddy.instanceId ? { ...b, activated: true } : b,
      ),
    }));
  }

  return result;
}

function updatePlayer(
  state: GameState,
  playerId: number,
  fn: (p: PlayerState) => PlayerState,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? fn(p) : p)),
  };
}

export function pickBuddyForPlayer(
  state: GameState,
  playerId: PlayerId,
  rng: Rng,
): BuddyCard | null {
  const player = state.players[playerId];
  if (!player) return null;
  const eligible = getAllBuddyIds().filter(
    (id) =>
      BUDDIES[id as keyof typeof BUDDIES]?.heroId === "" ||
      BUDDIES[id as keyof typeof BUDDIES]?.heroId === player.heroId,
  );
  if (eligible.length === 0) return null;
  const idx = Math.floor(rng.next() * eligible.length);
  return getBuddy(eligible[idx]!);
}
