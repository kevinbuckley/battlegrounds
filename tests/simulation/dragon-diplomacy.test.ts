/**
 * Simulation tests for Dragon Diplomacy Quest.
 *
 * Quest: Win 3 combats while having 3+ Dragons on board.
 * Reward: all friendly Dragons +3/+3.
 */
import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { dragonDiplomacy } from "@/game/quests/index";
import type { GameState, PlayerId } from "@/game/types";
import { getPlayer, updatePlayer } from "@/game/utils";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

function makeQuestState(
  boardMinions: ReturnType<typeof instantiate>[],
  progress: number,
): GameState {
  const rng = makeRng(0);
  const questInstance = {
    instanceId: "quest_0",
    cardId: "dragon_diplomacy",
    progress,
    target: 3,
    completed: false,
  };
  const baseState = {
    seed: 0,
    phase: { kind: "Combat" } as GameState["phase"],
    turn: 1,
    players: [
      {
        id: 0 as PlayerId,
        heroId: "ragnaros",
        hp: 25,
        maxHp: 25,
        armor: 0,
        gold: 10,
        board: boardMinions,
        hand: [],
        quests: [questInstance],
        eliminated: false,
        discovered: [],
        heroPowerUsed: false,
        lastUsedHeroPower: null,
        shopMinions: [],
        shopGoldDiscount: 0,
        shopTier: 1,
        shopRefreshesLeft: 2,
        shopFrozen: [],
        shopBanned: [],
        shopPools: {},
        buffs: [],
        modifiers: ["quests"],
      },
      {
        id: 1 as PlayerId,
        heroId: "ragnaros",
        hp: 25,
        maxHp: 25,
        armor: 0,
        gold: 10,
        board: [],
        hand: [],
        quests: [],
        eliminated: false,
        discovered: [],
        heroPowerUsed: false,
        lastUsedHeroPower: null,
        shopMinions: [],
        shopGoldDiscount: 0,
        shopTier: 1,
        shopRefreshesLeft: 2,
        shopFrozen: [],
        shopBanned: [],
        shopPools: {},
        buffs: [],
        modifiers: [],
      },
    ],
    tribeInLobby: {},
    pool: {},
    pairingsHistory: [],
    modifiers: ["quests"],
    modifierState: { quests: { 0: questInstance } },
  } as unknown as GameState;
  return baseState;
}

// ---------------------------------------------------------------------------
// Quest progress — requires 3+ Dragons on board
// ---------------------------------------------------------------------------

