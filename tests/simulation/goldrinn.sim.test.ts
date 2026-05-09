/**
 * Simulation tests for Goldrinn the Great Wolf deathrattle (M5 Beast).
 *
 * Goldrinn: onDeath gives all friendly Beasts +5/+5.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

function plain(atk: number, hp: number) {
  return instantiate(
    defineMinion({
      id: `plain_${atk}_${hp}`,
      name: `${atk}/${hp}`,
      tier: 1,
      tribes: [],
      baseAtk: atk,
      baseHp: hp,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {} as never,
    }),
  );
}

// ------------------------------------
// Goldrinn the Great Wolf
// ------------------------------------

describe("goldrinn", () => {
  it("gives all friendly Beasts +5/+5 when it dies in combat", () => {
    const goldrinn = m("goldrinn"); // 4/4 Beast
    const alleyCat = m("alley_cat"); // 1/1 Beast
    // 5/1 killer that kills Goldrinn (4/4) on exchange
    const killer = plain(5, 1);

    // Goldrinn dies (4 vs 5), deathrattle fires: Alley Cat gets +5/+5 → 6/6
    // Then Alley Cat (6/6) fights the killer (5/1) — Alley Cat wins
    const r = simulateCombat([goldrinn, alleyCat], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // Alley Cat should have a Stat event from the +5/+5 buff
    const alleyStats = stats.filter((s) => s.target === alleyCat.instanceId);
    expect(alleyStats.length).toBeGreaterThan(0);
    // After +5/+5: 1+5=6 atk, 1+5=6 hp
    const lastAlleyStat = alleyStats[alleyStats.length - 1]!;
    expect(lastAlleyStat.atk).toBe(6);
    expect(lastAlleyStat.hp).toBe(6);
  });

  it("does NOT buff itself — only other friendly Beasts", () => {
    const goldrinn = m("goldrinn");
    // 5/1 killer that kills Goldrinn
    const killer = plain(5, 1);

    const r = simulateCombat([goldrinn], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const goldrinnStats = stats.filter((s) => s.target === goldrinn.instanceId);
    expect(goldrinnStats).toHaveLength(0);
  });

  it("does NOT buff non-Beast friendly minions", () => {
    const goldrinn = m("goldrinn");
    const vanilla = plain(3, 3);
    // 5/1 killer that kills Goldrinn
    const killer = plain(5, 1);

    const r = simulateCombat([goldrinn, vanilla], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // Vanilla should NOT have a Stat event from Goldrinn's deathrattle
    // (it may have Stat events from combat attacks, but not from the deathrattle)
    const vanillaStats = stats.filter((s) => s.target === vanilla.instanceId);
    // Check that none of vanilla's stat events show +5/+5 buff
    for (const s of vanillaStats) {
      expect(s.atk).toBeLessThanOrEqual(3);
      expect(s.hp).toBeLessThanOrEqual(3);
    }
  });

  it("buffs other Goldrinns on the same board (they are all Beasts)", () => {
    const g1 = m("goldrinn");
    const g2 = m("goldrinn");
    // 5/1 killer that kills G1 but not G2 (G2 gets buffed to 9/9 by G1's deathrattle)
    const killer = plain(5, 1);

    const r = simulateCombat([g1, g2], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // G2 should receive +5/+5 from G1's deathrattle (G2 is a Beast)
    const g2Stats = stats.filter((s) => s.target === g2.instanceId);
    expect(g2Stats.length).toBeGreaterThan(0);
    // After G1's deathrattle: 4+5=9 atk, 4+5=9 hp
    const lastG2Stat = g2Stats[g2Stats.length - 1]!;
    expect(lastG2Stat.atk).toBe(9);
    expect(lastG2Stat.hp).toBe(9);
  });

  it("works on the right side (enemy board) — buffs enemy Beasts", () => {
    const goldrinn = m("goldrinn");
    const alleyCat = m("alley_cat"); // 1/1 Beast
    // 5/1 killer that kills Goldrinn
    const killer = plain(5, 1);

    // Goldrinn on right side (enemy board)
    const r = simulateCombat([killer], [goldrinn, alleyCat], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const alleyStats = stats.filter((s) => s.target === alleyCat.instanceId);
    expect(alleyStats.length).toBeGreaterThan(0);
    const lastAlleyStat = alleyStats[alleyStats.length - 1]!;
    expect(lastAlleyStat.atk).toBe(6);
    expect(lastAlleyStat.hp).toBe(6);
  });
});
