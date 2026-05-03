import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

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
    spellDamage: 0,
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// Deathrattle summon positioning — summoned minions should appear at the
// dead minion's original board index, not appended to the end.
// ---------------------------------------------------------------------------

describe("deathrattle summon positioning", () => {
  it("summoned minions appear at the dead minion's board index, not appended", () => {
    // Board: [harvest_golem, ally1, ally2]
    // When harvest_golem (index 0) dies and summons a 2/1 mech,
    // the mech should be at index 0, not at the end (index 3).
    // Expected final board: [2/1 mech, ally1, ally2]
    //
    // Harvest golem is 2/4. Enemy is 4/4 — both die from mutual combat.
    // Allies are 5/10 — they survive and kill the enemy.
    const golem = minion("harvest_golem");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy = makeMinion(4, 4);

    const r = simulateCombat([golem, ally1, ally2], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(3);

    // The summoned minion (2/1 mech) should be at index 0 (where golem was)
    // not at index 3 (appended).
    const summoned = r.survivorsLeft.find((m) => m.atk === 2 && m.hp === 1);
    expect(summoned).toBeDefined();

    // Find the index of the summoned minion on the board
    const summonedIdx = r.survivorsLeft.indexOf(summoned!);
    expect(summonedIdx).toBe(0);

    // Verify the other two allies are at indices 1 and 2 (preserving order)
    // Use toEqual since objects are cloned in combat (different references)
    expect(r.survivorsLeft[1]!.atk).toBe(5);
    expect(r.survivorsLeft[1]!.hp).toBeGreaterThan(0);
    expect(r.survivorsLeft[2]!.atk).toBe(5);
    expect(r.survivorsLeft[2]!.hp).toBeGreaterThan(0);
  });

  it("summoned minions appear at the correct middle index when dead minion is not at index 0", () => {
    // Board: [ally1, harvest_golem, ally2]
    // When harvest_golem (index 1) dies and summons a 2/1 mech,
    // the mech should be at index 1 (where golem was).
    // Expected final board: [ally1, 2/1 mech, ally2]
    const golem = minion("harvest_golem");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy = makeMinion(4, 4);

    const r = simulateCombat([ally1, golem, ally2], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(3);

    const summoned = r.survivorsLeft.find((m) => m.atk === 2 && m.hp === 1);
    expect(summoned).toBeDefined();

    const summonedIdx = r.survivorsLeft.indexOf(summoned!);
    expect(summonedIdx).toBe(1);

    // ally1 should still be at index 0, ally2 at index 2
    expect(r.survivorsLeft[0]!.atk).toBe(5);
    expect(r.survivorsLeft[0]!.hp).toBeGreaterThan(0);
    expect(r.survivorsLeft[2]!.atk).toBe(5);
    expect(r.survivorsLeft[2]!.hp).toBeGreaterThan(0);
  });

  it("summoned minions appear at the end index when dead minion was last on board", () => {
    // Board: [ally1, ally2, harvest_golem]
    // When harvest_golem (index 2) dies and summons a 2/1 mech,
    // the mech should be at index 2 (where golem was, which is the end).
    // Expected final board: [ally1, ally2, 2/1 mech]
    const golem = minion("harvest_golem");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy = makeMinion(4, 4);

    const r = simulateCombat([ally1, ally2, golem], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(3);

    const summoned = r.survivorsLeft.find((m) => m.atk === 2 && m.hp === 1);
    expect(summoned).toBeDefined();

    const summonedIdx = r.survivorsLeft.indexOf(summoned!);
    expect(summonedIdx).toBe(2);

    // ally1 at 0, ally2 at 1
    expect(r.survivorsLeft[0]!.atk).toBe(5);
    expect(r.survivorsLeft[0]!.hp).toBeGreaterThan(0);
    expect(r.survivorsLeft[1]!.atk).toBe(5);
    expect(r.survivorsLeft[1]!.hp).toBeGreaterThan(0);
  });
});
