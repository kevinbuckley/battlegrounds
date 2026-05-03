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
    // Board: [wrath_weaver (1/3), ally1 (5/10), ally2 (5/10)]
    // Enemy: [enemy1 (3/3), enemy2 (3/3), enemy3 (3/3)]
    //
    // From the debug transcript, the actual combat flow is:
    // 1. m1 (wrath_weaver 1/3) attacks m4 (enemy1 3/3)
    //    - Cleave hits: m4 (enemy1) and m5 (enemy2, right adjacent)
    //    - enemy1: 3→2 HP, enemy2: 3→2 HP, wrath_weaver: 3→0 (dies)
    // 2. m4 (enemy1 3/2) attacks m2 (ally1 5/10)
    //    - ally1: 10→7 HP, enemy1: 2→-3 (dies)
    // 3. m3 (ally2 5/10) attacks m5 (enemy2 3/2)
    //    - enemy2: 2→-3 (dies), ally2: 10→7 HP
    // 4. m6 (enemy3 3/3) attacks m2 (ally1 5/7)
    //    - ally1: 7→4 HP, enemy3: 3→-1 (dies)
    // Winner: left, survivors: [ally1 5/4, ally2 5/7]
    const cleaveMinion = minion("wrath_weaver");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);
    const enemy3 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1, ally2], [enemy1, enemy2, enemy3], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
    expect(r.survivorsRight).toHaveLength(0);

    // Both enemies on the right should be dead (cleave killed enemy1 and enemy2)
    // Only enemy3 survived (not adjacent to the cleave target)
    // ally1 took 6 damage total (3 from counterattack + 3 from enemy3)
    // ally2 took 3 damage (from enemy2 counterattack)
    const sorted = [...r.survivorsLeft].sort((a, b) => a.hp - b.hp);
    expect(sorted[0]!.atk).toBe(5);
    expect(sorted[0]!.hp).toBe(4);
    expect(sorted[1]!.atk).toBe(5);
    expect(sorted[1]!.hp).toBe(7);
  });

  it("cleave at edge — only one adjacent enemy takes damage", () => {
    // Board: [cave_hydra (4/5), ally1 (5/10)]
    // Enemy: [enemy1 (3/3), enemy2 (3/3)]
    //
    // Cave hydra (4/5) attacks enemy1 (3/3). Cleave hits enemy1 + enemy2.
    // enemy1: 3→-1 (dies), enemy2: 3→-1 (dies), cave_hydra: 5→2 (counterattack 3).
    // Both enemies die. cave_hydra survives at 2 HP.
    // No remaining enemies. Winner: left, survivors: [cave_hydra (4/2), ally1 (5/10)]
    const cleaveMinion = minion("cave_hydra");
    const ally1 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1], [enemy1, enemy2], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
    expect(r.survivorsRight).toHaveLength(0);
    // cave_hydra took 3 counterattack damage, ally1 untouched
    const sorted = [...r.survivorsLeft].sort((a, b) => a.hp - b.hp);
    expect(sorted[0]!.atk).toBe(4);
    expect(sorted[0]!.hp).toBe(2);
    expect(sorted[1]!.atk).toBe(5);
    expect(sorted[1]!.hp).toBe(10);
  });

  it("single minion with cleave — no adjacent enemies to damage", () => {
    // Board: [wrath_weaver (1/3)]
    // Enemy: [enemy (3/3)]
    //
    // Wrath weaver (1/3) attacks enemy (3/3). No adjacent enemies to cleave.
    // enemy: 3→2 HP, wrath_weaver: 3→0 (dies).
    // Winner: right (enemy survives with 2 HP).
    const cleaveMinion = minion("wrath_weaver");
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion], [enemy], makeRng(0));

    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(1);
    expect(r.survivorsRight[0]!.hp).toBe(2);
  });

  it("cleave does NOT damage all enemies — only adjacent ones", () => {
    // Board: [cave_hydra (4/5), ally1 (5/10), ally2 (5/10)]
    // Enemy: [enemy1 (3/3), enemy2 (3/3), enemy3 (3/3), enemy4 (3/3)]
    //
    // Cave hydra (4/5) attacks enemy1 (3/3). Cleave hits enemy1 + enemy2.
    // enemy1: 3→-1 (dies), enemy2: 3→-1 (dies), cave_hydra: 5→2 (counterattack 3).
    // Remaining: [cave_hydra (4/2), ally1 (5/10), ally2 (5/10)] vs [enemy3 (3/3), enemy4 (3/3)]
    //
    // Next: cave_hydra (4/2) attacks enemy3 (3/3). Cleave hits enemy3 + enemy4.
    // enemy3: 3→-1 (dies), enemy4: 3→-1 (dies), cave_hydra: 2→-1 (dies, counterattack 3).
    // Remaining: [ally1 (5/10), ally2 (5/10)] vs [enemy3 (3/3), enemy4 (3/3)]
    //
    // Next: ally1 (5/10) attacks enemy3 (3/3). enemy3: 3→-2 (dies), ally1: 10→7 (counterattack 3).
    // Remaining: [ally1 (5/7), ally2 (5/10)] vs [enemy4 (3/3)]
    //
    // Next: ally2 (5/10) attacks enemy4 (3/3). enemy4: 3→-2 (dies), ally2: 10→7 (counterattack 3).
    // Remaining: [ally1 (5/7), ally2 (5/7)] — no enemies.
    // Winner: left
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

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
    expect(r.survivorsRight).toHaveLength(0);
    // ally1 was never attacked (cave_hydra absorbed the enemy3 counterattack)
    const untouched = r.survivorsLeft.find((m) => m.atk === 5 && m.hp === 10);
    expect(untouched).toBeDefined();
    // ally2 took 3 damage from enemy4 counterattack
    const damaged = r.survivorsLeft.find((m) => m.atk === 5 && m.hp === 7);
    expect(damaged).toBeDefined();
  });

  it("cleave with enemy at index 0 — only right adjacent takes damage", () => {
    // Board: [foe_reaper_4000 (6/9), ally1 (5/10)]
    // Enemy: [enemy1 (3/3), enemy2 (3/3), enemy3 (3/3)]
    //
    // Foe Reaper (6/9) attacks enemy1 (3/3). Cleave hits enemy1 + enemy2.
    // enemy1: 3→-3 (dies), enemy2: 3→-3 (dies), foe_reaper: 9→6 (counterattack 3).
    // Remaining: [foe_reaper (6/6), ally1 (5/10)] vs [enemy3 (3/3)]
    //
    // Next: foe_reaper (6/6) attacks enemy3 (3/3). No adjacent enemies to cleave.
    // enemy3: 3→-3 (dies), foe_reaper: 6→3 (counterattack 3).
    // Remaining: [foe_reaper (6/3), ally1 (5/10)] — no enemies.
    // Winner: left
    const cleaveMinion = minion("foe_reaper_4000");
    const ally1 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);
    const enemy3 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1], [enemy1, enemy2, enemy3], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
    expect(r.survivorsRight).toHaveLength(0);
    // ally1 was never attacked (foe_reaper absorbed the enemy3 counterattack)
    const ally = r.survivorsLeft.find((m) => m.atk === 5);
    expect(ally).toBeDefined();
    expect(ally!.hp).toBe(10);
    // foe_reaper survives at 3 HP (took 3 from enemy3 counterattack)
    const fr = r.survivorsLeft.find((m) => m.cardId === "foe_reaper_4000");
    expect(fr).toBeDefined();
    expect(fr!.hp).toBe(3);
  });
});
