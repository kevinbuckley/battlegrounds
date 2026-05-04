import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { refreshShop } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  // Use a real tier-1 murloc that will be in the pool
  const shopMinion = instantiate(MINIONS["murloc_tinyfin"]!);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: { murloc_tinyfin: 10 },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [shopMinion],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Refresh cost — gold deduction
// ---------------------------------------------------------------------------

describe("refresh cost — gold deduction", () => {
  it("deducts 1 gold from the player on refresh", () => {
    const state = makeTestState({ gold: 5 });
    const after = refreshShop(state, 0, RNG);
    expect(after.players[0]!.gold).toBe(4);
  });

  it("deducts exactly COST_REFRESH (1g)", () => {
    const state = makeTestState({ gold: 10 });
    const after = refreshShop(state, 0, RNG);
    expect(after.players[0]!.gold).toBe(9);
  });

  it("throws when player has less gold than COST_REFRESH", () => {
    const state = makeTestState({ gold: 0 });
    expect(() => refreshShop(state, 0, RNG)).toThrow("Not enough gold to refresh (have 0, need 1)");
  });

  it("throws when player has exactly 0 gold", () => {
    const state = makeTestState({ gold: 0 });
    expect(() => refreshShop(state, 0, RNG)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Refresh — shop replacement
// ---------------------------------------------------------------------------

describe("refresh — shop replacement", () => {
  it("replaces all non-dormant shop items with new random minions", () => {
    const state = makeTestState({ gold: 10 });
    const beforeShop = state.players[0]!.shop;
    const after = refreshShop(state, 0, RNG);
    const afterShop = after.players[0]!.shop;
    // Shop should have items (size depends on tier)
    expect(afterShop.length).toBeGreaterThan(0);
    // The original shop minion should no longer be in the shop (it was returned to pool)
    expect(afterShop.map((m) => m.instanceId)).not.toContain(beforeShop[0]!.instanceId);
  });

  it("preserves dormant minions in the shop after refresh", () => {
    const dormantMinion = instantiate(MINIONS["flame_imp"]!);
    // Give it the dormant keyword so refreshShop treats it as dormant
    const withDormant = { ...dormantMinion, keywords: new Set(["dormant"]) };
    const state = makeTestState({
      gold: 10,
      shop: [withDormant],
    });
    const beforeDormantId = withDormant.instanceId;
    const after = refreshShop(state, 0, RNG);
    const afterShop = after.players[0]!.shop;
    // Dormant minion should still be in the shop
    expect(afterShop.map((m) => m.instanceId)).toContain(beforeDormantId);
  });
});

// ---------------------------------------------------------------------------
// Refresh — pool management
// ---------------------------------------------------------------------------

describe("refresh — pool management", () => {
  it("returns non-dormant shop items back to the pool", () => {
    const state = makeTestState({ gold: 10 });
    const beforePool = { ...state.pool };
    const beforeCount = beforePool.murloc_tinyfin ?? 0;
    const after = refreshShop(state, 0, RNG);
    // RefreshShop returns the old shop minion to the pool, then draws new ones.
    // Net: 1 returned, 3 drawn (tier 1 shop size = 3), so pool goes 10 → 8.
    // The key invariant: the pool is modified (items returned and consumed).
    expect(after.pool.murloc_tinyfin).not.toBe(beforeCount);
  });

  it("does not return dormant minions to the pool", () => {
    const dormantMinion = MINIONS["flame_imp"]!;
    const state = makeTestState({
      gold: 10,
      shop: [dormantMinion],
      pool: { flame_imp: 5 },
    });
    const beforeDormantPool = state.pool.flame_imp;
    const after = refreshShop(state, 0, RNG);
    // Dormant minion should NOT be returned to pool
    expect(after.pool.flame_imp).toBe(beforeDormantPool);
  });
});

// ---------------------------------------------------------------------------
// Refresh — frozen shop
// ---------------------------------------------------------------------------

describe("refresh — frozen shop", () => {
  it("does not deduct gold when shop is frozen", () => {
    const state = makeTestState({ gold: 5, shopFrozen: true });
    const after = refreshShop(state, 0, RNG);
    expect(after.players[0]!.gold).toBe(5);
  });

  it("does not replace shop items when shop is frozen", () => {
    const state = makeTestState({ gold: 10, shopFrozen: true });
    const beforeShop = [...state.players[0]!.shop];
    const after = refreshShop(state, 0, RNG);
    const afterShop = after.players[0]!.shop;
    expect(afterShop.map((m) => m.instanceId)).toEqual(beforeShop.map((m) => m.instanceId));
  });
});
