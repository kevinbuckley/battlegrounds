/**
 * Simulation tests for Spawn of N'Zoth deathrattle (M5 tribe minions).
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

// Need to import defineMinion for plain helper

// ------------------------------------
// Spawn of N'Zoth
// ------------------------------------

describe("spawn_of_nzoth", () => {
  it("gives all friendly minions +2/+2 when it dies", () => {
    const nZoth = m("spawn_of_nzoth"); // 2/2 Mech
    const ally1 = plain(1, 1);
    const ally2 = plain(1, 1);
    // 3/1 killer that kills nZoth (2/2) on exchange
    const enemy = plain(3, 1);

    // left attacks first (seed 0, more minions); nZoth dies, triggers +2/+2
    const r = simulateCombat([nZoth, ally1, ally2], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // allies should have Stat events from the +2/+2 buff
    expect(stats.length).toBeGreaterThan(0);

    // ally1 and ally2 should each get +2/+2 from nZoth's deathrattle
    const ally1Stats = stats.filter((s) => s.target === ally1.instanceId);
    const ally2Stats = stats.filter((s) => s.target === ally2.instanceId);
    expect(ally1Stats.length).toBeGreaterThan(0);
    expect(ally2Stats.length).toBeGreaterThan(0);
    // After +2/+2: 1+2=3 atk, 1+2=3 hp
    const lastAlly1Stat = ally1Stats[ally1Stats.length - 1]!;
    const lastAlly2Stat = ally2Stats[ally2Stats.length - 1]!;
    expect(lastAlly1Stat.atk).toBe(3);
    expect(lastAlly1Stat.hp).toBe(3);
    expect(lastAlly2Stat.atk).toBe(3);
    expect(lastAlly2Stat.hp).toBe(3);
  });

  it("does NOT buff itself — only other friendly minions", () => {
    const nZoth = m("spawn_of_nzoth"); // 2/2 Mech
    // 3/1 killer that kills nZoth (2/2)
    const enemy = plain(3, 1);

    const r = simulateCombat([nZoth], [enemy], makeRng(0));

    // nZoth should not receive +2/+2 from its own deathrattle
    // (it may have Stat events from combat attacks, but not from the deathrattle)
    const nZothStats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } =>
        e.kind === "Stat" && e.target === nZoth.instanceId,
    );
    // nZoth's final stats should remain 2/2 (no +2/+2 buff from self)
    for (const s of nZothStats) {
      expect(s.atk).toBeLessThanOrEqual(2);
      expect(s.hp).toBeLessThanOrEqual(2);
    }
  });

  it("gives +2/+2 only to living friendly minions", () => {
    const nZoth = m("spawn_of_nzoth"); // 2/2 Mech
    // 3/1 killer that kills nZoth (2/2)
    const enemy = plain(3, 1);
    const ally1 = plain(1, 1);
    const ally2 = plain(1, 1);

    const r = simulateCombat([nZoth, ally1, ally2], [enemy], makeRng(0));

    // Filter to Stat events only
    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // ally1 and ally2 should each get +2/+2 from nZoth's deathrattle
    const ally1Stats = stats.filter((s) => s.target === ally1.instanceId);
    const ally2Stats = stats.filter((s) => s.target === ally2.instanceId);
    expect(ally1Stats.length).toBeGreaterThan(0);
    expect(ally2Stats.length).toBeGreaterThan(0);
    // After +2/+2: 1+2=3 atk, 1+2=3 hp
    const lastAlly1Stat = ally1Stats[ally1Stats.length - 1]!;
    const lastAlly2Stat = ally2Stats[ally2Stats.length - 1]!;
    expect(lastAlly1Stat.atk).toBe(3);
    expect(lastAlly1Stat.hp).toBe(3);
    expect(lastAlly2Stat.atk).toBe(3);
    expect(lastAlly2Stat.hp).toBe(3);
  });

  it("does not buff enemy minions", () => {
    const nZoth = m("spawn_of_nzoth"); // 2/2 Mech
    // 3/1 killer that kills nZoth (2/2)
    const enemy = plain(3, 1);
    const ally = plain(1, 1);

    const r = simulateCombat([nZoth, ally], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // ally should get +2/+2 from nZoth's deathrattle
    const allyStats = stats.filter((s) => s.target === ally.instanceId);
    expect(allyStats.length).toBeGreaterThan(0);
    const lastAllyStat = allyStats[allyStats.length - 1]!;
    expect(lastAllyStat.atk).toBe(3);
    expect(lastAllyStat.hp).toBe(3);
  });
});
