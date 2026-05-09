import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Dreadscale — deathrattle deals 2 damage to ALL other minions on both boards
// ---------------------------------------------------------------------------

describe("dreadscale", () => {
  function makeEnemy(atk: number, hp: number) {
    const e = instantiate(getMinion("murloc_scout"));
    e.baseAtk = atk;
    e.baseHp = hp;
    e.maxHp = hp;
    e.atk = atk;
    return e;
  }

  it("deals 2 damage to all other minions on both boards when it dies", () => {
    const ds = instantiate(getMinion("dreadscale")); // 6/6
    // Board: [Dreadscale 6/6, 20/20] vs [7/7, 3/3]
    // Dreadscale kills 3/3, dies to counterattack (6→3→dies).
    // 20/20 kills 7/7, survives (20/7).
    // Deathrattle fires: 2 damage to 20/20 → 20/18.
    const bigGuy = instantiate(getMinion("murloc_scout"));
    bigGuy.baseAtk = 20;
    bigGuy.baseHp = 20;
    bigGuy.maxHp = 20;
    bigGuy.atk = 20;
    const enemy1 = makeEnemy(7, 7);
    const enemy2 = makeEnemy(3, 3);

    const r = simulateCombat([ds, bigGuy], [enemy1, enemy2], makeRng(0));

    // Debug: print all events
    for (const e of r.transcript) {
      console.log(JSON.stringify(e));
    }
    console.log(
      "survivorsLeft:",
      r.survivorsLeft.map((m) => `${m.cardId} ${m.atk}/${m.hp}`),
    );
    console.log(
      "survivorsRight:",
      r.survivorsRight.map((m) => `${m.cardId} ${m.atk}/${m.hp}`),
    );

    // bigGuy takes 10 damage from enemy counterattacks (7+3), then 2 from deathrattle.
    // 20 - 10 - 2 = 8.
    const bigGuySurvivor = r.survivorsLeft.find((m) => m.instanceId === bigGuy.instanceId);
    expect(bigGuySurvivor).toBeDefined();
    expect(bigGuySurvivor!.hp).toBe(8);
  });

  it("kills 1/1 minions with 2 damage from deathrattle", () => {
    const ds = instantiate(getMinion("dreadscale")); // 6/6
    const ally = instantiate(getMinion("flame_imp")); // 1/1
    const enemy = makeEnemy(7, 7);
    // Board: [Dreadscale 6/6, Flame Imp 1/1] vs [7/7]
    // Dreadscale kills 7/7, dies to counterattack (6→1→dies).
    // Flame Imp survives (1/1). Deathrattle fires: 2 damage to Flame Imp → dies.
    const r = simulateCombat([ds, ally], [enemy], makeRng(0));

    // Flame Imp should die from deathrattle (1/1 → -1 HP)
    expect(r.survivorsLeft).toHaveLength(0);
  });

  it("does NOT damage itself", () => {
    const ds = instantiate(getMinion("dreadscale")); // 6/6
    // Board: [Dreadscale 6/6, 20/20] vs [7/7, 3/3]
    // Dreadscale dies, deathrattle fires but should NOT damage itself.
    // 20/20 should take 2 damage.
    const bigGuy = instantiate(getMinion("murloc_scout"));
    bigGuy.baseAtk = 20;
    bigGuy.baseHp = 20;
    bigGuy.maxHp = 20;
    bigGuy.atk = 20;
    const enemy1 = makeEnemy(7, 7);
    const enemy2 = makeEnemy(3, 3);

    const r = simulateCombat([ds, bigGuy], [enemy1, enemy2], makeRng(0));

    // Dreadscale should be dead, bigGuy should survive with 8 HP (20 - 10 counterattack - 2 deathrattle)
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]?.instanceId).toBe(bigGuy.instanceId);
    expect(r.survivorsLeft[0]!.hp).toBe(8);
  });

  it("golden Dreadscale fires deathrattle twice — 4 damage to all others", () => {
    const ds = instantiate(getMinion("dreadscale"));
    ds.golden = true;
    const ally = instantiate(getMinion("flame_imp")); // 1/1
    const enemy = makeEnemy(7, 7);
    // Board: [Golden Dreadscale 6/6, Flame Imp 1/1] vs [7/7]
    // Golden Dreadscale dies, deathrattle fires twice: 4 damage to Flame Imp → dies.
    const r = simulateCombat([ds, ally], [enemy], makeRng(0));

    // Flame Imp should die from 4 damage (1/1 → -3 HP)
    expect(r.survivorsLeft).toHaveLength(0);
  });
});
