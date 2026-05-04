import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { upgradeTier } from "@/game/shop";
import { beginRecruitTurn, makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof beginRecruitTurn> {
  const base = makeInitialState(42);
  const shopMinion = instantiate({
    id: "test_murloc",
    name: "Test Murloc",
    tier: 1,
    tribes: ["Murloc"],
    baseAtk: 1,
    baseHp: 2,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: { test_murloc: 10 },
    players: base.players.map((p, i) =>
      i === 0 ? { ...p, gold: 10, tier: 1, shop: [shopMinion], ...overrides } : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Upgrade cost — initial value
// ---------------------------------------------------------------------------

describe("upgrade cost — initial value", () => {
  it("new player starts with upgradeCost of 5 (TIER_UPGRADE_BASE[2])", () => {
    const state = makeTestState({ tier: 1 });
    expect(state.players[0]!.upgradeCost).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Upgrade cost — decrement per turn not upgraded
// ---------------------------------------------------------------------------

describe("upgrade cost — decrement per turn", () => {
  it("decrements by 1 each turn the player does not upgrade", () => {
    let state = makeTestState({ upgradeCost: 7, upgradedThisTurn: false });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(6);
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(5);
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(4);
  });

  it("does not decrement when player has already upgraded this turn", () => {
    let state = makeTestState({ upgradeCost: 7, upgradedThisTurn: true });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(7);
  });

  it("does not decrement when player is already at tier 6", () => {
    let state = makeTestState({ tier: 6, upgradeCost: 5, upgradedThisTurn: false });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(5);
  });

  it("stops at 0, never goes negative", () => {
    let state = makeTestState({ upgradeCost: 0, upgradedThisTurn: false });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(0);
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Upgrade cost — reset on upgrade
// ---------------------------------------------------------------------------

describe("upgrade cost — reset on upgrade", () => {
  it("resets to base cost for the NEXT tier after upgrading", () => {
    const state = makeTestState({ tier: 1, upgradeCost: 5 });
    const after = upgradeTier(state, 0);
    const p = after.players[0]!;
    expect(p.tier).toBe(2);
    expect(p.upgradeCost).toBe(7); // TIER_UPGRADE_BASE[3]
  });

  it("resets to base cost for tier 6 when upgrading from tier 5", () => {
    const state = makeTestState({ tier: 5, upgradeCost: 9 });
    const after = upgradeTier(state, 0);
    const p = after.players[0]!;
    expect(p.tier).toBe(6);
    expect(p.upgradeCost).toBe(0); // tier 6 is max, no next tier cost
  });

  it("sets upgradedThisTurn to true after upgrade", () => {
    const state = makeTestState({ tier: 1 });
    const after = upgradeTier(state, 0);
    expect(after.players[0]!.upgradedThisTurn).toBe(true);
  });

  it("next upgrade cost is base value, not decremented", () => {
    // After upgrading tier 1→2, cost resets to TIER_UPGRADE_BASE[3]=7.
    // It does NOT get decremented by beginRecruitTurn because upgradedThisTurn=true.
    const state = makeTestState({ tier: 1, upgradeCost: 5 });
    const after = upgradeTier(state, 0);
    // upgradedThisTurn is true, so beginRecruitTurn won't decrement
    const afterTurn = beginRecruitTurn(after, RNG);
    expect(afterTurn.players[0]!.upgradeCost).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Full upgrade cycle: decrement → upgrade → reset → decrement
// ---------------------------------------------------------------------------

describe("upgrade cost — full cycle", () => {
  it("decrements from base, then resets to next tier's base on upgrade", () => {
    // Start at turn 3 so baseGoldForTurn(3) = 3, giving enough gold.
    let state = makeTestState({
      tier: 1,
      upgradeCost: 5,
      upgradedThisTurn: false,
    });
    // Advance to turn 3 so gold = baseGoldForTurn(3) = 3
    state = beginRecruitTurn(state, RNG); // turn 1, gold = 1
    state = beginRecruitTurn(state, RNG); // turn 1 again, gold = 1
    // Manually set gold high enough and turn to 3
    state = {
      ...state,
      turn: 3,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, gold: 10, tier: 1, upgradeCost: 5, upgradedThisTurn: false } : p,
      ),
    };
    // Turn 3: cost 5 → 4 (decrement)
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(4);
    // Turn 4: cost 4 → 3
    state = {
      ...state,
      turn: 4,
      players: state.players.map((p, i) => (i === 0 ? { ...p, gold: 10 } : p)),
    };
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(3);
    // Upgrade: pay 3, go to tier 2, reset cost to 7 (TIER_UPGRADE_BASE[3])
    const after = upgradeTier(state, 0);
    expect(after.players[0]!.tier).toBe(2);
    expect(after.players[0]!.upgradeCost).toBe(7);
    expect(after.players[0]!.gold).toBe(9); // 10 + 2 interest - 3 upgrade cost
  });
});
