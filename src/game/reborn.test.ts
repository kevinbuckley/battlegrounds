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
});
