/**
 * Simulation tests for Friggent Northvalley deathrattle (S5).
 * Friggent Northvalley (tier 6, 5/7 Beast) deathrattle summons a 2/3 Stalker
 * to the ally side when it dies.
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
// Friggent Northvalley — deathrattle summons a 2/3 Stalker
// ---------------------------------------------------------------------------

describe("friggent_northvalley", () => {
  it("summons a 2/3 Stalker to ally side on death", () => {
    const friggent = m("friggent_northvalley"); // 5/7
    const ally = plain(2, 100); // survives combat
    const enemy = plain(6, 6); // kills friggent (5/7 vs 6/6 exchange)

    const r = simulateCombat([friggent, ally], [enemy], makeRng(0));

    // Friggent should be dead (7 HP < 6 ATK + 6 counterattack)
    const fSurvivor = r.survivorsLeft.find((m) => m.instanceId === friggent.instanceId);
    expect(fSurvivor).toBeUndefined();

    // A Stalker should have been summoned
    const stalkers = r.survivorsLeft.filter((m) => m.cardId === "stalker");
    expect(stalkers).toHaveLength(1);

    // Stalker should be 2/3 Beast
    expect(stalkers[0]!.atk).toBe(2);
    expect(stalkers[0]!.hp).toBe(3);
    expect(stalkers[0]!.tribes).toContain("Beast");

    // Ally should still be alive
    const allySurvivor = r.survivorsLeft.find((m) => m.instanceId === ally.instanceId);
    expect(allySurvivor).toBeDefined();
  });

  it("summons Stalker even when board was full (7 total) before death", () => {
    const friggent = m("friggent_northvalley"); // 5/7
    // Fill board with 6 other minions (7 total with friggent)
    const allies = [
      friggent,
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
    ];
    const enemy = plain(10, 1); // kills friggent

    const r = simulateCombat(allies, [enemy], makeRng(0));

    // When friggent dies, the array is filtered to 6 (removing friggent).
    // The onDeath hook checks allies.length >= 7, which is 6 >= 7 = false,
    // so the Stalker IS summoned (6 + 1 = 7, within cap).
    const stalkers = r.survivorsLeft.filter((m) => m.cardId === "stalker");
    expect(stalkers).toHaveLength(1);

    // Friggent should be dead
    const fSurvivor = r.survivorsLeft.find((m) => m.instanceId === friggent.instanceId);
    expect(fSurvivor).toBeUndefined();
  });
});
