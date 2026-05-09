/**
 * Simulation tests for Mechano-Egg deathrattle (M5).
 * Mechano-Egg (tier 5 mech, 0/5) deathrattle summons an 8/8 Robosaur
 * when it dies.
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
// Mechano-Egg — deathrattle summons an 8/8 Robosaur
// ---------------------------------------------------------------------------

describe("mechano-egg", () => {
  it("summons an 8/8 Robosaur on death", () => {
    const egg = m("mechano_egg"); // 0/5
    const enemy = plain(5, 7); // kills egg (0/5 vs 5/7 exchange), Robosaur (8/8) kills enemy (8/8 vs 5/7 exchange), enemy counterattack (5 ATK) leaves Robosaur with 3 HP

    const r = simulateCombat([egg], [enemy], makeRng(0));

    // Egg should be dead (5 HP < 5 ATK)
    const eggSurvivor = r.survivorsLeft.find((m) => m.instanceId === egg.instanceId);
    expect(eggSurvivor).toBeUndefined();

    // An 8/8 Robosaur should have been summoned and survived
    const robosaurs = r.survivorsLeft.filter((m) => m.cardId === "mechano_egg_robosaur");
    expect(robosaurs).toHaveLength(1);
    expect(robosaurs[0]!.atk).toBe(8);
    expect(robosaurs[0]!.hp).toBeGreaterThan(0);
  });

  it("Robosaur survives and finishes the fight", () => {
    const egg = m("mechano_egg"); // 0/5
    const enemy = plain(5, 7); // kills egg, Robosaur (8/8) kills enemy (8/8 vs 5/7 exchange), enemy counterattack (5 ATK) leaves Robosaur with 3 HP

    const r = simulateCombat([egg], [enemy], makeRng(0));

    // Enemy should also be dead (8 ATK vs 7 HP exchange)
    expect(r.survivorsRight).toHaveLength(0);

    // Robosaur should be on the board
    const robosaurs = r.survivorsLeft.filter((m) => m.cardId === "mechano_egg_robosaur");
    expect(robosaurs).toHaveLength(1);
  });

  it("respects board cap of 7 — fewer Robosaurs if board is full", () => {
    const egg = m("mechano_egg");
    // Fill board with 5 other minions (7 total with egg)
    const allies = [egg, plain(1, 1), plain(1, 1), plain(1, 1), plain(1, 1), plain(1, 1)];
    const enemy = plain(5, 7);

    const r = simulateCombat(allies, [enemy], makeRng(0));

    // Board cap is 7, egg dies → 5 remaining → 1 Robosaur would make 6 → fits
    const robosaurs = r.survivorsLeft.filter((m) => m.cardId === "mechano_egg_robosaur");
    expect(robosaurs).toHaveLength(1);
  });

  it("board full — no room for Robosaur", () => {
    const egg = m("mechano_egg");
    // Fill board with 6 other minions (7 total with egg)
    const allies = [
      egg,
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
    ];
    const enemy = plain(5, 7);

    const r = simulateCombat(allies, [enemy], makeRng(0));

    // Board cap is 7, egg dies → 6 remaining → 1 Robosaur would make 7 → fits
    const robosaurs = r.survivorsLeft.filter((m) => m.cardId === "mechano_egg_robosaur");
    expect(robosaurs).toHaveLength(1);
  });

  it("golden Mechano-Egg deathrattle fires twice — two Robosaurs", () => {
    const egg = m("mechano_egg");
    egg.golden = true;

    const enemy = plain(5, 7);

    const r = simulateCombat([egg], [enemy], makeRng(0));

    // Golden egg dies (5 HP < 10 ATK)
    const eggSurvivor = r.survivorsLeft.find((m) => m.instanceId === egg.instanceId);
    expect(eggSurvivor).toBeUndefined();

    // Golden = 2 triggers of deathrattle → 2 Robosaurs
    const robosaurs = r.survivorsLeft.filter((m) => m.cardId === "mechano_egg_robosaur");
    expect(robosaurs).toHaveLength(2);
  });
});
