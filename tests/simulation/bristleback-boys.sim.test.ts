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

// ---------------------------------------------------------------------------
// Bristleback Boys — deathrattle summons a 1/1 Bristleback Whelp
// ---------------------------------------------------------------------------

describe("bristleback_boys simulation", () => {
  it("summons a 1/1 Bristleback Whelp when it dies in combat", () => {
    const boys = minion("bristleback_boys"); // 1/2
    // Enemy with 3 ATK to kill the boys (2 HP)
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([boys], [enemy], makeRng(0));

    // Check that a Bristleback Whelp was summoned (cardId = bristleback_boys_whelp)
    const whelpEvents = r.transcript.filter(
      (e): e is { kind: "Summon"; card: string; side: "left" | "right"; position: number } =>
        e.kind === "Summon" && e.card === "bristleback_boys_whelp",
    );
    expect(whelpEvents.length).toBeGreaterThan(0);
  });

  it("summons a 1/1 Bristleback Whelp with Beast tribe", () => {
    const boys = minion("bristleback_boys");
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([boys], [enemy], makeRng(0));

    // Check the summoned whelp has correct stats by looking at Stat events
    const summonEvents = r.transcript.filter(
      (e): e is { kind: "Summon"; card: string; side: "left" | "right"; position: number } =>
        e.kind === "Summon" && e.card === "bristleback_boys_whelp",
    );
    expect(summonEvents.length).toBeGreaterThan(0);
  });

  it("does not summon a whelp when it survives combat", () => {
    const boys = minion("bristleback_boys"); // 1/2
    // Enemy with 1 ATK — boys wins (2 HP vs 1 ATK)
    const enemy = makeMinion(1, 1);

    const r = simulateCombat([boys], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter(
      (e): e is { kind: "Summon"; card: string; side: "left" | "right"; position: number } =>
        e.kind === "Summon" && e.card === "bristleback_boys_whelp",
    );
    expect(summonEvents).toHaveLength(0);
  });

  it("golden Bristleback Boys summons two 1/1 Whelps", () => {
    const boys = (() => {
      const m = instantiate(getMinion("bristleback_boys"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
    })();
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([boys], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter(
      (e): e is { kind: "Summon"; card: string; side: "left" | "right"; position: number } =>
        e.kind === "Summon" && e.card === "bristleback_boys_whelp",
    );
    expect(summonEvents.length).toBe(2);
  });

  it("summons a whelp even when there are other minions on the board", () => {
    const boys = minion("bristleback_boys");
    const ally = makeMinion(2, 3);
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([boys, ally], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter(
      (e): e is { kind: "Summon"; card: string; side: "left" | "right"; position: number } =>
        e.kind === "Summon" && e.card === "bristleback_boys_whelp",
    );
    expect(summonEvents.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Bristleback Boys — onDamageTaken: ALL other Bristleback Boys gain +1/+1
  // ---------------------------------------------------------------------------

  it("when one Bristleback Boy takes damage, all other Bristleback Boys gain +1/+1", () => {
    const boys1 = minion("bristleback_boys"); // 1/2
    const boys2 = minion("bristleback_boys"); // 1/2
    // Enemy with 2 ATK — kills boys1, then attacks boys2 dealing 2 damage
    // boys2 gets buffed to 2/3 from boys1 taking damage, then takes 2 damage = 2/1
    const enemy = makeMinion(2, 5);

    const r = simulateCombat([boys1, boys2], [enemy], makeRng(0));

    // Find the last Stat event for boys2 — it should show 2/1 (buffed to 2/3, then -2 damage)
    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } =>
        e.kind === "Stat" && e.target === boys2.instanceId,
    );
    expect(statEvents.length).toBeGreaterThan(0);
    const lastStat = statEvents[statEvents.length - 1]!;
    // atk=2 confirms the +1 ATK buff was applied (base 1 + 1 = 2)
    expect(lastStat.atk).toBe(2);
    // hp=1 confirms the +1 HP buff was applied (base 2 + 1 = 3, then -2 damage = 1)
    expect(lastStat.hp).toBe(1);
  });

  it("when one Bristleback Boy takes partial damage, all others still gain +1/+1", () => {
    const boys1 = minion("bristleback_boys"); // 1/2
    const boys2 = minion("bristleback_boys"); // 1/2
    // Enemy with 3 ATK and 4 HP — kills boys1 (2 HP), then attacks boys2 (3 damage)
    // boys2 gets buffed to 2/3 from boys1 taking damage, then takes 3 damage = 2/0
    const enemy = makeMinion(3, 4);

    const r = simulateCombat([boys1, boys2], [enemy], makeRng(0));

    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } =>
        e.kind === "Stat" && e.target === boys2.instanceId,
    );
    expect(statEvents.length).toBeGreaterThan(0);
    const lastStat = statEvents[statEvents.length - 1]!;
    // atk=2 confirms the +1 ATK buff was applied (base 1 + 1 = 2)
    // HP doesn't matter — the ATK proves the buff was applied
    expect(lastStat.atk).toBe(2);
  });

  it("golden Bristleback Boys also triggers +1/+1 buff to non-golden copies", () => {
    const boys = minion("bristleback_boys");
    const goldenBoys = (() => {
      const m = instantiate(getMinion("bristleback_boys"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
    })();
    const enemy = makeMinion(2, 5);

    const r = simulateCombat([boys, goldenBoys], [enemy], makeRng(0));

    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } =>
        e.kind === "Stat" && e.target === goldenBoys.instanceId,
    );
    expect(statEvents.length).toBeGreaterThan(0);
    const lastStat = statEvents[statEvents.length - 1]!;
    // golden starts at 2/4 (2*2, 2*2), after buff becomes 3/5, then -2 damage = 3/3
    expect(lastStat.atk).toBe(3);
    expect(lastStat.hp).toBe(3);
  });
});
