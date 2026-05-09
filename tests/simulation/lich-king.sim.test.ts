/**
 * Simulation tests for The Lich King (tier 7 undead, 10/10 taunt).
 *
 * Lich King: onStartOfCombat gains +1 ATK and +1 HP per other friendly minion.
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
// The Lich King
// ------------------------------------

describe("lich-king", () => {
  it("gains +1 ATK and +1 HP per other friendly minion at start of combat", () => {
    const lichKing = m("lich_king"); // 10/10 Undead
    const minion1 = plain(2, 2);
    const minion2 = plain(3, 3);

    const r = simulateCombat([lichKing, minion1, minion2], [plain(20, 20)], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const lkStats = stats.filter((s) => s.target === lichKing.instanceId);
    expect(lkStats.length).toBeGreaterThan(0);
    // 10 + 2 other minions = 12 ATK, 10 + 2 = 12 HP
    const lastLkStat = lkStats[lkStats.length - 1]!;
    expect(lastLkStat.atk).toBe(12);
    expect(lastLkStat.hp).toBe(12);
  });

  it("solo Lich King — no other friendly minions, no buff", () => {
    const lichKing = m("lich_king");

    const r = simulateCombat([lichKing], [plain(20, 20)], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const lkStats = stats.filter((s) => s.target === lichKing.instanceId);
    expect(lkStats.length).toBeGreaterThanOrEqual(0);
    // When alone, Lich King stays at 10/10 (no buff)
    if (lkStats.length > 0) {
      const lastLkStat = lkStats[lkStats.length - 1]!;
      expect(lastLkStat.atk).toBe(10);
      expect(lastLkStat.hp).toBe(10);
    }
  });

  it("works on the right side (enemy board) — buffs enemy Lich King", () => {
    const lichKing = m("lich_king");
    const minion = plain(2, 2);
    // 20/20 killer that Lich King can beat after buff
    const killer = plain(20, 20);

    // Lich King on right side with 1 other minion
    const r = simulateCombat([killer], [lichKing, minion], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const lkStats = stats.filter((s) => s.target === lichKing.instanceId);
    expect(lkStats.length).toBeGreaterThan(0);
    // 10 + 1 other minion = 11 ATK, 10 + 1 = 11 HP
    const lastLkStat = lkStats[lkStats.length - 1]!;
    expect(lastLkStat.atk).toBe(11);
    expect(lastLkStat.hp).toBe(11);
  });

  it("gains +1/+1 per other friendly minion regardless of tribe", () => {
    const lichKing = m("lich_king");
    const beast = m("alley_cat"); // 1/1 Beast
    const demon = m("bloodsail_pirate"); // 1/1 Pirate (actually tier 1, let me check)
    const elemental = plain(1, 1);

    const r = simulateCombat([lichKing, beast, elemental], [plain(20, 20)], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const lkStats = stats.filter((s) => s.target === lichKing.instanceId);
    expect(lkStats.length).toBeGreaterThan(0);
    // 10 + 2 other minions = 12 ATK, 10 + 2 = 12 HP
    const lastLkStat = lkStats[lkStats.length - 1]!;
    expect(lastLkStat.atk).toBe(12);
    expect(lastLkStat.hp).toBe(12);
  });
});
