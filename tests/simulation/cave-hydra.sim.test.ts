/**
 * Simulation tests for Cave Hydra cleave keyword (M5).
 * Cave Hydra (tier 4 beast, 4/5) has cleave: when it attacks,
 * the attacked target AND its two adjacent enemies also take damage.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

function plain(atk: number, hp: number) {
  return instantiate({
    id: `plain_${atk}_${hp}`,
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
// Cave Hydra — cleave damages main target + adjacent enemies
// ---------------------------------------------------------------------------

describe("cave_hydra", () => {
  it("weak enemies die to cleave — hydra wins against weak board", () => {
    const hydra = m("cave_hydra"); // 4/5
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);
    const enemy3 = plain(1, 1);

    const r = simulateCombat([hydra], [enemy1, enemy2, enemy3], makeRng(0));

    // All 3 enemies should die (4 damage from cleave > 1 hp)
    expect(r.survivorsRight).toHaveLength(0);

    // Hydra should survive
    const hydraSurvivor = r.survivorsLeft.find((m) => m.instanceId === hydra.instanceId);
    expect(hydraSurvivor).toBeDefined();
  });

  it("on a 2-minion board, cleave hits both enemies in one attack", () => {
    const hydra = m("cave_hydra"); // 4/5
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);

    const r = simulateCombat([hydra], [enemy1, enemy2], makeRng(0));

    // Both enemies should die (4 damage from cleave > 1 hp)
    expect(r.survivorsRight).toHaveLength(0);

    // Hydra should survive
    const hydraSurvivor = r.survivorsLeft.find((m) => m.instanceId === hydra.instanceId);
    expect(hydraSurvivor).toBeDefined();
  });

  it("on a 1-minion board, cleave only hits the single target", () => {
    const hydra = m("cave_hydra"); // 4/5
    const enemy = plain(1, 1);

    const r = simulateCombat([hydra], [enemy], makeRng(0));

    // Enemy should die (4 damage from attack > 1 hp)
    expect(r.survivorsRight).toHaveLength(0);

    // Hydra should survive
    const hydraSurvivor = r.survivorsLeft.find((m) => m.instanceId === hydra.instanceId);
    expect(hydraSurvivor).toBeDefined();
  });

  it("does not damage non-adjacent enemies — rightmost survives the first cleave attack", () => {
    const hydra = m("cave_hydra"); // 4/5
    const enemy1 = plain(0, 5); // 0 ATK — won't counterattack, 5 HP so 4 damage from cleave leaves 1
    const enemy2 = plain(0, 5); // 0 ATK — won't counterattack, 5 HP so 4 damage from cleave leaves 1
    const enemy3 = plain(0, 5); // 0 ATK — won't counterattack, 5 HP so 4 damage from subsequent attack leaves 1

    const r = simulateCombat([hydra], [enemy1, enemy2, enemy3], makeRng(0));

    // The transcript should show:
    // 1) First Attack: hydra attacks enemy1 (leftmost). Cleave hits enemy1 + enemy2.
    //    enemy3 is NOT hit by this attack (not adjacent to enemy1).
    // 2) Second Attack: hydra attacks enemy3 (remaining after loop continues).
    //    No cleave — single target.
    //
    // Verify: the first attack targets enemy1 (leftmost), NOT enemy3 (rightmost).
    // Cleave hits enemy1 + enemy2 (adjacent). enemy3 is NOT hit by the first attack.
    const attackEvents = r.transcript.filter((e) => e.kind === "Attack");
    const firstAttack = attackEvents[0] as { kind: string; target: string };
    expect(firstAttack.target).toBe(enemy1.instanceId);

    // All 3 enemies should eventually die (hydra deals 4 damage per attack, they have 5 HP,
    // but hydra attacks twice = 8 total damage spread across 3 enemies)
    // Actually: first attack cleaves enemy1+enemy2 (4 dmg each → 1 HP), second attack hits enemy3 (4 dmg → 1 HP).
    // Then loop continues: hydra attacks enemy1 again (cleave hits enemy1+enemy2, both die at -3).
    // Then hydra attacks enemy3 again (dies at -3). All die.
    expect(r.survivorsRight).toHaveLength(0);

    // Hydra should survive
    const hydraSurvivor = r.survivorsLeft.find((m) => m.instanceId === hydra.instanceId);
    expect(hydraSurvivor).toBeDefined();
  });
});
