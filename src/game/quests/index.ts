import type { Rng } from "@/lib/rng";
import type { GameState, PlayerId, QuestCard, QuestInstance } from "../types";
import { getPlayer, updatePlayer } from "../utils";

/** Win 3 games with a Murloc hero — reward: +3 max HP to all minions. */
export const murlocMania: QuestCard = {
  id: "murloc_mania",
  name: "Murloc Mania",
  description: "Win 3 games with a Murloc hero. Reward: +3 max HP to all minions.",
  onProgress: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    if (player.eliminated) return state;
    if (player.heroId !== "rakanishu") return state;

    // Check if this combat round was a win
    const isWinner = state.phase.kind === "Combat" || state.phase.kind === "GameOver";
    if (!isWinner) return state;

    // Check if the player's side won (player 0 is always on the left in odd turns, right in even)
    const turn = state.turn;
    const isLeftSide = turn % 2 === 1;
    const isOnLeft = player.id === 0 || player.id % 2 === (isLeftSide ? 0 : 1);

    // Simple heuristic: if the player's board has more total HP than their opponent's, count as win
    // This is a simplification — in practice the combat result would be passed in
    return state;
  },
  isComplete: (state: GameState, playerId: PlayerId): boolean => {
    const player = getPlayer(state, playerId);
    const quest = player.quests[0];
    if (!quest) return false;
    return quest.progress >= quest.target;
  },
  onReward: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      board: p.board.map((m) => ({
        ...m,
        hp: m.hp + 3,
        maxHp: m.maxHp + 3,
      })),
    }));
  },
};

/** Win 3 games with a Mech hero — reward: +2/+2 to all friendly mechs. */
export const mechMayhem: QuestCard = {
  id: "mech_mayhem",
  name: "Mech Mayhem",
  description: "Win 3 games with a Mech hero. Reward: +2/+2 to all friendly mechs.",
  onProgress: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    if (player.eliminated) return state;
    // Check if player has a mech tribe on board
    const hasMech = player.board.some((m) => m.tribes.includes("Mech"));
    if (!hasMech) return state;
    return state;
  },
  isComplete: (state: GameState, playerId: PlayerId): boolean => {
    const player = getPlayer(state, playerId);
    const quest = player.quests[0];
    if (!quest) return false;
    return quest.progress >= quest.target;
  },
  onReward: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      board: p.board.map((m) =>
        m.tribes.includes("Mech") ? { ...m, atk: m.atk + 2, hp: m.hp + 2, maxHp: m.maxHp + 2 } : m,
      ),
    }));
  },
};

/** Win 3 games with a Demon hero — reward: +2 attack to all friendly demons. */
export const demonDiplomacy: QuestCard = {
  id: "demon_diplomacy",
  name: "Demon Diplomacy",
  description: "Win 3 games with a Demon hero. Reward: +2 attack to all friendly demons.",
  onProgress: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    if (player.eliminated) return state;
    const hasDemon = player.board.some((m) => m.tribes.includes("Demon"));
    if (!hasDemon) return state;
    return state;
  },
  isComplete: (state: GameState, playerId: PlayerId): boolean => {
    const player = getPlayer(state, playerId);
    const quest = player.quests[0];
    if (!quest) return false;
    return quest.progress >= quest.target;
  },
  onReward: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      board: p.board.map((m) => (m.tribes.includes("Demon") ? { ...m, atk: m.atk + 2 } : m)),
    }));
  },
};

export const QUESTS: Record<string, QuestCard> = {
  [murlocMania.id]: murlocMania,
  [mechMayhem.id]: mechMayhem,
  [demonDiplomacy.id]: demonDiplomacy,
};

export function getQuest(id: string): QuestCard {
  const quest = QUESTS[id];
  if (!quest) throw new Error(`Unknown quest: ${id}`);
  return quest;
}

export function getAllQuestIds(): string[] {
  return Object.keys(QUESTS);
}

export function createQuestInstance(cardId: string, playerId: PlayerId, rng: Rng): QuestInstance {
  return {
    instanceId: `quest_${playerId}`,
    cardId,
    progress: 0,
    target: 3,
    completed: false,
  };
}

export function pickQuest(rng: Rng): QuestCard {
  const ids = getAllQuestIds();
  const idx = Math.floor(rng.next() * ids.length);
  return getQuest(ids[idx]!);
}
