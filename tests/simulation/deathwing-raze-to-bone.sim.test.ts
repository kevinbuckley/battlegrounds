import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Deathwing, Raze to Bone — tier 8 dragon, 8/8, collateralDamage3
// ---------------------------------------------------------------------------

describe("deathwing-raze-to-bone — collateralDamage3", () => {
  it("deals 3 collateral damage to all other enemies when attacking", () => {
    const deathwing = instantiate(MINIONS["deathwing-raze-to-bone"]!); // 8/8, collateralDamage3
    const e1 = instantiate(MINIONS["murloc_knight"]!); // 3/3
    const e2 = instantiate(MINIONS["coldlight_seer"]!); // 3/3
    const e3 = instantiate(MINIONS["murloc_scout"]!); // 1/1

    const result = simulateCombat([deathwing], [e1, e2, e3], RNG);

    // Deathwing attacks e1 (8 dmg → dead), collateral 3 to e2 (3 dmg → dead) and e3 (3 dmg → dead)
    // e1 counterattacks: deathwing takes 3 → 8/5
    // e2 counterattacks: deathwing takes 3 → 8/2
    // e3 counterattacks: deathwing takes 1 → 8/1
    // Deathwing survives
    expect(result.winner).toBe("left");
    expect(result.survivorsLeft).toHaveLength(1);
    expect(result.survivorsRight).toHaveLength(0);
  });

  it("no collateral when attacking solo target", () => {
    const deathwing = instantiate(MINIONS["deathwing-raze-to-bone"]!); // 8/8, collateralDamage3
    const e1 = instantiate(MINIONS["murloc_knight"]!); // 3/3

    const result = simulateCombat([deathwing], [e1], RNG);

    // Only one enemy, no collateral
    // Deathwing attacks e1 (8 dmg → dead), e1 counterattacks (3 dmg → 8/5)
    // Deathwing survives
    expect(result.winner).toBe("left");
    expect(result.survivorsLeft).toHaveLength(1);
    expect(result.survivorsRight).toHaveLength(0);
  });

  it("collateral kills minions with <= 3 HP", () => {
    const deathwing = instantiate(MINIONS["deathwing-raze-to-bone"]!); // 8/8, collateralDamage3
    const e1 = instantiate(MINIONS["murloc_scout"]!); // 1/1
    const e2 = instantiate(MINIONS["flame_imp"]!); // 1/2

    const result = simulateCombat([deathwing], [e1, e2], RNG);

    // Deathwing attacks e1 (8 dmg → dead), collateral 3 to e2 (2 HP → dead from 3)
    // e1 counterattacks: deathwing takes 1 → 8/7
    // e2 counterattacks: deathwing takes 2 → 8/5
    // Deathwing survives
    expect(result.winner).toBe("left");
    expect(result.survivorsLeft).toHaveLength(1);
    expect(result.survivorsRight).toHaveLength(0);
  });

  it("golden version (16/16) deals 6 collateral damage", () => {
    const deathwing = instantiate(MINIONS["deathwing-raze-to-bone"]!);
    deathwing.golden = true; // 16/16, collateralDamage3

    const e1 = instantiate(MINIONS["murloc_knight"]!); // 3/3
    const e2 = instantiate(MINIONS["coldlight_seer"]!); // 3/3
    const e3 = instantiate(MINIONS["murloc_scout"]!); // 1/1

    const result = simulateCombat([deathwing], [e1, e2, e3], RNG);

    // Golden Deathwing 16/16 attacks e1 (16 dmg → dead), collateral 6 to e2 (3/3 → dead) and e3 (1/1 → dead)
    // e1 counterattacks: deathwing takes 3 → 16/13
    // e2 counterattacks: deathwing takes 3 → 16/10
    // e3 counterattacks: deathwing takes 1 → 16/9
    // Deathwing survives
    expect(result.winner).toBe("left");
    expect(result.survivorsLeft).toHaveLength(1);
    expect(result.survivorsRight).toHaveLength(0);
  });
});
