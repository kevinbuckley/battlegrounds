/**
 * Simulation tests for Annihilan Battlemaster onAllyAttack (Tier 4 Demon, 1/4).
 *
 * Annihilan: when a friendly Demon attacks, gain +2 ATK.
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
// Annihilan Battlemaster
// ------------------------------------

describe("annihilan-battlemaster", () => {
  it("gains +2 ATK when a friendly Demon attacks", () => {
    const annihilan = m("annihilan_battlemaster"); // 1/4 Demon
    const imp = m("imp_gang_boss"); // 2/4 Demon
    // 5/1 killer that kills both Annihilan and Imp
    const killer = plain(5, 1);

    const r = simulateCombat([imp, annihilan], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const annihilanStats = stats.filter((s) => s.target === annihilan.instanceId);
    expect(annihilanStats.length).toBeGreaterThan(0);
    // After +2 ATK: 1+2=3 atk
    const lastAnnihilanStat = annihilanStats[annihilanStats.length - 1]!;
    expect(lastAnnihilanStat.atk).toBe(3);
  });

  it("does NOT trigger when a non-Demon ally attacks", () => {
    const annihilan = m("annihilan_battlemaster");
    const vanilla = plain(3, 3);
    // Weak enemy that vanilla kills, giving vanilla a chance to attack
    const weakEnemy = plain(2, 1);

    const r = simulateCombat([vanilla, annihilan], [weakEnemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const annihilanStats = stats.filter((s) => s.target === annihilan.instanceId);
    // Filter to only buff events: Stat events where atk > baseAtk (1)
    const buffEvents = annihilanStats.filter((s) => s.atk > 1);
    expect(buffEvents).toHaveLength(0);
  });

  it("stacks across multiple Demon attacks", () => {
    const annihilan = m("annihilan_battlemaster");
    const imp1 = m("imp_gang_boss");
    const imp2 = m("imp_gang_boss");
    // Tough enemy that survives both Imp attacks, allowing both to attack
    const toughEnemy = plain(1, 10);

    const r = simulateCombat([imp1, imp2, annihilan], [toughEnemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const annihilanStats = stats.filter((s) => s.target === annihilan.instanceId);
    // Filter to only buff events: Stat events where atk > baseAtk (1)
    const buffEvents = annihilanStats.filter((s) => s.atk > 1);
    expect(buffEvents.length).toBeGreaterThan(1);
    // After 2 Demon attacks: 1+2+2=5 atk
    const lastAnnihilanStat = buffEvents[buffEvents.length - 1]!;
    expect(lastAnnihilanStat.atk).toBe(5);
  });

  it("does NOT trigger when Annihilan attacks itself", () => {
    const annihilan = m("annihilan_battlemaster");
    const killer = plain(5, 1);

    const r = simulateCombat([annihilan], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const annihilanStats = stats.filter((s) => s.target === annihilan.instanceId);
    expect(annihilanStats).toHaveLength(0);
  });
});
