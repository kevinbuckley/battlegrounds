/**
 * Simulation tests for Arm of the Empire onAllyAttacked (Tier 3 Dragon).
 *
 * Arm of the Empire: when a friendly taunt minion is attacked,
 * ALL friendly taunt minions gain +3/+2.
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
// Arm of the Empire
// ------------------------------------

describe("arm-of-the-empire", () => {
  it("buffs ALL friendly taunt minions when a friendly taunt is attacked", () => {
    const arm = m("arm_of_the_empire"); // 4/5 Dragon
    const protector = m("righteous_protector"); // 1/1 Taunt + Divine Shield
    // Enemy with taunt — Arm attacks enemy taunt, triggering onAllyAttacked on left side
    const enemyTaunt = instantiate(
      defineMinion({
        id: "enemy_taunt",
        name: "Enemy Taunt",
        tier: 3,
        tribes: [],
        baseAtk: 5,
        baseHp: 5,
        baseKeywords: ["taunt"],
        spellDamage: 0,
        hooks: {} as never,
      }),
    );

    const r = simulateCombat([arm, protector], [enemyTaunt], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // Protector should receive +3/+2 from Arm's onAllyAttacked
    const protectorStats = stats.filter((s) => s.target === protector.instanceId);
    expect(protectorStats.length).toBeGreaterThan(0);
    const lastProtectorStat = protectorStats[protectorStats.length - 1]!;
    expect(lastProtectorStat.atk).toBe(4); // 1 + 3
    expect(lastProtectorStat.hp).toBe(3); // 1 + 2
  });

  it("does NOT buff non-taunt friendly minions", () => {
    const arm = m("arm_of_the_empire");
    const vanilla = plain(3, 3);
    const enemy = plain(3, 3);

    const r = simulateCombat([arm, vanilla], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // Vanilla should NOT receive +3/+2 from Arm's onAllyAttacked
    const vanillaStats = stats.filter((s) => s.target === vanilla.instanceId);
    for (const s of vanillaStats) {
      expect(s.atk).toBeLessThanOrEqual(3);
      expect(s.hp).toBeLessThanOrEqual(3);
    }
  });

  it("buffs multiple taunt minions on the same board", () => {
    const arm = m("arm_of_the_empire");
    const protector1 = m("righteous_protector");
    const protector2 = instantiate(
      defineMinion({
        id: "protector2",
        name: "Righteous Protector",
        tier: 1,
        tribes: [],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: ["taunt"],
        spellDamage: 0,
        hooks: {} as never,
      }),
    );
    const enemy = plain(3, 3);

    const r = simulateCombat([arm, protector1, protector2], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // Both protectors should receive +3/+2
    const p1Stats = stats.filter((s) => s.target === protector1.instanceId);
    const p2Stats = stats.filter((s) => s.target === protector2.instanceId);
    expect(p1Stats.length).toBeGreaterThan(0);
    expect(p2Stats.length).toBeGreaterThan(0);
    const lastP1Stat = p1Stats[p1Stats.length - 1]!;
    const lastP2Stat = p2Stats[p2Stats.length - 1]!;
    expect(lastP1Stat.atk).toBe(4); // 1 + 3
    expect(lastP1Stat.hp).toBe(3); // 1 + 2
    expect(lastP2Stat.atk).toBe(4); // 1 + 3
    expect(lastP2Stat.hp).toBe(3); // 1 + 2
  });

  it("does NOT trigger when no friendly taunts exist", () => {
    const arm = m("arm_of_the_empire");
    const vanilla = plain(3, 3);
    const enemy = plain(3, 3);

    const r = simulateCombat([arm, vanilla], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    // Arm should NOT receive any stat buff (no taunts to buff)
    const armStats = stats.filter((s) => s.target === arm.instanceId);
    for (const s of armStats) {
      expect(s.atk).toBeLessThanOrEqual(5); // 4 + 1 from attacking, not +3
      expect(s.hp).toBeLessThanOrEqual(6); // 5 + 1, not +2
    }
  });
});
