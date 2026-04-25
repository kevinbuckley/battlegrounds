/**
 * Simulation tests for Murloc Warleader aura effect (M5 tribe minions).
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

// ------------------------------------
// Murloc Warleader
// ------------------------------------

describe("murloc_warleader", () => {
  it("gives +2 ATK to all other friendly Murlocs at start of combat", () => {
    const warleader = m("murloc_warleader"); // 3/3
    const murloc1 = m("murloc_tidehunter"); // 2/1 Murloc
    const murloc2 = m("murloc_tidecaller"); // 1/1 Murloc
    const enemy = m("alley_cat"); // 1/1 Beast

    // 3 vs 1 → left attacks first; atk events should show murlocs +2
    const r = simulateCombat([murloc1, murloc2, warleader], [enemy], makeRng(0));

    const murloc1Stats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc1.instanceId,
    );
    const murloc2Stats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc2.instanceId,
    );

    expect(murloc1Stats.length).toBeGreaterThan(0);
    if (murloc1Stats[0]?.kind === "Stat") {
      expect(murloc1Stats[0].atk).toBe(4); // 2 + 2
    }
    expect(murloc2Stats.length).toBeGreaterThan(0);
    if (murloc2Stats[0]?.kind === "Stat") {
      expect(murloc2Stats[0].atk).toBe(3); // 1 + 2
    }
  });

  it("does NOT buff the Warleader itself", () => {
    const warleader = m("murloc_warleader"); // 3/base
    const murloc = m("murloc_tidehunter"); // 2/1
    const enemy = m("alley_cat");

    const r = simulateCombat([murloc, warleader], [enemy], makeRng(0));

    const wlStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === warleader.instanceId,
    );
    // Warleader should have no Stat events (no buff applied)
    expect(wlStats).toHaveLength(0);
  });

  it("only buffs its own side, not the opposing side Murlocs from the other warleader", () => {
    const warleader = m("murloc_warleader"); // 3/3 (our)
    const murloc = m("murloc_tidehunter"); // 2/1 (our)
    const enemyMurlocWarleader = m("murloc_warleader"); // 3/3 (enemy)
    const enemyMurloc = m("murloc_tidehunter"); // 2/1 (enemy)

    // left [murloc, wl] vs right [enemyWL, enemyMurloc]
    // Both warleaders buff their own sides
    const r = simulateCombat([murloc, warleader], [enemyMurloc, enemyMurlocWarleader], makeRng(0));

    const leftMurlocStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc.instanceId,
    );
    const rightMurlocStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === enemyMurloc.instanceId,
    );

    // Our murloc should be buffed by our warleader
    expect(leftMurlocStats.length).toBeGreaterThan(0);
    if (leftMurlocStats[0]?.kind === "Stat") {
      expect(leftMurlocStats[0].atk).toBe(4);
    }
    // Enemy murloc should be buffed by its warleader too
    expect(rightMurlocStats.length).toBeGreaterThan(0);
    if (rightMurlocStats[0]?.kind === "Stat") {
      expect(rightMurlocStats[0].atk).toBe(4);
    }
    // Both sides' murlocs are independently buffed by their respective warleaders
  });

  it("buffs only Murlocs, not other tribes", () => {
    const warleader = m("murloc_warleader");
    const murloc = m("murloc_tidehunter");
    const beast = m("alley_cat");
    const enemy = m("wrath_weaver");

    const r = simulateCombat([murloc, beast, warleader], [enemy], makeRng(0));

    const beastStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === beast.instanceId,
    );
    const murlocStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc.instanceId,
    );

    expect(murlocStats.length).toBeGreaterThan(0);
    expect(beastStats).toHaveLength(0);
  });
});
