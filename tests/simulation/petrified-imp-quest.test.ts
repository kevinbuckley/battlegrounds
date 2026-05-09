/**
 * Simulation tests for Petrified Imps Quest.
 *
 * Quest: Summon 3x 1/1 Demons with Rush each turn, stacking.
 * Completes after 3 turns (progress = 3).
 * Reward: 3 × progress × 1/1 Demons with Rush are summoned to your board.
 */
import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { petrifiedImps } from "@/game/quests/index";
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
    cardId: "petrified_imps",
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
// Quest progress and completion
// ---------------------------------------------------------------------------

describe("petrified-imp-quest", () => {
  it("increments progress on each onProgress call", () => {
    const state = makeQuestState([], 0);
    const rng = makeRng(0);

    let s = petrifiedImps.onProgress(state, 0, rng);
    expect(s.players[0]!.quests[0]!.progress).toBe(1);

    s = petrifiedImps.onProgress(s, 0, rng);
    expect(s.players[0]!.quests[0]!.progress).toBe(2);

    s = petrifiedImps.onProgress(s, 0, rng);
    expect(s.players[0]!.quests[0]!.progress).toBe(3);
  });

  it("isComplete returns true when progress >= target (3)", () => {
    const state = makeQuestState([], 3);
    expect(petrifiedImps.isComplete(state, 0)).toBe(true);
  });

  it("isComplete returns false when progress < target", () => {
    const state = makeQuestState([], 1);
    expect(petrifiedImps.isComplete(state, 0)).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Quest reward — summoning 1/1 Demons with Rush
  // -----------------------------------------------------------------------

  it("summons 3x 1/1 Demons with Rush on first completion (progress=1)", () => {
    const state = makeQuestState([], 1);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    const impCount = player.board.filter((m) => m.cardId === "petrified_imp").length;
    expect(impCount).toBe(3);

    for (const imp of player.board.filter((m) => m.cardId === "petrified_imp")) {
      expect(imp.atk).toBe(1);
      expect(imp.hp).toBe(1);
      expect(imp.tribes).toContain("Demon");
      expect(imp.keywords.has("rush")).toBe(true);
    }
  });

  it("summons 6x 1/1 Demons with Rush at progress=2 (stacking)", () => {
    const state = makeQuestState([], 2);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    const impCount = player.board.filter((m) => m.cardId === "petrified_imp").length;
    expect(impCount).toBe(6);
  });

  it("summons 9x 1/1 Demons with Rush at progress=3 (full quest)", () => {
    const state = makeQuestState([], 3);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    // Quest tries to summon 9 imps (3 × 3), but board cap is 7
    // Since board is empty, all 7 slots are available
    const impCount = player.board.filter((m) => m.cardId === "petrified_imp").length;
    expect(impCount).toBe(7);
    expect(player.board.length).toBe(7);
  });

  it("respects board cap of 7 — fewer tokens if board has existing minions", () => {
    const existingMinions = [m("voidlord"), m("imp_gang_boss"), m("dreadscale")];
    const state = makeQuestState(existingMinions, 3);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    // 3 existing + 9 potential = 12, cap is 7 → only 4 imps fit
    const impCount = player.board.filter((m) => m.cardId === "petrified_imp").length;
    expect(impCount).toBe(4);
    expect(player.board.length).toBe(7);
  });

  it("respects board cap when board is nearly full", () => {
    const existingMinions = [
      m("voidlord"),
      m("imp_gang_boss"),
      m("dreadscale"),
      m("scurpus"),
      m("flame_imp"),
      m("bloodsail_pirate"),
      m("stonehill-defender"),
    ];
    const state = makeQuestState(existingMinions, 3);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    const impCount = player.board.filter((m) => m.cardId === "petrified_imp").length;
    expect(impCount).toBe(0);
    expect(player.board.length).toBe(7);
  });

  it("does nothing when board is full and progress=1", () => {
    const existingMinions = [
      m("voidlord"),
      m("imp_gang_boss"),
      m("dreadscale"),
      m("scurpus"),
      m("flame_imp"),
      m("bloodsail_pirate"),
      m("stonehill-defender"),
    ];
    const state = makeQuestState(existingMinions, 1);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    const impCount = player.board.filter((m) => m.cardId === "petrified_imp").length;
    expect(impCount).toBe(0);
  });

  it("all summoned imps have Demon tribe and Rush keyword", () => {
    const state = makeQuestState([], 3);
    const result = petrifiedImps.onReward(state, 0, makeRng(0));
    const player = getPlayer(result, 0);

    const imps = player.board.filter((m) => m.cardId === "petrified_imp");
    for (const imp of imps) {
      expect(imp.tribes).toContain("Demon");
      expect(imp.keywords.has("rush")).toBe(true);
      expect(imp.golden).toBe(false);
      expect(imp.atk).toBe(1);
      expect(imp.hp).toBe(1);
    }
  });
});
