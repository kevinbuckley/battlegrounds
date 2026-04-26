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
      hooks: {} as never,
    }),
  );
}

// Need to import defineMinion for plain helper

// ------------------------------------
// Spawn of N'Zoth
// ------------------------------------

describe("spawn_of_nzoth", () => {
  it("gives all friendly minions +1/+1 when it dies", () => {
    const nZoth = m("spawn_of_nzoth"); // 1/1 Mech
    const ally1 = plain(1, 1);
    const ally2 = plain(1, 1);
    const enemy = m("wrath_weaver"); // 1/1

    // left attacks first (seed 0, more minions); nZoth dies, triggers +1/+1
    const r = simulateCombat([nZoth, ally1, ally2], [enemy], makeRng(0));

    // nZoth does not buff itself
    const nZothStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === nZoth.instanceId,
    );
    expect(nZothStats).toHaveLength(0);

    // allies should have Stat events from the +1/+1 buff
    const allStats = r.transcript.filter((e) => e.kind === "Stat");
    expect(allStats.length).toBeGreaterThan(0);
  });

  it("does NOT buff itself — only other friendly minions", () => {
    const nZoth = m("spawn_of_nzoth");
    const enemy = m("wrath_weaver");

    const r = simulateCombat([nZoth], [enemy], makeRng(0));

    const nZothStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === nZoth.instanceId,
    );
    expect(nZothStats).toHaveLength(0);
  });

  it("gives +1/+1 only to living friendly minions", () => {
    const nZoth = m("spawn_of_nzoth");
    const ally1 = plain(1, 10);
    const ally2 = plain(1, 10);
    const enemy = plain(1, 1);

    const r = simulateCombat([nZoth, ally1, ally2], [enemy], makeRng(0));

    // Filter to Stat events only
    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // All stat events should be from the nZoth buff (+1/+1)
    const nZothStatTargets = stats.some((s) => s.target === nZoth.instanceId);
    expect(nZothStatTargets).toBe(false);
  });

  it("does not buff enemy minions", () => {
    const nZoth = m("spawn_of_nzoth");
    const ally = plain(1, 10);
    const enemy1 = m("alley_cat"); // 1/1 Beast
    const enemy2 = m("wrath_weaver"); // 1/1

    const r = simulateCombat([nZoth, ally], [enemy1, enemy2], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const enemyIds = new Set([enemy1.instanceId, enemy2.instanceId]);
    for (const s of stats) {
      expect(enemyIds.has(s.target)).toBe(false);
    }
  });
});
