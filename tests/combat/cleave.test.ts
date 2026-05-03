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
// Cleave — hits exactly the defender and the two adjacent friendlies on
// the ENEMY board, not all friendlies on either board.
// ---------------------------------------------------------------------------

describe("cleave hits exactly adjacent minions", () => {
  it("cleave hits the defender and adjacent enemies, not all friendlies", () => {
    // Board: [cleaveMinion, ally1, ally2]
    // Enemy: [enemy1, enemy2, enemy3]
    // Cleave minion attacks enemy1 (ptr 0). Cleave damages:
    //   enemy1 (defender), enemy2 (right adjacent on enemy board).
    //   enemy0 doesn't exist (enemy1 is at index 0, no left adjacent).
    // ally1 and ally2 (on attacker's board) should NOT take cleave damage.
    const cleaveMinion = minion("wrath_weaver");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);
    const enemy3 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1, ally2], [enemy1, enemy2, enemy3], makeRng(0));

    // Cleave minion (3/3) attacks enemy1 (3/3). Both deal 3 damage.
    // Cleave also damages enemy2 (adjacent on enemy board).
    // enemy1 dies (-3 HP), enemy2 dies (-3 HP), enemy3 survives (3 HP).
    // cleaveMinion dies (-3 HP), ally1 survives (10 HP), ally2 survives (10 HP).
    // enemy3 counterattacks cleaveMinion (already dead).
    // Final: [ally1 (10), ally2 (10)] vs [enemy3 (3)]
    // enemy3 attacks ally1 → ally1 at 7, enemy3 dies.
    // Winner: left
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
    expect(r.survivorsLeft[0]!.atk).toBe(5);
    expect(r.survivorsLeft[0]!.hp).toBe(7);
    expect(r.survivorsLeft[1]!.atk).toBe(5);
    expect(r.survivorsLeft[1]!.hp).toBe(10);
  });

  it("cleave at edge — only one adjacent enemy takes damage", () => {
    // Board: [cleaveMinion, ally1]
    // Enemy: [enemy1, enemy2]
    // Cleave minion attacks enemy1. Cleave damages enemy1 + enemy2 (right adjacent).
    // Both enemies die (3 damage each). Cleave minion dies (counterattack 3).
    // Final: [ally1 (10)] — no enemies left.
    const cleaveMinion = minion("cave_hydra");
    const ally1 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1], [enemy1, enemy2], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.atk).toBe(5);
    expect(r.survivorsLeft[0]!.hp).toBe(10);
  });

  it("single minion with cleave — no adjacent enemies to damage", () => {
    // Board: [cleaveMinion]
    // Enemy: [enemy]
    // Only the enemy takes damage from cleave (no adjacent enemies).
    const cleaveMinion = minion("wrath_weaver");
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion], [enemy], makeRng(0));

    // Both die (3 damage each). Draw.
    expect(r.winner).toBe("draw");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("cleave does NOT damage all enemies — only adjacent ones", () => {
    // Board: [cleaveMinion, ally1, ally2]
    // Enemy: [enemy1, enemy2, enemy3, enemy4]
    // Cleave minion attacks enemy1. Cleave damages enemy1 + enemy2 (right adjacent).
    // enemy3 and enemy4 should NOT take cleave damage.
    const cleaveMinion = minion("cave_hydra");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);
    const enemy3 = makeMinion(3, 3);
    const enemy4 = makeMinion(3, 3);

    const r = simulateCombat(
      [cleaveMinion, ally1, ally2],
      [enemy1, enemy2, enemy3, enemy4],
      makeRng(0),
    );

    // Cleave minion (3/3) attacks enemy1 (3/3). Both deal 3 damage.
    // Cleave also damages enemy2 (adjacent on enemy board).
    // enemy1 dies, enemy2 dies, enemy3 survives (3 HP), enemy4 survives (3 HP).
    // cleaveMinion dies (counterattack 3).
    // Remaining: [ally1 (10), ally2 (10)] vs [enemy3 (3), enemy4 (3)]
    // ally1 (5/10) attacks enemy3 (3/3). Both deal 5 and 3 damage.
    // enemy3 dies, ally1 at 5 HP.
    // ally2 (5/10) attacks enemy4 (3/3). Both deal 5 and 3 damage.
    // enemy4 dies, ally2 at 5 HP.
    // Winner: left
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
    expect(r.survivorsLeft[0]!.atk).toBe(5);
    expect(r.survivorsLeft[0]!.hp).toBe(5);
    expect(r.survivorsLeft[1]!.atk).toBe(5);
    expect(r.survivorsLeft[1]!.hp).toBe(10);
  });

  it("cleave with enemy at index 0 — only right adjacent takes damage", () => {
    // Board: [cleaveMinion, ally1]
    // Enemy: [enemy1, enemy2, enemy3]
    // Cleave minion attacks enemy1 (index 0). No left adjacent on enemy board.
    // Only enemy1 (defender) and enemy2 (right adjacent) take cleave damage.
    // enemy3 should NOT take cleave damage.
    const cleaveMinion = minion("foe_reaper_4000");
    const ally1 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);
    const enemy3 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1], [enemy1, enemy2, enemy3], makeRng(0));

    // Cleave minion (3/3) attacks enemy1 (3/3). Both deal 3 damage.
    // Cleave also damages enemy2 (adjacent on enemy board).
    // enemy1 dies, enemy2 dies, enemy3 survives (3 HP).
    // cleaveMinion dies (counterattack 3).
    // Remaining: [ally1 (10)] vs [enemy3 (3)]
    // ally1 (5/10) attacks enemy3 (3/3). enemy3 dies, ally1 at 7 HP.
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.atk).toBe(5);
    expect(r.survivorsLeft[0]!.hp).toBe(7);
  });
});
