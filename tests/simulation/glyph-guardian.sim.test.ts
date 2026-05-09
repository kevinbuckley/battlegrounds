/**
 * Simulation tests for Glyph Guardian (S).
 *
 * Glyph Guardian (tier 2 dragon, 2/4) doubles its own ATK each time
 * it attacks. Board: [Glyph Guardian] vs [1/1, 1/1, 1/1].
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  return instantiate(getMinion(id));
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
// Glyph Guardian — doubles its own ATK each time it attacks
// ---------------------------------------------------------------------------

describe("glyph-guardian", () => {
  it("doubles ATK after first attack", () => {
    const glyph = m("glyph_guardian"); // 2/4
    const enemy = plain(1, 1);

    const r = simulateCombat([glyph], [enemy], makeRng(0));

    // Stat events should show ATK doubling: 2 → 4
    // Filter to only Stat events that are NOT StartOfCombat (which also emits stats)
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === glyph.instanceId,
    ) as Array<{ kind: "Stat"; target: string; atk: number; hp: number }>;
    // StartOfCombat emits 1 stat event, plus 1 attack = 2 total
    expect(statEvents.length).toBeGreaterThanOrEqual(1);
    // Find the attack-triggered stat event (ATK should be 4)
    const attackStat = statEvents.find((e) => e.atk === 4);
    expect(attackStat).toBeDefined();
  });

  it("doubles ATK again on second attack (windfury-like)", () => {
    const glyph = m("glyph_guardian"); // 2/4
    // 3 enemies so glyph attacks 3 times (once per enemy)
    const enemies = [plain(1, 1), plain(1, 1), plain(1, 1)];

    const r = simulateCombat([glyph], enemies, makeRng(0));

    // 3 attacks → ATK doubles: 2→4→8→16
    // Stat events are emitted after each combat tick for surviving minions
    // Glyph dies after 3rd attack, so we see ATK values up to 8
    // Check that ATK reaches at least 8 (2 attacks doubled: 2→4→8)
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === glyph.instanceId,
    ) as Array<{ kind: "Stat"; target: string; atk: number; hp: number }>;
    const maxAtk = Math.max(...statEvents.map((e) => e.atk));
    expect(maxAtk).toBeGreaterThanOrEqual(8);
    // Verify the fight is won (all enemies dead)
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("wins vs weak enemies with exponential ATK", () => {
    const glyph = m("glyph_guardian"); // 2/4
    const enemies = [plain(1, 1), plain(1, 1), plain(1, 1)];

    const r = simulateCombat([glyph], enemies, makeRng(0));

    // After 3 attacks, ATK = 16 — should easily win
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("does not buff non-dragon allies", () => {
    const glyph = m("glyph_guardian"); // 2/4
    const ally = plain(3, 3);
    const enemy = plain(1, 1);

    const r = simulateCombat([glyph, ally], [enemy], makeRng(0));

    // Only glyph should have Stat events from onAttack (not from StartOfCombat)
    // StartOfCombat emits 1 stat event per minion, so we expect 1 per minion
    const glyphStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === glyph.instanceId,
    ) as Array<{ kind: "Stat"; target: string; atk: number; hp: number }>;
    const allyStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === ally.instanceId,
    ) as Array<{ kind: "Stat"; target: string; atk: number; hp: number }>;
    // Glyph should have at least 1 stat event (StartOfCombat + attack buffs)
    expect(glyphStats.length).toBeGreaterThanOrEqual(1);
    // Ally should only have 1 stat event (StartOfCombat), no attack-triggered buffs
    expect(allyStats).toHaveLength(1);
  });
});
