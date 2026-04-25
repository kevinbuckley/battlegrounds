import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { MINIONS } from "./minions/index";
import { buildPool, drawFromPool, returnToPool } from "./shop";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Tier-weighted odds
// ---------------------------------------------------------------------------

describe("tier-weighted draw", () => {
  it("at tier 1, only tier-1 cards appear", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    const { instances } = drawFromPool(pool, 1, 50, makeRng(0));
    expect(instances.every((m) => MINIONS[m.cardId]?.tier === 1)).toBe(true);
  });

  it("at tier 2, cards from tier 1 and tier 2 both appear over many draws", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    const { instances } = drawFromPool(pool, 2, 100, makeRng(1));
    const tiers = new Set(instances.map((m) => MINIONS[m.cardId]?.tier));
    expect(tiers).toContain(1);
    expect(tiers).toContain(2);
  });

  it("at max tier, all tiers can appear", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    // Pool only has tier 1-2 minions right now; this just verifies no crash
    const { instances } = drawFromPool(pool, 6, 20, makeRng(9));
    expect(instances.length).toBeGreaterThan(0);
  });

  it("results are deterministic for same seed", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    const a = drawFromPool({ ...pool }, 2, 20, makeRng(77));
    const b = drawFromPool({ ...pool }, 2, 20, makeRng(77));
    expect(a.instances.map((m) => m.cardId)).toEqual(b.instances.map((m) => m.cardId));
  });
});

// ---------------------------------------------------------------------------
// Tribe filtering
// ---------------------------------------------------------------------------

describe("tribe filtering", () => {
  it("buildPool excludes tribal minions whose tribe is not active", () => {
    const pool = buildPool(["Murloc"]);
    const cardIds = Object.keys(pool);
    const hasDragon = cardIds.some((id) => MINIONS[id]?.tribes.includes("Dragon"));
    const hasMurloc = cardIds.some((id) => MINIONS[id]?.tribes.includes("Murloc"));
    expect(hasDragon).toBe(false);
    expect(hasMurloc).toBe(true);
  });

  it("tribeless minions always appear regardless of active tribes", () => {
    const pool = buildPool(["Murloc"]);
    const cardIds = Object.keys(pool);
    const hasWrathWeaver = cardIds.includes("wrath_weaver");
    expect(hasWrathWeaver).toBe(true);
  });

  it("only tribal cards of active tribes appear in draws", () => {
    const pool = buildPool(["Dragon"]);
    const { instances } = drawFromPool(pool, 1, 30, makeRng(0));
    for (const m of instances) {
      const card = MINIONS[m.cardId]!;
      const isNeutral = card.tribes.length === 0;
      const isDragon = card.tribes.includes("Dragon");
      expect(isNeutral || isDragon).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Pool depletion
// ---------------------------------------------------------------------------

describe("pool depletion", () => {
  it("cannot draw more copies than pool contains", () => {
    const pool = { wrath_weaver: 2 };
    const { instances, pool: after } = drawFromPool(pool, 1, 10, RNG);
    expect(instances).toHaveLength(2);
    expect(after.wrath_weaver).toBe(0);
  });

  it("pool count decrements correctly per draw", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    const before = { ...pool };
    const { pool: after } = drawFromPool(pool, 1, 3, RNG);
    const drawn = Object.keys(before).reduce((sum, id) => {
      return sum + (before[id]! - (after[id] ?? 0));
    }, 0);
    expect(drawn).toBe(3);
  });

  it("returns empty when pool is fully exhausted", () => {
    const { instances } = drawFromPool({}, 1, 5, RNG);
    expect(instances).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Return-on-sell
// ---------------------------------------------------------------------------

describe("returnToPool", () => {
  it("restores pool counts for returned instances", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    const { instances, pool: after } = drawFromPool(pool, 1, 3, RNG);
    const restored = returnToPool(after, instances);
    // Group by cardId — the same card may have been drawn multiple times
    const countPerCard: Record<string, number> = {};
    for (const m of instances) countPerCard[m.cardId] = (countPerCard[m.cardId] ?? 0) + 1;
    for (const [id, n] of Object.entries(countPerCard)) {
      expect(restored[id]).toBe((after[id] ?? 0) + n);
    }
  });
});

// ---------------------------------------------------------------------------
// Shared pool across players
// ---------------------------------------------------------------------------

describe("shared pool", () => {
  it("two draws from the same pool reduce total availability", () => {
    const pool = buildPool(["Murloc", "Beast", "Dragon", "Mech", "Undead"]);
    const total1 = Object.values(pool).reduce((s, n) => s + n, 0);

    const { pool: after1 } = drawFromPool(pool, 1, 3, makeRng(1));
    const { pool: after2 } = drawFromPool(after1, 1, 3, makeRng(2));

    const total2 = Object.values(after2).reduce((s, n) => s + n, 0);
    expect(total2).toBe(total1 - 6);
  });
});
