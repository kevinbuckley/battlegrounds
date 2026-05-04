import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { Keyword, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeMinion(atk: number, hp: number, keywords: Keyword[] = []): MinionInstance {
  const m = instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
  for (const kw of keywords) m.keywords.add(kw);
  return m;
}

// ---------------------------------------------------------------------------
// Lifesteal — basic healing
// ---------------------------------------------------------------------------

describe("lifesteal — basic healing", () => {
  it("heals the winning hero by the total lifesteal amount", () => {
    const ls = makeMinion(4, 4, ["lifesteal"]);
    const enemy = makeMinion(1, 1);
    const r = simulateCombat([ls], [enemy], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.lifestealHealing).toBe(4);
  });

  it("lifesteal heals through lethal damage — hero survives", () => {
    const ls = makeMinion(10, 10, ["lifesteal"]);
    const enemy = makeMinion(3, 3);
    const r = simulateCombat([ls], [enemy], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.lifestealHealing).toBe(10);
  });

  it("lifesteal healing is applied to the winner's hero, not the minion's HP", () => {
    const ls = makeMinion(2, 2, ["lifesteal"]);
    const enemy = makeMinion(3, 3);
    const r = simulateCombat([ls], [enemy], makeRng(0));
    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.lifestealHealing).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Lifesteal — divine shield interaction
// ---------------------------------------------------------------------------

describe("lifesteal — divine shield interaction", () => {
  it("lifesteal does NOT trigger when damage is absorbed by divine shield", () => {
    const ls = makeMinion(1, 1, ["lifesteal"]);
    const shielded = makeMinion(1, 1, ["divineShield"]);
    const r = simulateCombat([ls], [shielded], makeRng(0));
    expect(r.lifestealHealing).toBe(0);
  });

  it("lifesteal does NOT trigger when the shielded minion counterattacks", () => {
    // Lifesteal minion (3/3) vs shielded minion (3/3).
    // Left attacks first: shield absorbs (no lifesteal).
    // Shielded minion counterattacks: lifesteal minion takes 3 damage, dies.
    // Lifesteal only heals when YOU deal damage, not when you take it.
    const ls = makeMinion(3, 3, ["lifesteal"]);
    const shielded = makeMinion(3, 3, ["divineShield"]);
    const r = simulateCombat([ls], [shielded], makeRng(0));
    expect(r.lifestealHealing).toBe(0);
  });

  it("lifesteal triggers after shield pops from multiple hits", () => {
    // Lifesteal minion (5/5) vs shielded minion (3/3).
    // Left attacks first: shield absorbs 1 hit (no lifesteal).
    // Next hit deals 5 damage, kills the 3 HP minion. Lifesteal = 5.
    const ls = makeMinion(5, 5, ["lifesteal"]);
    const shielded = makeMinion(3, 3, ["divineShield"]);
    const r = simulateCombat([ls], [shielded], makeRng(0));
    expect(r.lifestealHealing).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Lifesteal — multiple lifesteal minions
// ---------------------------------------------------------------------------

describe("lifesteal — multiple lifesteal minions", () => {
  it("multiple lifesteal minions stack healing", () => {
    const ls1 = makeMinion(3, 3, ["lifesteal"]);
    const ls2 = makeMinion(3, 3, ["lifesteal"]);
    const enemy = makeMinion(3, 3);
    const r = simulateCombat([ls1, ls2], [enemy], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.lifestealHealing).toBe(3);
    expect(r.survivorsLeft).toHaveLength(1);
  });

  it("lifesteal from multiple sources sums healing", () => {
    // Lifesteal minions (2/2 and 3/3) vs enemy (1/1).
    // 2/2 lifesteal attacks first (seed 0): deals 2 damage, kills 1/1 enemy. Lifesteal = 2.
    // 3/3 lifesteal attacks: no enemy alive, 0 damage. Lifesteal = 0.
    // Total lifesteal = 2 (only the first minion gets to attack).
    const ls1 = makeMinion(2, 2, ["lifesteal"]);
    const ls2 = makeMinion(3, 3, ["lifesteal"]);
    const enemy = makeMinion(1, 1);
    const r = simulateCombat([ls1, ls2], [enemy], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.lifestealHealing).toBe(2);
    expect(r.survivorsLeft).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Lifesteal — real minion: Queen of Pain
// ---------------------------------------------------------------------------

describe("lifesteal — Queen of Pain", () => {
  it("Queen of Pain (tier 3 demon, 4/4, lifesteal) heals hero", () => {
    const qop = getMinion("queen-of-pain");
    const enemy = makeMinion(1, 1);
    const r = simulateCombat([instantiate(qop)], [enemy], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.lifestealHealing).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Lifesteal — transcript events
// ---------------------------------------------------------------------------

describe("lifesteal — transcript events", () => {
  it("lifesteal emits Lifesteal events in transcript", () => {
    const ls = makeMinion(3, 3, ["lifesteal"]);
    const enemy = makeMinion(1, 1);
    const r = simulateCombat([ls], [enemy], makeRng(0));
    const lifestealEvents = r.transcript.filter((e) => e.kind === "Lifesteal");
    expect(lifestealEvents).toHaveLength(1);
    expect(lifestealEvents[0]!.amount).toBe(3);
  });

  it("lifesteal does not emit events when dealing 0 damage (divine shield blocks)", () => {
    const ls = makeMinion(1, 1, ["lifesteal"]);
    const shielded = makeMinion(1, 1, ["divineShield"]);
    const r = simulateCombat([ls], [shielded], makeRng(0));
    const lifestealEvents = r.transcript.filter((e) => e.kind === "Lifesteal");
    expect(lifestealEvents).toHaveLength(0);
  });
});
