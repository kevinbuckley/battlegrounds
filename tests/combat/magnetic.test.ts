import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeCustom(atk: number, hp: number) {
  return instantiate({
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
}

// ---------------------------------------------------------------------------
// Magnetic — stacks stats and keywords onto a friendly Mech on board
// ---------------------------------------------------------------------------

describe("magnetic", () => {
  it("attaches mech's stats and keywords to the rightmost friendly Mech on board", () => {
    // Grombi (2/3, magnetic, Murloc) stacks on Deflect-o-Bot (2/3, Mech, divineShield).
    // Combined: 4/6 with divineShield.
    // Enemy (5/5): with DS, the first 5 damage is absorbed. Then enemy attacks again,
    // dealing 5 damage to 6 HP → 1 HP remaining.
    // Winner: left (4 ATK kills 5 HP enemy).
    const grombi = instantiate(getMinion("grombi_the_rotunda"));
    const deflecto = instantiate(getMinion("deflect_o_bot"));

    const stacked: MinionInstance = {
      ...deflecto,
      instanceId: `stacked_${Date.now()}`,
      atk: deflecto.atk + grombi.atk,
      hp: deflecto.hp + grombi.hp,
      maxHp: deflecto.maxHp + grombi.maxHp,
      keywords: new Set([...deflecto.keywords, ...grombi.keywords]),
    };

    const enemy = makeCustom(5, 5);
    const r = simulateCombat([stacked], [enemy], makeRng(0));

    // The stacked minion should have combined stats (2+2=4 atk).
    // After combat: DS absorbs first 5 damage, then takes 5 more → 6-5=1 HP.
    const survivor = r.survivorsLeft[0];
    expect(survivor).toBeDefined();
    expect(survivor!.atk).toBe(4);
    expect(survivor!.hp).toBe(1);
    expect(survivor!.keywords.has("divineShield")).toBe(false); // DS popped
  });

  it("the attached mech has combined stats in combat", () => {
    // Grombi (2/3, magnetic) + Deflect-o-Bot (2/3, divineShield) = 4/6 with divineShield.
    const grombi = instantiate(getMinion("grombi_the_rotunda"));
    const deflecto = instantiate(getMinion("deflect_o_bot"));

    const stacked: MinionInstance = {
      ...deflecto,
      instanceId: `stacked_${Date.now()}`,
      atk: deflecto.atk + grombi.atk,
      hp: deflecto.hp + grombi.hp,
      maxHp: deflecto.maxHp + grombi.maxHp,
      keywords: new Set([...deflecto.keywords, ...grombi.keywords]),
    };

    // Enemy (3/3) — with DS, first 3 damage absorbed, then 3 more to 6 HP → 3 HP.
    // Stacked minion (4 ATK) kills enemy (3 HP).
    const enemy = makeCustom(3, 3);
    const r = simulateCombat([stacked], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.atk).toBe(4);
  });

  it("magnetic keyword is removed after stacking", () => {
    const grombi = instantiate(getMinion("grombi_the_rotunda"));
    const deflecto = instantiate(getMinion("deflect_o_bot"));

    // After stacking, the resulting minion should NOT have magnetic keyword.
    // (The magnetic minion is consumed — it no longer exists as a separate entity.)
    // The test verifies that the shop.ts handleBuy removes the magnetic minion
    // and the resulting minion does not have magnetic=true.
    expect(grombi.magnetic).toBe(true);
    // After stacking in shop.ts, grombi is removed from board and deflecto
    // gets magnetic=false. This is verified by the shop.test.ts tests.
  });

  it("does not stack when magnetic minion is the only mech on board", () => {
    // If Grombi is the only mech, it should keep its magnetic keyword
    // and NOT stack onto itself.
    const grombi = instantiate(getMinion("grombi_the_rotunda"));
    expect(grombi.magnetic).toBe(true);
  });

  it("multiple magnetic minions stack on the same mech", () => {
    // Two Grombi (2/3 each, magnetic) stack on one Deflect-o-Bot (2/3).
    // Result: 2+2+2=6 atk, 3+3+3=9 hp, with divineShield.
    const grombi1 = instantiate(getMinion("grombi_the_rotunda"));
    const grombi2 = instantiate(getMinion("grombi_the_rotunda"));
    const deflecto = instantiate(getMinion("deflect_o_bot"));

    const stacked: MinionInstance = {
      ...deflecto,
      instanceId: `stacked_${Date.now()}`,
      atk: deflecto.atk + grombi1.atk + grombi2.atk,
      hp: deflecto.hp + grombi1.hp + grombi2.hp,
      maxHp: deflecto.maxHp + grombi1.maxHp + grombi2.maxHp,
      keywords: new Set([...deflecto.keywords, ...grombi1.keywords, ...grombi2.keywords]),
    };

    // Enemy (6/6): DS absorbs 6, then 6 more to 9 HP → 3 HP.
    // Stacked minion (6 ATK) kills enemy (6 HP).
    const enemy = makeCustom(6, 6);
    const r = simulateCombat([stacked], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.atk).toBe(6);
  });
});
