import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { simulateCombat } from "./combat";
import { instantiate } from "./minions/define";
import { getMinion } from "./minions/index";
import type { Keyword, MinionInstance } from "./types";

const RNG = makeRng(42);

function makeMinion(atk: number, hp: number, keywords: Keyword[] = []): MinionInstance {
  const minion = instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: keywords,
    spellDamage: 0,
    hooks: {},
  });
  for (const keyword of keywords) {
    minion.keywords.add(keyword);
  }
  return minion;
}

// Test reborn functionality
describe("reborn keyword test", () => {
  it("reborn keyword is properly handled", () => {
    const minion = makeMinion(1, 1, ["reborn"]);

    const r = simulateCombat([minion], [makeMinion(5, 1)], makeRng(0));
    expect(r).toBeDefined();

    // The minion should be back with 1 HP after death
    // The reborn keyword should be removed
    expect(r.winner).toBe("left");

    // Check that we have 1 surviving minion
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(1);
    expect(r.survivorsLeft[0]!.keywords.has("reborn")).toBe(false);
  });

  it("reborn minion comes back at 1/1 regardless of previous stats", () => {
    const bigMinion = makeMinion(8, 8, ["reborn"]);
    // Two 6/6 helpers ensure left wins after the reborn 1/1 dies.
    const helper1 = makeMinion(6, 6);
    const helper2 = makeMinion(6, 6);
    // Opponent has 15 HP and 5 ATK — all three left minions kill it,
    // but the reborn 1/1 dies before finishing.
    const opponent = makeMinion(5, 15);

    const r = simulateCombat([bigMinion, helper1, helper2], [opponent], makeRng(0));
    expect(r).toBeDefined();
    expect(r.winner).toBe("left");
    // Find the reborn minion (1/1) among survivors
    const reborn = r.survivorsLeft.find((m) => m.atk === 1 && m.hp === 1);
    expect(reborn).toBeDefined();
    expect(reborn!.atk).toBe(1);
    expect(reborn!.hp).toBe(1);
    expect(reborn!.maxHp).toBe(1);
    expect(reborn!.spellDamage).toBe(0);
    expect(reborn!.keywords.has("reborn")).toBe(false);
  });
});
