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
// Micro Machine — onStartOfCombat: gains +1 ATK
// ---------------------------------------------------------------------------

describe("micro-machine onStartOfCombat", () => {
  function getStartOfCombatStats(
    r: ReturnType<typeof simulateCombat>,
  ): (CombatEvent & { kind: "Stat"; target: string; atk: number; hp: number })[] {
    const attackIndex = r.transcript.findIndex((e) => e.kind === "Attack");
    const preAttackEvents = r.transcript.slice(0, attackIndex);
    return preAttackEvents.filter(isStatEvent);
  }

  it("gains +1 ATK at start of combat", () => {
    const mm = minion("micro_machine"); // 1/2 Mech
    const enemy = minion("rockpool_hunter");

    const r = simulateCombat([mm], [enemy], makeRng(0));

    const stats = getStartOfCombatStats(r);
    expect(stats).toHaveLength(1);
    expect(stats[0]!.target).toBe(mm.instanceId);
    expect(stats[0]!.atk).toBe(2); // 1 + 1
  });

  it("two Micro Machines each gain +1 independently", () => {
    const mm1 = minion("micro_machine");
    const mm2 = minion("micro_machine");
    const enemy = minion("rockpool_hunter");

    const r = simulateCombat([mm1, mm2], [enemy], makeRng(0));

    const stats = getStartOfCombatStats(r);
    expect(stats).toHaveLength(2);
    const mm1Stats = stats.filter((e) => e.target === mm1.instanceId);
    const mm2Stats = stats.filter((e) => e.target === mm2.instanceId);
    expect(mm1Stats).toHaveLength(1);
    expect(mm1Stats[0]!.atk).toBe(2);
    expect(mm2Stats).toHaveLength(1);
    expect(mm2Stats[0]!.atk).toBe(2);
  });
});
