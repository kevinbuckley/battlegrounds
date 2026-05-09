/**
 * Simulation tests for Zapp Slywick getTarget hook (M5).
 * Zapp Slywick (tier 5 mech, 7/10, rush) always attacks the
 * lowest-ATK enemy minion regardless of board position.
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
// Zapp Slywick — getTarget picks lowest-ATK enemy
// ---------------------------------------------------------------------------

describe("zapp_slywick", () => {
  it("attacks lowest-ATK enemy regardless of position", () => {
    const zapp = m("zapp_slywick"); // 7/10 rush
    // Place a 5/5 at position 0 and a 1/1 at position 1
    const enemy1 = plain(5, 5); // higher ATK, right side of board
    const enemy2 = plain(1, 5); // lowest ATK, left side of board

    const r = simulateCombat([zapp], [enemy1, enemy2], makeRng(0));

    // Zapp should target enemy2 (lowest ATK) first
    const attackEvents = r.transcript.filter((e) => e.kind === "Attack");
    expect(attackEvents.length).toBeGreaterThanOrEqual(1);
    expect(attackEvents[0]!.target).toBe(enemy2.instanceId);

    // Enemy2 (1/5) should die (1 HP < 7 ATK)
    const enemy2Survivor = r.survivorsRight.find((m) => m.instanceId === enemy2.instanceId);
    expect(enemy2Survivor).toBeUndefined();

    // Enemy1 (5/5) should also die (5 HP < 7 ATK)
    const enemy1Survivor = r.survivorsRight.find((m) => m.instanceId === enemy1.instanceId);
    expect(enemy1Survivor).toBeUndefined();

    // Zapp should survive (10 HP > 5 ATK)
    const zappSurvivor = r.survivorsLeft.find((m) => m.instanceId === zapp.instanceId);
    expect(zappSurvivor).toBeDefined();
  });

  it("attacks lowest-ATK enemy even when it's not the leftmost", () => {
    const zapp = m("zapp_slywick"); // 7/10 rush
    const enemy1 = plain(3, 3); // middle ATK
    const enemy2 = plain(1, 1); // lowest ATK
    const enemy3 = plain(5, 5); // highest ATK

    const r = simulateCombat([zapp], [enemy1, enemy2, enemy3], makeRng(0));

    // Zapp should target enemy2 (lowest ATK = 1) first
    const attackEvents = r.transcript.filter((e) => e.kind === "Attack");
    expect(attackEvents.length).toBeGreaterThanOrEqual(1);
    expect(attackEvents[0]!.target).toBe(enemy2.instanceId);

    // Enemy2 should be dead
    const enemy2Survivor = r.survivorsRight.find((m) => m.instanceId === enemy2.instanceId);
    expect(enemy2Survivor).toBeUndefined();
  });

  it("attacks taunt minions first, then lowest-ATK among them", () => {
    const zapp = m("zapp_slywick"); // 7/10 rush
    const enemy1 = plain(5, 5); // no taunt
    const enemy2 = plain(1, 10); // taunt, lowest ATK
    const enemy3 = plain(3, 3); // no taunt

    const r = simulateCombat([zapp], [enemy1, enemy2, enemy3], makeRng(0));

    // Zapp should target enemy2 (taunt, lowest ATK) first
    const attackEvents = r.transcript.filter((e) => e.kind === "Attack");
    expect(attackEvents.length).toBeGreaterThanOrEqual(1);
    expect(attackEvents[0]!.target).toBe(enemy2.instanceId);
  });

  it("no taunts — targets lowest-ATK among all enemies", () => {
    const zapp = m("zapp_slywick"); // 7/10 rush
    const enemy1 = plain(8, 8);
    const enemy2 = plain(2, 2);
    const enemy3 = plain(5, 5);

    const r = simulateCombat([zapp], [enemy1, enemy2, enemy3], makeRng(0));

    // Zapp should target enemy2 (lowest ATK = 2)
    const attackEvents = r.transcript.filter((e) => e.kind === "Attack");
    expect(attackEvents.length).toBeGreaterThanOrEqual(1);
    expect(attackEvents[0]!.target).toBe(enemy2.instanceId);
  });

  it("wins the fight after killing low-ATK targets", () => {
    const zapp = m("zapp_slywick"); // 7/10 rush
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);

    const r = simulateCombat([zapp], [enemy1, enemy2], makeRng(0));

    // Both enemies should die (7 ATK kills 1/1 easily)
    expect(r.survivorsRight).toHaveLength(0);

    // Zapp should survive
    const zappSurvivor = r.survivorsLeft.find((m) => m.instanceId === zapp.instanceId);
    expect(zappSurvivor).toBeDefined();
  });
});
