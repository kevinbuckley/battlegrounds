import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { CombatEvent, Tribe } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string) {
  return instantiate(getMinion(id));
}

function makeMinion(id: string, tribes: Tribe[], atk: number, hp: number) {
  return instantiate({
    id,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes,
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

function isStatEvent(
  e: CombatEvent,
): e is CombatEvent & { kind: "Stat"; target: string; atk: number; hp: number } {
  return e.kind === "Stat";
}

// ---------------------------------------------------------------------------
// Mal'Ganis — onStartOfCombat: gives all OTHER friendly Demons +2/+2
// ---------------------------------------------------------------------------

describe("malganis onStartOfCombat", () => {
  function getStartOfCombatStats(
    r: ReturnType<typeof simulateCombat>,
  ): (CombatEvent & { kind: "Stat"; target: string; atk: number; hp: number })[] {
    // Stat events from onStartOfCombat appear before the first Attack event.
    // Post-attack Stat events (emitted for UI updates) appear after.
    const attackIndex = r.transcript.findIndex((e) => e.kind === "Attack");
    const preAttackEvents = r.transcript.slice(0, attackIndex);
    return preAttackEvents.filter(isStatEvent);
  }

  it("gives all OTHER friendly Demons +2/+2", () => {
    const malganis = minion("malganis");
    const imp = makeMinion("imp", ["Demon"], 1, 1);
    const murloc = makeMinion("murloc", ["Murloc"], 1, 1);
    const enemy = minion("rockpool_hunter");

    const r = simulateCombat([malganis, imp, murloc], [enemy], makeRng(0));

    const stats = getStartOfCombatStats(r);

    // Malganis itself should NOT be buffed (9/7).
    const malganisStats = stats.filter((e) => e.target === malganis.instanceId);
    expect(malganisStats).toHaveLength(0);

    // The Imp (Demon) should have been buffed to 3/3.
    const impStats = stats.filter((e) => e.target === imp.instanceId);
    expect(impStats).toHaveLength(1);
    expect(impStats[0]!.atk).toBe(3);
    expect(impStats[0]!.hp).toBe(3);

    // The Murloc (non-Demon) should NOT be buffed.
    const murlocStats = stats.filter((e) => e.target === murloc.instanceId);
    expect(murlocStats).toHaveLength(0);
  });

  it("does not buff itself — only other friendly Demons", () => {
    const malganis = minion("malganis");
    const enemy = minion("rockpool_hunter");

    const r = simulateCombat([malganis], [enemy], makeRng(0));

    const stats = getStartOfCombatStats(r);
    expect(stats).toHaveLength(0);
  });

  it("does not buff non-Demon allies", () => {
    const malganis = minion("malganis");
    const murloc = makeMinion("murloc", ["Murloc"], 1, 1);
    const mech = makeMinion("mech", ["Mech"], 1, 1);
    const enemy = minion("rockpool_hunter");

    const r = simulateCombat([malganis, murloc, mech], [enemy], makeRng(0));

    const stats = getStartOfCombatStats(r);
    const murlocStats = stats.filter((e) => e.target === murloc.instanceId);
    const mechStats = stats.filter((e) => e.target === mech.instanceId);
    expect(murlocStats).toHaveLength(0);
    expect(mechStats).toHaveLength(0);
  });

  it("stacks across multiple Demons", () => {
    const malganis = minion("malganis");
    const imp1 = makeMinion("imp1", ["Demon"], 1, 1);
    const imp2 = makeMinion("imp2", ["Demon"], 2, 2);
    const enemy = minion("rockpool_hunter");

    const r = simulateCombat([malganis, imp1, imp2], [enemy], makeRng(0));

    const stats = getStartOfCombatStats(r);
    const imp1Stats = stats.filter((e) => e.target === imp1.instanceId);
    const imp2Stats = stats.filter((e) => e.target === imp2.instanceId);
    expect(imp1Stats).toHaveLength(1);
    expect(imp1Stats[0]!.atk).toBe(3); // 1 + 2
    expect(imp1Stats[0]!.hp).toBe(3); // 1 + 2
    expect(imp2Stats).toHaveLength(1);
    expect(imp2Stats[0]!.atk).toBe(4); // 2 + 2
    expect(imp2Stats[0]!.hp).toBe(4); // 2 + 2
  });
});
