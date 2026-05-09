/**
 * Simulation tests for Fiendish Servant deathrattle (M1 Demon).
 *
 * Fiendish Servant: onDeath gives its current ATK to a random friendly minion.
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
// Fiendish Servant
// ------------------------------------

describe("fiendish-servant", () => {
  it("gives its current ATK to a random friendly minion when it dies in combat", () => {
    const servant = m("fiendish_servant"); // 2/1 Demon
    const vanilla = plain(1, 4);
    // 3/3 killer that kills Fiendish Servant
    const killer = plain(3, 3);

    const r = simulateCombat([servant, vanilla], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const vanillaStats = stats.filter((s) => s.target === vanilla.instanceId);
    expect(vanillaStats.length).toBeGreaterThan(0);
    // Fiendish Servant has 2 ATK, so vanilla should gain +2 ATK → 3/1
    const lastVanillaStat = vanillaStats[vanillaStats.length - 1]!;
    expect(lastVanillaStat.atk).toBe(3);
  });

  it("gives a buffed Servant's full ATK (4 ATK → +4)", () => {
    const servant = m("fiendish_servant");
    // Buff Fiendish Servant to 4 ATK by having it fight a weak enemy first
    // We'll use a board where Fiendish Servant survives long enough to get buffed
    // Actually, let's just manually set the ATK on the minion before combat
    servant.atk = 4;
    const vanilla = plain(1, 4);
    const killer = plain(3, 3);

    const r = simulateCombat([servant, vanilla], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const vanillaStats = stats.filter((s) => s.target === vanilla.instanceId);
    expect(vanillaStats.length).toBeGreaterThan(0);
    // Fiendish Servant has 4 ATK, so vanilla should gain +4 ATK → 5/4
    const lastVanillaStat = vanillaStats[vanillaStats.length - 1]!;
    expect(lastVanillaStat.atk).toBe(5);
  });

  it("does nothing when no other friendly minions exist", () => {
    const servant = m("fiendish_servant");
    const killer = plain(3, 3);

    const r = simulateCombat([servant], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const servantStats = stats.filter((s) => s.target === servant.instanceId);
    expect(servantStats).toHaveLength(0);
  });

  it("does not crash when Fiendish Servant has 0 ATK", () => {
    const servant = m("fiendish_servant");
    servant.atk = 0;
    const vanilla = plain(1, 4);
    const killer = plain(3, 3);

    const r = simulateCombat([servant, vanilla], [killer], makeRng(0));

    const stats = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );

    const vanillaStats = stats.filter((s) => s.target === vanilla.instanceId);
    // No Stat events from Fiendish Servant's deathrattle (0 ATK)
    for (const s of vanillaStats) {
      expect(s.atk).toBeLessThanOrEqual(1);
    }
  });
});
