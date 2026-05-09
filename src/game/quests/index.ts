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

    const quest = player.quests[0];
    if (!quest || quest.completed) return state;

    // Check if the player won this combat round
    const isWinner = state.phase.kind === "Combat" || state.phase.kind === "GameOver";
    if (!isWinner) return state;

    // Determine if player was on the winning side of their pairing
    const turn = state.turn;
    const isLeftSide = turn % 2 === 1;
    const isOnLeft = player.id === 0 || player.id % 2 === (isLeftSide ? 0 : 1);

    // Count total HP of player's board vs opponent's board
    const myBoard = player.board.filter((m) => m.hp > 0);
    const opponentId = isOnLeft
      ? isLeftSide
        ? ((player.id + 1) as PlayerId)
        : ((player.id - 1) as PlayerId)
      : isLeftSide
        ? ((player.id - 1) as PlayerId)
        : ((player.id + 1) as PlayerId);
    const opponent = getPlayer(state, opponentId);
    const oppBoard = opponent.board.filter((m) => m.hp > 0);

    const myTotalHp = myBoard.reduce((sum, m) => sum + m.hp, 0);
    const oppTotalHp = oppBoard.reduce((sum, m) => sum + m.hp, 0);

    // Player wins if their total HP >= opponent's total HP (simplified)
    if (myTotalHp >= oppTotalHp && myBoard.length > 0) {
      const updatedQuest: QuestInstance = {
        ...quest,
        progress: quest.progress + 1,
      };
      return updatePlayer(state, playerId, (p) => ({
        ...p,
        quests: [updatedQuest],
      }));
    }

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
        m.tribes.includes("Murloc") ? { ...m, hp: m.hp + 3, maxHp: m.maxHp + 3 } : m,
      ),
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

    const quest = player.quests[0];
    if (!quest || quest.completed) return state;

    // Check if player has a mech tribe on board
    const hasMech = player.board.some((m) => m.tribes.includes("Mech"));
    if (!hasMech) return state;

    // Check if the player won this combat round
    const isWinner = state.phase.kind === "Combat" || state.phase.kind === "GameOver";
    if (!isWinner) return state;

    const turn = state.turn;
    const isLeftSide = turn % 2 === 1;
    const isOnLeft = player.id === 0 || player.id % 2 === (isLeftSide ? 0 : 1);

    const myBoard = player.board.filter((m) => m.hp > 0);
    const opponentId = isOnLeft
      ? isLeftSide
        ? ((player.id + 1) as PlayerId)
        : ((player.id - 1) as PlayerId)
      : isLeftSide
        ? ((player.id - 1) as PlayerId)
        : ((player.id + 1) as PlayerId);
    const opponent = getPlayer(state, opponentId);
    const oppBoard = opponent.board.filter((m) => m.hp > 0);

    const myTotalHp = myBoard.reduce((sum, m) => sum + m.hp, 0);
    const oppTotalHp = oppBoard.reduce((sum, m) => sum + m.hp, 0);

    if (myTotalHp >= oppTotalHp && myBoard.length > 0) {
      const updatedQuest: QuestInstance = {
        ...quest,
        progress: quest.progress + 1,
      };
      return updatePlayer(state, playerId, (p) => ({
        ...p,
        quests: [updatedQuest],
      }));
    }

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

    const quest = player.quests[0];
    if (!quest || quest.completed) return state;

    // Check if player has a demon tribe on board
    const hasDemon = player.board.some((m) => m.tribes.includes("Demon"));
    if (!hasDemon) return state;

    // Check if the player won this combat round
    const isWinner = state.phase.kind === "Combat" || state.phase.kind === "GameOver";
    if (!isWinner) return state;

    const turn = state.turn;
    const isLeftSide = turn % 2 === 1;
    const isOnLeft = player.id === 0 || player.id % 2 === (isLeftSide ? 0 : 1);

    const myBoard = player.board.filter((m) => m.hp > 0);
    const opponentId = isOnLeft
      ? isLeftSide
        ? ((player.id + 1) as PlayerId)
        : ((player.id - 1) as PlayerId)
      : isLeftSide
        ? ((player.id - 1) as PlayerId)
        : ((player.id + 1) as PlayerId);
    const opponent = getPlayer(state, opponentId);
    const oppBoard = opponent.board.filter((m) => m.hp > 0);

    const myTotalHp = myBoard.reduce((sum, m) => sum + m.hp, 0);
    const oppTotalHp = oppBoard.reduce((sum, m) => sum + m.hp, 0);

    if (myTotalHp >= oppTotalHp && myBoard.length > 0) {
      const updatedQuest: QuestInstance = {
        ...quest,
        progress: quest.progress + 1,
      };
      return updatePlayer(state, playerId, (p) => ({
        ...p,
        quests: [updatedQuest],
      }));
    }

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

