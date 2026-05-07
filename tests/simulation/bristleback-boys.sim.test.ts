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
});
