import { describe, expect, it } from "vitest";
import { calcDamage } from "@/game/damage";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";

// ---------------------------------------------------------------------------
// calcDamage with registry minions — verifies the formula uses the minion's
// actual tier from the registry, not the default tier 1.
// ---------------------------------------------------------------------------

describe("calcDamage with registry minions", () => {
  it("uses actual tier from registry, not default tier 1", () => {
    // flame_imp is tier 1, murloc_tidecaller is tier 1,
    // murloc_warleader is tier 2, cave_hydra is tier 4
    const flameImp = instantiate(getMinion("flame_imp")); // tier 1
    const murlocTidecaller = instantiate(getMinion("murloc_tidecaller")); // tier 1
    const murlocWarleader = instantiate(getMinion("murloc_warleader")); // tier 2
    const caveHydra = instantiate(getMinion("cave_hydra")); // tier 4

    // tier 6 loser, survivors: tier1 + tier1 + tier2 + tier4 = 8
    // damage = 6 + 1 + 1 + 2 + 4 = 14
    expect(calcDamage(6, [flameImp, murlocTidecaller, murlocWarleader, caveHydra])).toBe(14);
  });

  it("single tier 6 survivor against tier 1 loser", () => {
    const caveHydra = instantiate(getMinion("cave_hydra")); // tier 4
    // damage = 1 + 4 = 5
    expect(calcDamage(1, [caveHydra])).toBe(5);
  });

  it("tier 6 survivor against tier 6 loser", () => {
    const foeReaper = instantiate(getMinion("foe_reaper_4000")); // tier 6
    // damage = 6 + 6 = 12
    expect(calcDamage(6, [foeReaper])).toBe(12);
  });

  it("multiple tier 6 survivors — uncapped damage", () => {
    const foeReaper = instantiate(getMinion("foe_reaper_4000")); // tier 6
    const ysera = instantiate(getMinion("ysera_the_dreamer")); // tier 6
    // damage = 6 + 6 + 6 = 18
    expect(calcDamage(6, [foeReaper, ysera])).toBe(18);
  });

  it("mixed tiers: tier 3 + tier 5 against tier 4 loser", () => {
    const coldlightSeer = instantiate(getMinion("coldlight_seer")); // tier 3
    const murozond = instantiate(getMinion("murozond")); // tier 5
    // damage = 4 + 3 + 5 = 12
    expect(calcDamage(4, [coldlightSeer, murozond])).toBe(12);
  });
});