/** Win 3 combats while having 3+ Dragons on board — reward: all friendly Dragons +3/+3. */
export const dragonDiplomacy: QuestCard = {
  id: "dragon_diplomacy",
  name: "Dragon Diplomacy",
  description:
    "Win 3 combats while having 3+ Dragons on board. Reward: all friendly Dragons +3/+3.",
  onProgress: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    if (player.eliminated) return state;

    const quest = player.quests[0];
    if (!quest || quest.completed) return state;

    // Check if player has 3+ Dragons on board
    const dragonCount = player.board.filter((m) => m.tribes.includes("Dragon")).length;
    if (dragonCount < 3) return state;

    // Check if the player won this combat round
    const isWinner = state.phase.kind === "Combat" || state.phase.kind === "GameOver";
    if (!isWinner) return state;

    const turn = state.turn;
    const isLeftSide = turn % 2 === 1;
    const isOnLeft = player.id === 0 || player.id % 2 === (isLeftSide ? 0 : 1);

    const myBoard = player.board.filter((m) => m.hp > 0);
    const opponentId = isOnLeft
      ? isLeftSide
        ? ((player.id + 1) as PlayerId)
        : ((player.id - 1) as PlayerId)
      : isLeftSide
        ? ((player.id - 1) as PlayerId)
        : ((player.id + 1) as PlayerId);
    const opponent = getPlayer(state, opponentId);
    const oppBoard = opponent.board.filter((m) => m.hp > 0);

    const myTotalHp = myBoard.reduce((sum, m) => sum + m.hp, 0);
    const oppTotalHp = oppBoard.reduce((sum, m) => sum + m.hp, 0);

    if (myTotalHp >= oppTotalHp && myBoard.length > 0) {
      const updatedQuest: QuestInstance = {
        ...quest,
        progress: quest.progress + 1,
      };
      return updatePlayer(state, playerId, (p) => ({
        ...p,
        quests: [updatedQuest],
      }));
    }

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
        m.tribes.includes("Dragon")
          ? { ...m, atk: m.atk + 3, hp: m.hp + 3, maxHp: m.maxHp + 3 }
          : m,
      ),
    }));
  },
};

/** Summon 3x 1/1 Demons with Rush each turn, stacking. Completes after 3 turns. */
export const petrifiedImps: QuestCard = {
  id: "petrified_imps",
  name: "Petrified Imps Quest",
  description: "Summon 3x 1/1 Demons with Rush each turn, stacking. Completes after 3 turns.",
  onProgress: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    if (player.eliminated) return state;

    const quest = player.quests[0];
    if (!quest || quest.completed) return state;

    // Increment progress each turn
    const updatedQuest: QuestInstance = {
      ...quest,
      progress: quest.progress + 1,
    };
    return updatePlayer(state, playerId, (p) => ({
      ...p,
      quests: [updatedQuest],
    }));
  },
  isComplete: (state: GameState, playerId: PlayerId): boolean => {
    const player = getPlayer(state, playerId);
    const quest = player.quests[0];
    if (!quest) return false;
    return quest.progress >= quest.target;
  },
  onReward: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = getPlayer(state, playerId);
    const progress = player.quests[0]?.progress ?? 3;
    // Summon 3x 1/1 Demons with Rush for each progress point (3 per turn × 3 turns = 9)
    const totalImps = 3 * progress;
    const currentBoard = player.board.filter((m) => m.hp > 0);
    const space = Math.max(0, 7 - currentBoard.length);
    const actualImps = Math.min(totalImps, space);

    let result = state;
    for (let i = 0; i < actualImps; i++) {
      result = updatePlayer(result, playerId, (p) => ({
        ...p,
        board: [
          ...p.board,
          {
            instanceId: `petrified_imp_${playerId}_${i}`,
            cardId: "petrified_imp",
            baseAtk: 1,
            baseHp: 1,
            atk: 1,
            hp: 1,
            maxHp: 1,
            keywords: new Set(["rush"]),
            tribes: ["Demon"],
            golden: false,
            spellDamage: 0,
            magnetic: false,
            baronRivendare: false,
            attachments: {},
            hooks: {},
          },
        ],
      }));
    }
    return result;
  },
};

export const QUESTS: Record<string, QuestCard> = {
  [murlocMania.id]: murlocMania,
  [mechMayhem.id]: mechMayhem,
  [demonDiplomacy.id]: demonDiplomacy,
  [dragonDiplomacy.id]: dragonDiplomacy,
  [petrifiedImps.id]: petrifiedImps,
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
  return rng.pick(getAllQuestIds().map(getQuest));
}
