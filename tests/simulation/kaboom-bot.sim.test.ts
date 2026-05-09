/**
 * Simulation tests for Kaboom Bot deathrattle (M2).
 * Kaboom Bot (tier 2 mech, 3/2) deathrattle deals 4 damage to a random
 * enemy minion when it dies.
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
// Kaboom Bot — deathrattle deals 4 damage to a random enemy
// ---------------------------------------------------------------------------

describe("kaboom-bot", () => {
  it("deals 4 damage to a random enemy minion on death", () => {
    const kaboom = m("kaboom_bot"); // 3/2
    const enemy = plain(3, 6); // 3 ATK — kills kaboom (3/2 vs 3/6 exchange)

    const r = simulateCombat([kaboom], [enemy], makeRng(0));

    // Kaboom should be dead (2 HP < 3 ATK exchange)
    const vlSurvivor = r.survivorsLeft.find((m) => m.instanceId === kaboom.instanceId);
    expect(vlSurvivor).toBeUndefined();

    // Enemy takes 3 from attack + 4 from deathrattle = 7 total damage vs 6 HP → dead
    expect(r.survivorsRight).toHaveLength(0);
    expect(r.winner).toBe("draw");
  });

  it("kills a 1/4 enemy with 4 damage", () => {
    const kaboom = m("kaboom_bot"); // 3/2
    const enemy = plain(1, 4); // 1 ATK — kills kaboom, then 4 damage kills enemy

    const r = simulateCombat([kaboom], [enemy], makeRng(0));

    // Kaboom dead, enemy dead from deathrattle
    expect(r.survivorsLeft.find((m) => m.instanceId === kaboom.instanceId)).toBeUndefined();
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("does nothing when no enemies exist", () => {
    const kaboom = m("kaboom_bot"); // 3/2

    const r = simulateCombat([kaboom], [], makeRng(0));

    // Kaboom wins vs nothing, no deathrattle triggered
    const vlSurvivor = r.survivorsLeft.find((m) => m.instanceId === kaboom.instanceId);
    expect(vlSurvivor).toBeDefined();
    expect(vlSurvivor!.hp).toBe(2);
  });

  it("golden kaboom bot deals 4 damage to a random enemy", () => {
    const kaboom = m("kaboom_bot"); // 3/2
    kaboom.golden = true;

    const enemy = plain(1, 6);

    const r = simulateCombat([kaboom], [enemy], makeRng(0));

    // Golden = 2 deathrattle triggers → 4 + 4 = 8 damage
    const enemySurvivor = r.survivorsRight.find((m) => m.instanceId === enemy.instanceId);
    expect(enemySurvivor).toBeUndefined(); // 6 - 8 = -2, dead
  });
});
