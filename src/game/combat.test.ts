import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { simulateCombat } from "./combat";
import { instantiate } from "./minions/define";
import { getMinion } from "./minions/index";
import type { MinionInstance } from "./types";

const RNG = makeRng(42);

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number): MinionInstance {
  return instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("simulateCombat — empty boards", () => {
  it("draw on empty vs empty", () => {
    const r = simulateCombat([], [], RNG);
    expect(r.winner).toBe("draw");
    expect(r.transcript).toEqual([{ kind: "End", winner: "draw" }]);
  });

  it("right wins when left is empty", () => {
    const r = simulateCombat([], [minion("murloc_tidecaller")], RNG);
    expect(r.winner).toBe("right");
    expect(r.survivorsRight).toHaveLength(1);
  });

  it("left wins when right is empty", () => {
    const r = simulateCombat([minion("wrath_weaver")], [], RNG);
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("same seed → identical transcripts", () => {
    const board = [minion("murloc_tidecaller"), minion("murloc_tidehunter")];
    const enemy = [minion("wrath_weaver")];
    const a = simulateCombat(board, enemy, makeRng(7));
    const b = simulateCombat(board, enemy, makeRng(7));
    expect(a.transcript).toEqual(b.transcript);
    expect(a.winner).toBe(b.winner);
  });

  it("different seeds can produce different target selection", () => {
    // 3 left vs 2 right → left attacks first; left[0] picks among 2 right targets
    const leftMinion = minion("murloc_tidecaller");
    const r1 = minion("alley_cat");
    const r2 = minion("alley_cat");
    const left = [leftMinion, minion("wrath_weaver"), minion("wrath_weaver")];
    const right = [r1, r2];
    const results = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const r = simulateCombat(left, right, makeRng(seed));
      const firstAttack = r.transcript.find((e) => e.kind === "Attack");
      if (firstAttack?.kind === "Attack") results.add(firstAttack.target);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Winner determination
// ---------------------------------------------------------------------------

describe("winner determination", () => {
  it("stronger minion wins 1v1", () => {
    const strong = makeMinion(5, 5);
    const weak = makeMinion(1, 1);
    const r = simulateCombat([strong], [weak], RNG);
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(4); // took 1 damage
  });

  it("both die simultaneously → draw", () => {
    const a = makeMinion(3, 2);
    const b = makeMinion(3, 2);
    const r = simulateCombat([a], [b], RNG);
    expect(r.winner).toBe("draw");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("side with more minions attacks first", () => {
    // Left has 3 minions, right has 1. Left attacks first.
    // If both 1/1, first attack kills 1 from right and one from left.
    const left = [makeMinion(1, 1), makeMinion(1, 1), makeMinion(1, 1)];
    const right = [makeMinion(1, 1)];
    const r = simulateCombat(left, right, makeRng(0));
    expect(r.winner).toBe("left");
  });
});

// ---------------------------------------------------------------------------
// Transcript structure
// ---------------------------------------------------------------------------

describe("transcript structure", () => {
  it("last event is always End", () => {
    const r = simulateCombat([minion("wrath_weaver")], [minion("murloc_tidecaller")], RNG);
    expect(r.transcript.at(-1)?.kind).toBe("End");
  });

  it("contains Attack events", () => {
    const r = simulateCombat([makeMinion(2, 5)], [makeMinion(2, 5)], RNG);
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
  });

  it("contains Damage events after each Attack", () => {
    const r = simulateCombat([makeMinion(1, 3)], [makeMinion(1, 3)], RNG);
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    const damages = r.transcript.filter((e) => e.kind === "Damage");
    // Each attack should produce at least 1 damage event
    expect(damages.length).toBeGreaterThanOrEqual(attacks.length);
  });

  it("contains Death events for killed minions", () => {
    const r = simulateCombat([makeMinion(5, 1)], [makeMinion(5, 1)], RNG);
    const deaths = r.transcript.filter((e) => e.kind === "Death");
    expect(deaths).toHaveLength(2); // both die on first exchange
  });

  it("0-attack minion deals no damage — no Damage event for it", () => {
    const attacker = makeMinion(2, 3);
    const dummy = makeMinion(0, 5);
    const r = simulateCombat([attacker], [dummy], RNG);
    const damageToAttacker = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === attacker.instanceId,
    );
    expect(damageToAttacker).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multi-minion boards
// ---------------------------------------------------------------------------

describe("multi-minion combat", () => {
  it("attack pointer advances each turn", () => {
    const [a, b, c] = [makeMinion(1, 10), makeMinion(1, 10), makeMinion(1, 10)];
    const enemy = [makeMinion(1, 1)];
    const r = simulateCombat([a!, b!, c!], enemy, makeRng(0));
    // Enemy is 1/1. Left side has 3 minions and attacks first.
    // The first attacker kills the 1/1. Left wins.
    expect(r.winner).toBe("left");
    // First Attack event attacker should be a! (leftPtr starts at 0)
    const firstAttack = r.transcript.find((e) => e.kind === "Attack");
    expect(firstAttack?.kind === "Attack" && firstAttack.attacker).toBe(a!.instanceId);
  });

  it("survivors have correct remaining HP", () => {
    const tanky = makeMinion(1, 5);
    const weak = makeMinion(2, 1);
    const r = simulateCombat([tanky], [weak], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft[0]!.hp).toBe(3); // took 2 damage from the 2/1
  });
});

// ---------------------------------------------------------------------------
// Taunt keyword
// ---------------------------------------------------------------------------

describe("taunt keyword", () => {
  it("should target taunt minions first", () => {
    const tauntMinion = makeMinion(1, 1);
    tauntMinion.keywords.add("taunt");

    const normalMinion = makeMinion(1, 1);

    const r = simulateCombat([normalMinion], [tauntMinion], makeRng(0));

    // Check that the attack was directed towards the taunt minion
    const firstAttack = r.transcript.find((e) => e.kind === "Attack");
    expect(firstAttack).toBeDefined();
    expect(firstAttack?.target).toBe(tauntMinion.instanceId);
  });
});

// These tests validate that existing features (already implemented) are working
describe("feature validation", () => {
  it("divine shield keyword is properly handled", () => {
    // Just a smoke test - the keyword must be compatible with existing combat
    const minion = makeMinion(1, 1);
    minion.keywords.add("divineShield");

    // This should not crash
    const r = simulateCombat([minion], [makeMinion(5, 1)], makeRng(0));
    expect(r).toBeDefined();
  });

  it("reborn keyword is properly handled", () => {
    // Just a smoke test - the keyword must be compatible with existing combat
    const minion = makeMinion(1, 1);
    minion.keywords.add("reborn");

    // This should not crash
    const r = simulateCombat([minion], [makeMinion(5, 1)], makeRng(0));
    expect(r).toBeDefined();

    // Verify that reborn worked correctly
    // The minion should be back with 1 HP and without the reborn keyword
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(1);
    expect(r.survivorsLeft[0]!.keywords.has("reborn")).toBe(false);
  });
});
