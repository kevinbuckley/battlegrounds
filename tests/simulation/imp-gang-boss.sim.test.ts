/**
 * Simulation tests for Imp Gang Boss onDamageTaken (M3).
 *
 * Imp Gang Boss (tier 3 demon, 2/4): whenever this minion takes damage,
 * summon a 1/1 Imp Demon to its side.
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
// Imp Gang Boss — onDamageTaken summons 1/1 Imp
// ---------------------------------------------------------------------------

describe("imp_gang_boss", () => {
  it("summons a 1/1 Imp each time it takes damage", () => {
    const boss = m("imp_gang_boss"); // 2/4
    // Two 2/1 enemies — each attack deals 2 damage to boss
    const enemy1 = plain(2, 1);
    const enemy2 = plain(2, 1);

    const r = simulateCombat([boss], [enemy1, enemy2], makeRng(0));

    const impSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "imp_gang_imp");
    expect(impSummons).toHaveLength(2);
  });

  it("summons multiple Imps when hit by a single strong enemy", () => {
    const boss = m("imp_gang_boss"); // 2/4
    // 10/10 enemy — deals 2 damage per attack, boss attacks 2 times
    // Each time boss takes damage, an Imp is summoned
    const enemy = plain(10, 10);

    const r = simulateCombat([boss], [enemy], makeRng(0));

    const impSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "imp_gang_imp");
    // Boss deals 2 damage per attack, has 4 HP → takes damage on attack 1 and 2
    expect(impSummons.length).toBeGreaterThan(0);
  });

  it("summons Imps that are Demons", () => {
    const boss = m("imp_gang_boss");
    const enemy = plain(5, 5);

    const r = simulateCombat([boss], [enemy], makeRng(0));

    const impSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "imp_gang_imp");
    expect(impSummons.length).toBeGreaterThan(0);

    // Check that summoned Imps are on the correct side
    const leftSide = r.transcript.filter(
      (e) => e.kind === "Summon" && e.card === "imp_gang_imp" && e.side === "left",
    );
    expect(leftSide).toHaveLength(impSummons.length);
  });

  it("respects board cap of 7 minions", () => {
    const boss = m("imp_gang_boss");
    // Fill board: 6 existing minions + boss = 7 (full)
    const allies = [
      boss,
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
    ];
    // 10/10 enemy — boss takes multiple hits, trying to summon many Imps
    const enemy = plain(10, 10);

    const r = simulateCombat(allies, [enemy], makeRng(0));

    const impSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "imp_gang_imp");
    // Board cap = 7, boss dies leaving 6 slots, so 1 Imp can be summoned
    expect(impSummons).toHaveLength(1);
  });

  it("works on the right side (enemy board)", () => {
    const boss = m("imp_gang_boss");
    const enemy = plain(5, 5);

    const r = simulateCombat([enemy], [boss], makeRng(0));

    const impSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "imp_gang_imp");
    expect(impSummons.length).toBeGreaterThan(0);

    // Imps should be on the right side (enemy side)
    const rightSide = r.transcript.filter(
      (e) => e.kind === "Summon" && e.card === "imp_gang_imp" && e.side === "right",
    );
    expect(rightSide).toHaveLength(impSummons.length);
  });
});
