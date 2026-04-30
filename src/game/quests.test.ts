import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import { createQuestInstance, getQuest, QUESTS } from "./quests";
import { makeInitialState, step } from "./state";
import type { GameState, PlayerId, PlayerState, QuestInstance } from "./types";

const RNG = makeRng(42);

function selectAllHeroes(state: GameState): GameState {
  let s = state;
  for (const p of s.players) {
    s = step(s, { kind: "SelectHero", player: p.id, heroId: "stub_hero" }, RNG);
  }
  return s;
}

function makeQuestPlayer(
  state: GameState,
  playerId: PlayerId,
  heroId: string,
  minionIds: string[],
): PlayerState {
  const basePlayer = state.players[playerId];
  const questInstance = createQuestInstance("murloc_mania", playerId, RNG);
  const boardMinions = minionIds.map((mid, i) => {
    const card = MINIONS[mid as keyof typeof MINIONS]!;
    return { ...instantiate(card), instanceId: `test_${playerId}_${i}`, owner: playerId };
  });
  return {
    ...basePlayer,
    heroId,
    quests: [questInstance],
    board: boardMinions,
  } as PlayerState;
}

describe("quest progress tracking", () => {
  it("creates a quest instance with progress 0", () => {
    const quest = getQuest("murloc_mania");
    const instance = createQuestInstance(quest.id, 0, RNG);
    expect(instance.progress).toBe(0);
    expect(instance.target).toBe(3);
    expect(instance.completed).toBe(false);
  });

  it("tracks quest progress on player with matching hero", () => {
    const state = makeInitialState(100);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", []);
    const questState: GameState = {
      ...selected,
      players: [questPlayerState, ...selected.players.slice(1)],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };
    const player = questState.players[0]!;
    expect(player.quests[0]?.progress).toBe(0);
    expect(player.quests[0]?.completed).toBe(false);
    expect(player.heroId).toBe("rakanishu");
  });

  it("does not track progress for non-matching hero", () => {
    const state = makeInitialState(101);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", []);
    const questState: GameState = {
      ...selected,
      players: [questPlayerState, ...selected.players.slice(1)],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };
    const result = quest.onProgress(questState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(0);
  });

  it("increments progress when murloc hero wins combat", () => {
    const state = makeInitialState(102);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", [
      "murloc_tidehunter",
      "murloc_tidehunter",
      "murloc_tidehunter",
    ]);
    const opponentState = makeQuestPlayer(selected, 1, "stub_hero", ["wrath_weaver"]);

    const combatState: GameState = {
      ...selected,
      phase: { kind: "Combat", turn: 1 },
      players: [
        questPlayerState,
        opponentState,
        ...selected.players.slice(2).map((p) => ({ ...p, eliminated: true })),
      ],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };

    const result = quest.onProgress(combatState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(1);
  });

  it("marks quest as complete after reaching target", () => {
    const state = makeInitialState(103);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", []);

    const completedQuest: QuestInstance = {
      ...questInstance,
      progress: 3,
    };
    const questState: GameState = {
      ...selected,
      players: [{ ...questPlayerState, quests: [completedQuest] }, ...selected.players.slice(1)],
    };

    expect(quest.isComplete(questState, 0)).toBe(true);
  });

  it("does not mark quest as complete before target", () => {
    const state = makeInitialState(104);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", []);

    const partialQuest: QuestInstance = {
      ...questInstance,
      progress: 1,
    };
    const questState: GameState = {
      ...selected,
      players: [{ ...questPlayerState, quests: [partialQuest] }, ...selected.players.slice(1)],
    };

    expect(quest.isComplete(questState, 0)).toBe(false);
  });

  it("applies quest reward when completed", () => {
    const state = makeInitialState(105);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const murlocCard = MINIONS["murloc_tidehunter"]!;
    const treantCard = MINIONS["wrath_weaver"]!;
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", [
      "murloc_tidehunter",
      "wrath_weaver",
    ]);

    const rewardState: GameState = {
      ...selected,
      players: [
        {
          ...questPlayerState,
          quests: [
            {
              ...questInstance,
              progress: 3,
              completed: true,
            },
          ],
        },
        ...selected.players.slice(1),
      ],
    };

    const result = quest.onReward(rewardState, 0, RNG);
    const resultPlayer = result.players[0]!;

    const murloc = resultPlayer.board.find((m) => m.cardId === "murloc_tidehunter");
    const treant = resultPlayer.board.find((m) => m.cardId === "wrath_weaver");

    expect(murloc).toBeDefined();
    expect(murloc!.hp).toBe(instantiate(murlocCard).hp + 3);
    expect(murloc!.maxHp).toBe(instantiate(murlocCard).maxHp + 3);

    expect(treant!.hp).toBe(instantiate(treantCard).hp);
  });

  it("mech_mayhem quest tracks mech presence", () => {
    const state = makeInitialState(106);
    const selected = selectAllHeroes(state);
    const quest = getQuest("mech_mayhem");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", ["stonehill-defender"]);

    const mechState: GameState = {
      ...selected,
      phase: { kind: "Combat", turn: 1 },
      players: [
        questPlayerState,
        ...selected.players.slice(1).map((p) => ({ ...p, eliminated: true })),
      ],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };

    const result = quest.onProgress(mechState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(1);
  });

  it("mech_mayhem does not track when no mech on board", () => {
    const state = makeInitialState(107);
    const selected = selectAllHeroes(state);
    const quest = getQuest("mech_mayhem");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", []);

    const noMechState: GameState = {
      ...selected,
      phase: { kind: "Combat", turn: 1 },
      players: [
        questPlayerState,
        ...selected.players.slice(1).map((p) => ({ ...p, eliminated: true })),
      ],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };

    const result = quest.onProgress(noMechState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(0);
  });

  it("demon_diplomacy tracks demon presence", () => {
    const state = makeInitialState(108);
    const selected = selectAllHeroes(state);
    const quest = getQuest("demon_diplomacy");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", ["flame_imp"]);

    const demonState: GameState = {
      ...selected,
      phase: { kind: "Combat", turn: 1 },
      players: [
        questPlayerState,
        ...selected.players.slice(1).map((p) => ({ ...p, eliminated: true })),
      ],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };

    const result = quest.onProgress(demonState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(1);
  });

  it("demon_diplomacy does not track when no demon on board", () => {
    const state = makeInitialState(109);
    const selected = selectAllHeroes(state);
    const quest = getQuest("demon_diplomacy");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", []);

    const noDemonState: GameState = {
      ...selected,
      phase: { kind: "Combat", turn: 1 },
      players: [
        questPlayerState,
        ...selected.players.slice(1).map((p) => ({ ...p, eliminated: true })),
      ],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };

    const result = quest.onProgress(noDemonState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(0);
  });

  it("does not track progress for eliminated players", () => {
    const state = makeInitialState(110);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", []);

    const eliminatedState: GameState = {
      ...selected,
      players: [{ ...questPlayerState, eliminated: true }, ...selected.players.slice(1)],
      modifiers: ["quests"],
      modifierState: {
        ...selected.modifierState,
        quests: { 0: questInstance },
      },
    };

    const result = quest.onProgress(eliminatedState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(0);
  });

  it("does not track progress for completed quests", () => {
    const state = makeInitialState(111);
    const selected = selectAllHeroes(state);
    const quest = getQuest("murloc_mania");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "rakanishu", []);

    const completedState: GameState = {
      ...selected,
      players: [
        {
          ...questPlayerState,
          quests: [
            {
              ...questInstance,
              progress: 3,
              completed: true,
            },
          ],
        },
        ...selected.players.slice(1),
      ],
    };

    const result = quest.onProgress(completedState, 0, RNG);
    const resultPlayer = result.players[0]!;
    expect(resultPlayer.quests[0]?.progress).toBe(3);
  });

  it("all quest IDs are registered", () => {
    expect(QUESTS).toHaveProperty("murloc_mania");
    expect(QUESTS).toHaveProperty("mech_mayhem");
    expect(QUESTS).toHaveProperty("demon_diplomacy");
  });

  it("getQuest returns the correct quest by ID", () => {
    expect(getQuest("murloc_mania").id).toBe("murloc_mania");
    expect(getQuest("mech_mayhem").id).toBe("mech_mayhem");
    expect(getQuest("demon_diplomacy").id).toBe("demon_diplomacy");
  });

  it("mech_mayhem reward buffs mech minions", () => {
    const state = makeInitialState(112);
    const selected = selectAllHeroes(state);
    const quest = getQuest("mech_mayhem");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", [
      "stonehill-defender",
      "wrath_weaver",
    ]);

    const rewardState: GameState = {
      ...selected,
      players: [
        {
          ...questPlayerState,
          quests: [
            {
              ...questInstance,
              progress: 3,
              completed: true,
            },
          ],
        },
        ...selected.players.slice(1),
      ],
    };

    const result = quest.onReward(rewardState, 0, RNG);
    const resultPlayer = result.players[0]!;

    const mech = resultPlayer.board.find((m) => m.cardId === "stonehill-defender");
    const nonMech = resultPlayer.board.find((m) => m.cardId === "wrath_weaver");

    expect(mech).toBeDefined();
    expect(mech!.atk).toBe(instantiate(MINIONS["stonehill-defender"]!).atk + 2);
    expect(mech!.hp).toBe(instantiate(MINIONS["stonehill-defender"]!).hp + 2);

    expect(nonMech!.atk).toBe(instantiate(MINIONS["wrath_weaver"]!).atk);
  });

  it("demon_diplomacy reward buffs demon minions", () => {
    const state = makeInitialState(113);
    const selected = selectAllHeroes(state);
    const quest = getQuest("demon_diplomacy");
    const questInstance = createQuestInstance(quest.id, 0, RNG);
    const questPlayerState = makeQuestPlayer(selected, 0, "stub_hero", [
      "flame_imp",
      "taunt_minion",
    ]);

    const rewardState: GameState = {
      ...selected,
      players: [
        {
          ...questPlayerState,
          quests: [
            {
              ...questInstance,
              progress: 3,
              completed: true,
            },
          ],
        },
        ...selected.players.slice(1),
      ],
    };

    const result = quest.onReward(rewardState, 0, RNG);
    const resultPlayer = result.players[0]!;

    const demon = resultPlayer.board.find((m) => m.cardId === "flame_imp");
    const nonDemon = resultPlayer.board.find((m) => m.cardId === "taunt_minion");

    expect(demon).toBeDefined();
    expect(demon!.atk).toBe(instantiate(MINIONS["flame_imp"]!).atk + 2);

    expect(nonDemon!.atk).toBe(instantiate(MINIONS["taunt_minion"]!).atk);
  });
});