describe("dragon-diplomacy", () => {
  it("does NOT increment progress when board has fewer than 3 Dragons", () => {
    const dragons = [m("cobalt_scalebane"), m("dreadscale")];
    const state = makeQuestState(dragons, 0);
    const rng = makeRng(0);
    const result = dragonDiplomacy.onProgress(state, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(0);
  });

  it("increments progress when board has 3+ Dragons and combat phase", () => {
    const dragons = [m("cobalt_scalebane"), m("dreadscale"), m("drakonid_enforcer")];
    const state = makeQuestState(dragons, 0);
    const rng = makeRng(0);
    const result = dragonDiplomacy.onProgress(state, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(1);
  });

  it("increments progress when board has 5 Dragons", () => {
    const dragons = [
      m("cobalt_scalebane"),
      m("dreadscale"),
      m("drakonid_enforcer"),
      m("glyph_guardian"),
      m("hangry_dragon"),
    ];
    const state = makeQuestState(dragons, 0);
    const rng = makeRng(0);
    const result = dragonDiplomacy.onProgress(state, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(1);
  });

  it("does NOT increment when phase is not Combat", () => {
    const dragons = [m("cobalt_scalebane"), m("dreadscale"), m("drakonid_enforcer")];
    const state = makeQuestState(dragons, 0);
    const rng = makeRng(0);
    // Recruit phase — should not progress
    const recruitState = {
      ...state,
      phase: { kind: "Recruit", turn: 1 },
    } as GameState;
    const result = dragonDiplomacy.onProgress(recruitState, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(0);
  });

  it("does NOT increment when board has 3+ Dragons but no Dragons on board", () => {
    const state = makeQuestState([], 0);
    const rng = makeRng(0);
    const result = dragonDiplomacy.onProgress(state, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(0);
  });

  it("skips when quest is already completed", () => {
    const dragons = [m("cobalt_scalebane"), m("dreadscale"), m("drakonid_enforcer")];
    const state = makeQuestState(dragons, 3);
    const questInstance = {
      instanceId: "quest_0",
      cardId: "dragon_diplomacy",
      progress: 3,
      target: 3,
      completed: true,
    };
    const player = state.players[0]!;
    state.players[0] = { ...player, quests: [questInstance] };
    const rng = makeRng(0);
    const result = dragonDiplomacy.onProgress(state, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(3);
  });

  it("skips when player is eliminated", () => {
    const dragons = [m("cobalt_scalebane"), m("dreadscale"), m("drakonid_enforcer")];
    const state = makeQuestState(dragons, 0);
    const player = state.players[0]!;
    state.players[0] = { ...player, eliminated: true };
    const rng = makeRng(0);
    const result = dragonDiplomacy.onProgress(state, 0, rng);
    expect(result.players[0]!.quests[0]!.progress).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Quest completion
  // -----------------------------------------------------------------------

  it("isComplete returns true when progress >= target (3)", () => {
    const state = makeQuestState([], 3);
    expect(dragonDiplomacy.isComplete(state, 0)).toBe(true);
  });

  it("isComplete returns false when progress < target", () => {
    const state = makeQuestState([], 1);
    expect(dragonDiplomacy.isComplete(state, 0)).toBe(false);
  });

  it("isComplete returns false when no quest exists", () => {
    const state = makeQuestState([], 0);
    const player = state.players[0]!;
    state.players[0] = { ...player, quests: [] };
    expect(dragonDiplomacy.isComplete(state, 0)).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Quest reward — +3/+3 to all friendly Dragons
  // -----------------------------------------------------------------------

  it("gives all friendly Dragons +3/+3 on reward", () => {
    const dragons = [m("cobalt_scalebane"), m("dreadscale"), m("drakonid_enforcer")];
    const state = makeQuestState(dragons, 3);
    const result = dragonDiplomacy.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    for (const dragon of player.board.filter((d) => d.tribes.includes("Dragon"))) {
      const orig = dragons.find((d) => d.instanceId === dragon.instanceId);
      if (orig) {
        expect(dragon.atk).toBe(orig.atk + 3);
        expect(dragon.hp).toBe(orig.hp + 3);
        expect(dragon.maxHp).toBe(orig.maxHp + 3);
      }
    }
  });

  it("does NOT buff non-Dragon minions on reward", () => {
    const mixedBoard = [
      m("cobalt_scalebane"),
      m("dreadscale"),
      m("drakonid_enforcer"),
      m("imp_gang_boss"),
      m("stonehill-defender"),
    ];
    const state = makeQuestState(mixedBoard, 3);
    const result = dragonDiplomacy.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    // Dragons should be buffed
    const dragons = player.board.filter((d) => d.tribes.includes("Dragon"));
    for (const dragon of dragons) {
      expect(dragon.atk).toBeGreaterThan(0);
    }

    // Non-Dragons should be unchanged
    const nonDragons = player.board.filter((m) => !m.tribes.includes("Dragon"));
    for (const nonDragon of nonDragons) {
      const orig = mixedBoard.find((m) => m.instanceId === nonDragon.instanceId);
      if (orig) {
        expect(nonDragon.atk).toBe(orig.atk);
        expect(nonDragon.hp).toBe(orig.hp);
      }
    }
  });

  it("does nothing when no Dragons on board", () => {
    const nonDragons = [m("imp_gang_boss"), m("stonehill-defender")];
    const state = makeQuestState(nonDragons, 3);
    const result = dragonDiplomacy.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    for (const minion of player.board) {
      const orig = nonDragons.find((m) => m.instanceId === minion.instanceId);
      if (orig) {
        expect(minion.atk).toBe(orig.atk);
        expect(minion.hp).toBe(orig.hp);
      }
    }
  });

  it("stacks across multiple Dragons on board", () => {
    const dragons = [
      m("cobalt_scalebane"),
      m("dreadscale"),
      m("drakonid_enforcer"),
      m("glyph_guardian"),
      m("hangry_dragon"),
    ];
    const state = makeQuestState(dragons, 3);
    const result = dragonDiplomacy.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    const dragonCount = player.board.filter((d) => d.tribes.includes("Dragon")).length;
    expect(dragonCount).toBe(5);

    for (let i = 0; i < dragons.length; i++) {
      const orig = dragons[i];
      if (!orig) continue;
      const buffed = player.board.find((m) => m.instanceId === orig.instanceId);
      if (buffed) {
        expect(buffed.atk).toBe(orig.atk + 3);
        expect(buffed.hp).toBe(orig.hp + 3);
      }
    }
  });
});
