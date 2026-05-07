import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number): MinionInstance {
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

function getStartOfCombatStats(
  transcript: import("@/game/types").CombatEvent[],
  instanceId: string,
): { atk: number; hp: number } | undefined {
  const events = transcript.filter((e) => e.kind === "Stat" && e.target === instanceId) as Array<{
    kind: "Stat";
    target: string;
    atk: number;
    hp: number;
  }>;
  return events[0];
}

// ---------------------------------------------------------------------------
// The Lich King — onStartOfCombat gains +1/+1 per other minion
// ---------------------------------------------------------------------------

describe("The Lich King — onStartOfCombat", () => {
  it("has correct base stats and undead tribe", () => {
    const card = getMinion("lich_king");
    expect(card.baseAtk).toBe(10);
    expect(card.baseHp).toBe(10);
    expect(card.tier).toBe(7);
    expect(card.tribes).toContain("Undead");
    expect(card.baseKeywords).toContain("taunt");
  });

  it("gains +1/+1 for each other minion on board", () => {
    const lichKing = minion("lich_king");
    const ally1 = makeMinion(3, 3);
    const ally2 = makeMinion(5, 5);

    const r = simulateCombat([lichKing, ally1, ally2], [makeMinion(4, 4)], makeRng(0));

    // 3 minions on left, each Lich King sees 2 others = +2/+2 → 12/12
    const stats = getStartOfCombatStats(r.transcript, lichKing.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(12);
    expect(stats!.hp).toBe(12);
  });

  it("gains +0/+0 when alone on board", () => {
    const lichKing = minion("lich_king");

    const r = simulateCombat([lichKing], [makeMinion(5, 5)], makeRng(0));

    const stats = getStartOfCombatStats(r.transcript, lichKing.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(10);
    expect(stats!.hp).toBe(10);
  });

  it("counts minions from all tribes, not just Undead", () => {
    const lichKing = minion("lich_king");
    const mech = minion("deflect_o_bot");

    const r = simulateCombat([lichKing, mech], [makeMinion(5, 5)], makeRng(0));

    // 1 other minion (mech) = +1/+1 → 11/11
    const stats = getStartOfCombatStats(r.transcript, lichKing.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(11);
    expect(stats!.hp).toBe(11);
  });

  it("works on right side — counts other side's minions", () => {
    const lichKing = minion("lich_king");
    const ally = minion("deflect_o_bot");

    const r = simulateCombat([makeMinion(5, 5)], [lichKing, ally], makeRng(0));

    // 1 other minion on right = +1/+1 → 11/11
    const stats = getStartOfCombatStats(r.transcript, lichKing.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(11);
    expect(stats!.hp).toBe(11);
  });

  it("golden Lich King: double base stats then +1/+1 per other", () => {
    const lichKing = instantiate(getMinion("lich_king"), true);
    // Golden: 20/20 base
    const ally = makeMinion(3, 3);

    const r = simulateCombat([lichKing, ally], [makeMinion(5, 5)], makeRng(0));

    // Golden base: 20/20, +1 for 1 other = 21/21
    const stats = getStartOfCombatStats(r.transcript, lichKing.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(21);
    expect(stats!.hp).toBe(21);
  });
});
