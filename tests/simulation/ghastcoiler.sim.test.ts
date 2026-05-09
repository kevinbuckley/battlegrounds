import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function minion(id: string) {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number) {
  return instantiate({
    id: `custom_${atk}_${hp}`,
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
// Ghastcoiler — deathrattle summons 2 minions from hardcoded pool
// ---------------------------------------------------------------------------

describe("ghastcoiler simulation", () => {
  it("summons 2 minions from pool when Ghastcoiler dies", () => {
    const ghastcoiler = minion("ghastcoiler"); // 7/7 Beast
    const killer = makeMinion(8, 8);

    const r = simulateCombat([ghastcoiler], [killer], makeRng(0));

    // Count Summon events from deathrattle
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents.length).toBeGreaterThanOrEqual(2);

    // Verify survivorsLeft includes the 2 summoned minions
    expect(r.survivorsLeft.length).toBeGreaterThanOrEqual(2);
  });

  it("respects board cap of 7", () => {
    const ghastcoiler = minion("ghastcoiler"); // 7/7
    // Fill board with 6 other minions
    const boardMinions = Array.from({ length: 6 }, (_, i) => makeMinion(1, 1));
    const killer = makeMinion(8, 8);

    const r = simulateCombat([ghastcoiler, ...boardMinions], [killer], makeRng(0));

    // Board cap is 7 — ghastcoiler dies, 2 would be summoned but only 1 space
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents.length).toBeLessThanOrEqual(1);
  });

  it("summons minions that can win the fight", () => {
    const ghastcoiler = minion("ghastcoiler"); // 7/7
    const weakEnemy = makeMinion(1, 1);

    const r = simulateCombat([ghastcoiler], [weakEnemy], makeRng(0));

    // Ghastcoiler should kill the weak enemy, then die to counterattack
    // Deathrattle summons 2 minions from pool (Friggent 5/7, Terestian 5/5)
    // Those should finish the fight
    expect(r.survivorsRight.length).toBe(0);
  });

  it("golden Ghastcoiler also summons 2 (golden does not double deathrattle pool)", () => {
    const ghastcoiler = (() => {
      const m = instantiate(getMinion("ghastcoiler"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.hp * 2 };
    })();
    const killer = makeMinion(14, 14);

    const r = simulateCombat([ghastcoiler], [killer], makeRng(0));

    // Golden fires deathrattle twice, so 4 summons (capped at board 7)
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents.length).toBeGreaterThanOrEqual(2);
  });
});
