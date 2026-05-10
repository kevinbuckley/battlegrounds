import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Collateral Damage — wired in combat.ts: after the main attack resolves,
// deal N damage to every OTHER enemy (not the main defender).
// ---------------------------------------------------------------------------

describe("collateral damage — combat", () => {
  it("deals collateral damage to all other enemies when attacking", () => {
    const pirate = instantiate(MINIONS["bloodsail_pirate"]!); // 1/2, collateralDamage1
    const e1 = instantiate(MINIONS["murloc_scout"]!); // 1/1
    const e2 = instantiate(MINIONS["flame_imp"]!); // 1/1

    const result = simulateCombat([pirate], [e1, e2], RNG);

    // Pirate attacks e1 (1 dmg), then collateral deals 1 to e2
    // e1 counterattacks (2 dmg to pirate → pirate dies)
    // e2 counterattacks (2 dmg to pirate — already dead, no effect)
    // e1 survives at 1/0 → dead, e2 survives at 1/0 → dead
    // Actually: pirate 1/2 attacks e1 1/1 → e1 takes 1 → dead (0 hp),
    //   collateral: e2 takes 1 → dead (0 hp),
    //   e1 counterattacks: pirate takes 2 → dead,
    //   e2 counterattacks: pirate takes 2 → already dead
    // Result: draw (both boards empty)
    expect(result.winner).toBe("draw");
    expect(result.survivorsLeft).toHaveLength(0);
    expect(result.survivorsRight).toHaveLength(0);
  });

  it("deals higher collateral from deathwing raze-to-bone", () => {
    const deathwing = instantiate(MINIONS["deathwing-raze-to-bone"]!); // 8/8, collateralDamage3
    const e1 = instantiate(MINIONS["murloc_knight"]!); // 3/3
    const e2 = instantiate(MINIONS["coldlight_seer"]!); // 3/3

    const result = simulateCombat([deathwing], [e1, e2], RNG);

    // Deathwing attacks e1 (8 dmg → dead), collateral 3 to e2 (3 dmg → dead)
    // e1 counterattacks: deathwing takes 3 → 8/5
    // e2 counterattacks: deathwing takes 3 → 8/2
    // Deathwing survives
    expect(result.winner).toBe("left");
  });

  it("no collateral when attacking solo target", () => {
    const pirate = instantiate(MINIONS["bloodsail_pirate"]!); // 1/2, collateralDamage1
    const e1 = instantiate(MINIONS["murloc_scout"]!); // 1/1

    const result = simulateCombat([pirate], [e1], RNG);

    // Only one enemy, no other enemies to deal collateral to
    // Pirate 1/2 attacks e1 1/1 → e1 takes 1 → dead
    // e1 counterattacks: pirate takes 1 → 1/1
    // Pirate survives
    expect(result.winner).toBe("left");
    expect(result.survivorsLeft).toHaveLength(1);
  });
});
