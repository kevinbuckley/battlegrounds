import { describe, expect, it } from "vitest";
import { greedy } from "../../src/ai/heuristics/greedy";
import { makePlayerView } from "../../src/ai/strategy";
import { defineMinion, instantiate } from "../../src/game/minions/define";
import { MINIONS } from "../../src/game/minions/index";
import { makeInitialState, step } from "../../src/game/state";
import type { GameState } from "../../src/game/types";
import { makeRng } from "../../src/lib/rng";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RNG = makeRng(42);

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: {},
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [],
            hand: [],
            board: [],
            heroId: "patchwerk",
            ...overrides,
          }
        : { ...p, heroId: "patchwerk" },
    ),
  };
}

// ---------------------------------------------------------------------------
// Greedy AI — tier upgrade test
// ---------------------------------------------------------------------------

describe("greedy AI — tier upgrade", () => {
  it("upgrades tavern tier when board has ≥4 minions and gold ≥ upgradeCost", () => {
    const minionCard = defineMinion({
      id: "test_tier_upgrade_minion",
      name: "Test Minion",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[minionCard.id] = minionCard;

    const card = defineMinion({
      id: "test_tier_upgrade_minion",
      name: "Test Minion",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card.id] = card;
    const boardMinions = [1, 2, 3, 4].map(() => instantiate(card));
    const state = makeTestState({
      board: boardMinions,
      gold: 10,
      tier: 1,
      upgradeCost: 5,
      upgradedThisTurn: false,
    });

    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);

    // The greedy AI should include an UpgradeTier action
    const upgradeAction = actions.find((a) => a.kind === "UpgradeTier");
    expect(upgradeAction).toBeDefined();
    expect(upgradeAction!.kind).toBe("UpgradeTier");
    expect(upgradeAction!.player).toBe(0);

    // Verify the state after only the UpgradeTier action (skip EndTurn which triggers combat)
    const upgradedState = actions
      .filter((a) => a.kind !== "EndTurn")
      .reduce((s, a) => step(s, a, RNG), state);
    expect(upgradedState.players[0]!.tier).toBe(2);
    // 10 gold - 5 cost = 5 remaining
    expect(upgradedState.players[0]!.gold).toBe(5);
  });

  it("does NOT upgrade when board has <4 minions and strength <10", () => {
    const minionCard = defineMinion({
      id: "test_tier_upgrade_minion2",
      name: "Test Minion 2",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[minionCard.id] = minionCard;

    // Only 2 minions, total strength = 4 (< 10 and < 4 minions)
    const card2 = defineMinion({
      id: "test_tier_upgrade_minion2",
      name: "Test Minion 2",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card2.id] = card2;
    const boardMinions2 = [1, 2].map(() => instantiate(card2));
    const state = makeTestState({
      board: boardMinions2,
      gold: 10,
      tier: 1,
      upgradeCost: 5,
      upgradedThisTurn: false,
    });

    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);

    // The greedy AI should NOT include an UpgradeTier action
    const upgradeAction = actions.find((a) => a.kind === "UpgradeTier");
    expect(upgradeAction).toBeUndefined();
  });

  it("does NOT upgrade when gold < upgradeCost", () => {
    const card3 = defineMinion({
      id: "test_tier_upgrade_minion3",
      name: "Test Minion 3",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card3.id] = card3;

    // 4 minions with strength 6 each = 24 (strong enough), but only 3 gold
    const boardMinions3 = [1, 2, 3, 4].map(() => instantiate(card3));
    const state = makeTestState({
      board: boardMinions3,
      gold: 3,
      tier: 1,
      upgradeCost: 5,
      upgradedThisTurn: false,
    });

    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);

    const upgradeAction = actions.find((a) => a.kind === "UpgradeTier");
    expect(upgradeAction).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Greedy AI — sell weakest minion when board is full
// ---------------------------------------------------------------------------

describe("greedy AI — sell weakest when board full", () => {
  it("sells the board minion with lowest (atk+hp) score", () => {
    const card1 = defineMinion({
      id: "test_sell_weakest_1",
      name: "Test Minion 1",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card1.id] = card1;

    const card2 = defineMinion({
      id: "test_sell_weakest_2",
      name: "Test Minion 2",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card2.id] = card2;

    const card3 = defineMinion({
      id: "test_sell_weakest_3",
      name: "Test Minion 3",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card3.id] = card3;

    // Board: [3/3 (score 6), 1/1 (score 2), 2/2 (score 4)]
    // Weakest is 1/1 at index 1
    const boardMinions = [instantiate(card2), instantiate(card1), instantiate(card3)];
    const handCard = defineMinion({
      id: "test_sell_weakest_hand",
      name: "Hand Minion",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 4,
      baseHp: 4,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[handCard.id] = handCard;
    const handMinion = instantiate(handCard);

    const state = makeTestState({
      board: boardMinions,
      hand: [handMinion],
      gold: 5,
      tier: 1,
    });

    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);

    // Should sell the weakest minion (1/1 at index 1)
    const sellAction = actions.find((a) => a.kind === "SellMinion" && "boardIndex" in a);
    expect(sellAction).toBeDefined();
    expect((sellAction as { boardIndex: number }).boardIndex).toBe(1);
  });

  it("sells the minion with the highest board index when scores tie", () => {
    const card = defineMinion({
      id: "test_sell_tie",
      name: "Tie Minion",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[card.id] = card;

    // All minions have score 4 (2+2), highest index (3) should be sold
    const boardMinions = [0, 1, 2, 3].map(() => instantiate(card));
    const handCard = defineMinion({
      id: "test_sell_tie_hand",
      name: "Hand Minion",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 4,
      baseHp: 4,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[handCard.id] = handCard;
    const handMinion = instantiate(handCard);

    const state = makeTestState({
      board: boardMinions,
      hand: [handMinion],
      gold: 5,
      tier: 1,
    });

    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);

    const sellAction = actions.find((a) => a.kind === "SellMinion" && "boardIndex" in a);
    expect(sellAction).toBeDefined();
    // Highest index (3) should be sold when all scores tie
    expect((sellAction as { boardIndex: number }).boardIndex).toBe(3);
  });
});
