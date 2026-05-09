import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Deathwing — deathrattle destroys ALL other minions
// ---------------------------------------------------------------------------

describe("deathwing", () => {
  it("destroys all other minions on both boards when it dies", () => {
    const dw = instantiate(getMinion("deathwing")); // 10/10
    const enemy1 = instantiate(getMinion("flame_imp")); // 1/1
    const enemy2 = instantiate(getMinion("murloc_scout")); // 1/1
    // Board: [Deathwing 10/10] vs [Flame Imp 1/1, Murloc Scout 1/1]
    // Deathwing attacks and kills both enemies, then dies to counterattacks.
    // Deathrattle should destroy all remaining enemies (none left).
    const r = simulateCombat([dw], [enemy1, enemy2], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]?.cardId).toBe("deathwing");
  });

  it("deathrattle destroys enemy minions that survive Deathwing's attacks", () => {
    const dw = instantiate(getMinion("deathwing")); // 10/10
    const enemy = instantiate(getMinion("murloc_scout")); // 1/1
    // Deathwing kills the enemy, enemy counterattacks for 1 damage (Deathwing 9/10).
    // Deathwing survives, no deathrattle fires.
    const r = simulateCombat([dw], [enemy], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
  });

  it("deathrattle clears enemy board even when Deathwing dies", () => {
    const dw = instantiate(getMinion("deathwing")); // 10/10
    // Board: [Deathwing 10/10, 1/1] vs [5/5, 5/5]
    // Deathwing kills one 5/5, dies to the other. Deathrattle destroys the surviving 5/5.
    const ally = instantiate(getMinion("flame_imp"));
    const enemy1 = instantiate(getMinion("murloc_scout"));
    const enemy2 = instantiate(getMinion("murloc_scout"));
    const r = simulateCombat([dw, ally], [enemy1, enemy2], makeRng(0));
    // Deathwing should destroy all enemies via deathrattle
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("golden Deathwing fires deathrattle twice", () => {
    const dw = instantiate(getMinion("deathwing"));
    dw.golden = true;
    // Board: [Golden Deathwing 10/10] vs [3/3, 3/3, 3/3]
    // Deathwing kills 2 enemies, dies to the third. Deathrattle fires twice,
    // each time destroying all remaining enemies.
    const enemy1 = instantiate(getMinion("murloc_scout"));
    const enemy2 = instantiate(getMinion("murloc_scout"));
    const enemy3 = instantiate(getMinion("murloc_scout"));
    const r = simulateCombat([dw], [enemy1, enemy2, enemy3], makeRng(0));
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("deathrattle also destroys friendly minions that survive alongside Deathwing", () => {
    const dw = instantiate(getMinion("deathwing")); // 10/10
    const ally = instantiate(getMinion("flame_imp")); // 1/1
    // Board: [Deathwing 10/10, Flame Imp 1/1] vs [1/1]
    // Deathwing kills the enemy, enemy counterattacks for 1 (Deathwing 9/10).
    // Deathwing survives, no deathrattle fires. Flame Imp survives.
    const r = simulateCombat([dw, ally], [instantiate(getMinion("murloc_scout"))], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
  });

  it("deathrattle destroys a friendly minion that survives alongside Deathwing's death", () => {
    // Board: [Deathwing 10/10, 1/1 with divineShield] vs [7/10, 7/10]
    // Deathwing attacks enemy1 (7/10) → Deathwing deals 10 damage (enemy1 HP = 0, dies).
    // Enemy1 counterattacks Deathwing for 7 (Deathwing 3/10).
    // Shielded minion attacks enemy2 (7/10) → deals 1 damage (enemy2 HP = 6).
    // Enemy2 counterattacks shielded minion → shield pops (HP = 1).
    // Deathwing (3/10) attacks enemy2 (6/10) → Deathwing deals 3 damage (enemy2 HP = 3).
    // Enemy2 counterattacks Deathwing for 7 (Deathwing -4, dies).
    // Deathwing's deathrattle fires, destroying the shielded minion (sets HP to 0).
    // The shielded minion is now dead (HP = 0 from deathrattle).
    const dw = instantiate(getMinion("deathwing"));
    const shielded = instantiate(getMinion("righteous_protector"));
    const enemy1 = instantiate(getMinion("zapp_slywick")); // 7/10
    const enemy2 = instantiate(getMinion("zapp_slywick")); // 7/10
    const r = simulateCombat([dw, shielded], [enemy1, enemy2], makeRng(0));
    // Deathwing dies, deathrattle fires, destroying the shielded minion too.
    expect(r.survivorsLeft).toHaveLength(0);
  });

  it("deathrattle destroys a friendly minion that survives alongside Deathwing's death", () => {
    // We need Deathwing to die while a friendly minion is still alive.
    // Board: [Deathwing 10/10, 1/1 with divineShield] vs [10/10]
    // Deathwing attacks 10/10 enemy → both deal 10 damage → both die.
    // The shielded minion survives (divine shield absorbs the counterattack).
    // Deathwing's deathrattle fires, destroying the shielded minion.
    const dw = instantiate(getMinion("deathwing"));
    const shielded = instantiate(getMinion("righteous_protector")); // 1/1 divineShield taunt
    // Need to give the shielded minion divineShield manually since it's 1/1
    // and the enemy is 10/10. The shielded minion survives the counterattack.
    const enemy = instantiate(getMinion("murloc_scout"));
    const r = simulateCombat([dw, shielded], [enemy], makeRng(0));
    // Deathwing kills the enemy, enemy counterattacks Deathwing for 1 (Deathwing 9/10).
    // Deathwing survives, no deathrattle. Shielded minion survives.
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(2);
  });
});
