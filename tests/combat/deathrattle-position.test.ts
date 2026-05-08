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
//
// Setup rationale: allies have 0 ATK so they cannot kill the enemy. The
// enemy (10/2) has enough ATK to one-shot the golem (2/2) and low enough
// HP that the golem kills it too (mutual death). This guarantees the golem
// dies at its original index regardless of RNG attack ordering.
// ---------------------------------------------------------------------------

describe("deathrattle summon positioning", () => {
  it("summoned minions appear at the dead minion's board index, not appended", () => {
    // Board: [harvest_golem, 0-atk ally, 0-atk ally]
    // golem is at index 0 and attacks first — both golem and enemy die simultaneously.
    const golem = minion("harvest_golem");
    const ally1 = makeMinion(0, 1000);
    const ally2 = makeMinion(0, 1000);
    const enemy = makeMinion(10, 2); // 10 ATK one-shots golem; 2 HP golem kills it

    const r = simulateCombat([golem, ally1, ally2], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(3);

    // The summoned 2/1 mech should be at index 0 (where golem was)
    const summoned = r.survivorsLeft.find((m) => m.atk === 2 && m.hp === 1);
    expect(summoned).toBeDefined();

    const summonedIdx = r.survivorsLeft.indexOf(summoned!);
    expect(summonedIdx).toBe(0);

    expect(r.survivorsLeft[1]!.atk).toBe(0);
    expect(r.survivorsLeft[1]!.hp).toBeGreaterThan(0);
    expect(r.survivorsLeft[2]!.atk).toBe(0);
    expect(r.survivorsLeft[2]!.hp).toBeGreaterThan(0);
  });

  it("summoned minions appear at the correct middle index when dead minion is not at index 0", () => {
    // Board: [0-atk ally, harvest_golem, 0-atk ally]
    // ally1 can't kill the enemy, so the golem eventually fights and both die
    // at the golem's original index 1.
    const golem = minion("harvest_golem");
    const ally1 = makeMinion(0, 1000);
    const ally2 = makeMinion(0, 1000);
    const enemy = makeMinion(10, 2);

    const r = simulateCombat([ally1, golem, ally2], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(3);

    const summoned = r.survivorsLeft.find((m) => m.atk === 2 && m.hp === 1);
    expect(summoned).toBeDefined();

    const summonedIdx = r.survivorsLeft.indexOf(summoned!);
    expect(summonedIdx).toBe(1);

    expect(r.survivorsLeft[0]!.atk).toBe(0);
    expect(r.survivorsLeft[0]!.hp).toBeGreaterThan(0);
    expect(r.survivorsLeft[2]!.atk).toBe(0);
    expect(r.survivorsLeft[2]!.hp).toBeGreaterThan(0);
  });

  it("summoned minions appear at the end index when dead minion was last on board", () => {
    // Board: [0-atk ally, 0-atk ally, harvest_golem]
    // golem is at index 2; when it and the enemy kill each other, the token
    // appears at index 2 (the end of the board).
    const golem = minion("harvest_golem");
    const ally1 = makeMinion(0, 1000);
    const ally2 = makeMinion(0, 1000);
    const enemy = makeMinion(10, 2);

    const r = simulateCombat([ally1, ally2, golem], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(3);

    const summoned = r.survivorsLeft.find((m) => m.atk === 2 && m.hp === 1);
    expect(summoned).toBeDefined();

    const summonedIdx = r.survivorsLeft.indexOf(summoned!);
    expect(summonedIdx).toBe(2);

    expect(r.survivorsLeft[0]!.atk).toBe(0);
    expect(r.survivorsLeft[0]!.hp).toBeGreaterThan(0);
    expect(r.survivorsLeft[1]!.atk).toBe(0);
    expect(r.survivorsLeft[1]!.hp).toBeGreaterThan(0);
  });
});
