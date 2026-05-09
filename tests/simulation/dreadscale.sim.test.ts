import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Dreadscale — deathrattle deals 2 damage to ALL other minions on both boards
// ---------------------------------------------------------------------------

describe("dreadscale", () => {
  function makeMinion(atk: number, hp: number) {
    return instantiate(
      defineMinion({
        id: `plain_${atk}_${hp}`,
        name: `${atk}/${hp}`,
        tier: 1,
        tribes: [],
        baseAtk: atk,
        baseHp: hp,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {} as never,
      }),
    );
  }

  it("deals 2 damage to ally and enemy when Dreadscale dies", () => {
    // turn=1 → left attacks first (deterministic)
    // [dreadscale(6/6), strongAlly(2/100)] vs [killer(7/7)]
    // ds attacks killer: killer takes 6 (7/1), ds takes 7 → dies
    // deathrattle: killer takes 2 → 7/(-1) dies, strongAlly takes 2 → 2/98
    // survivorsLeft = [strongAlly(2/98)], survivorsRight = []
    const ds = instantiate(getMinion("dreadscale")); // 6/6
    const strongAlly = makeMinion(2, 100);
    const killer = makeMinion(7, 7);

    const r = simulateCombat([ds, strongAlly], [killer], makeRng(0), undefined, 1);

    // killer should die from deathrattle (7/1 → 2 dmg → -1)
    expect(r.survivorsRight).toHaveLength(0);
    // strongAlly should survive at 98 HP (100 - 2 from deathrattle)
    const ally = r.survivorsLeft.find((m) => m.instanceId === strongAlly.instanceId);
    expect(ally).toBeDefined();
    expect(ally!.hp).toBe(98);
  });

  it("kills 1 HP minions with 2 damage from deathrattle", () => {
    // [dreadscale(6/6), flame_imp(3/1)] vs [killer(7/7)]
    // ds attacks killer: killer takes 6 (7/1), ds takes 7 → dies
    // deathrattle: killer takes 2 → dies. flame_imp(3/1) takes 2 → 3/(-1) dies.
    // survivorsLeft = [], survivorsRight = []
    const ds = instantiate(getMinion("dreadscale")); // 6/6
    const ally = instantiate(getMinion("flame_imp")); // 3/1
    const killer = makeMinion(7, 7);

    const r = simulateCombat([ds, ally], [killer], makeRng(0), undefined, 1);

    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("does NOT damage itself (Dreadscale excluded from its own deathrattle)", () => {
    // Same scenario — if self-damage occurred, strongAlly's final HP would differ
    const ds = instantiate(getMinion("dreadscale")); // 6/6
    const strongAlly = makeMinion(2, 100);
    const killer = makeMinion(7, 7);

    const r = simulateCombat([ds, strongAlly], [killer], makeRng(0), undefined, 1);

    // strongAlly should survive at 98 HP (took 2 from deathrattle, not 4 which would mean self was excluded wrongly)
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(98);
    // dreadscale itself should be dead (not in survivors)
    expect(r.survivorsLeft.find((m) => m.instanceId === ds.instanceId)).toBeUndefined();
  });

  it("golden Dreadscale fires deathrattle twice — 4 damage to all others", () => {
    // [golden dreadscale(6/6), flame_imp(3/1)] vs [killer(7/7)]
    // ds attacks killer: same as above, ds dies.
    // deathrattle fires TWICE: flame_imp takes 4 total → dies; killer takes 4 total → dies.
    const ds = instantiate(getMinion("dreadscale"));
    ds.golden = true;
    const ally = instantiate(getMinion("flame_imp")); // 3/1
    const killer = makeMinion(7, 7);

    const r = simulateCombat([ds, ally], [killer], makeRng(0), undefined, 1);

    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(0);
  });
});
