/**
 * Simulation tests for Old Murk-Eye aura effect.
 * Old Murk-Eye gives +1 ATK to other friendly Murlocs at start of combat.
 * Unlike Murloc Warleader (+2 ATK to adjacent Murlocs), Old Murk-Eye gives +1 ATK
 * to all other friendly Murlocs, and counts murlocs on BOTH sides of the battlefield.
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
// Old Murk-Eye
// ------------------------------------

describe("old_murk_eye", () => {
  it("gives +1 ATK per other murloc on the battlefield (both sides)", () => {
    const oldMurkEye = m("old_murk_eye"); // 4/1
    const murloc1 = m("murloc_tidehunter"); // 2/1
    const murloc2 = m("murloc_tidecaller"); // 1/1
    const enemy = m("alley_cat"); // 1/1 Beast

    // Board: [murloc_tidehunter, murloc_tidecaller, old_murk_eye] vs [alley_cat]
    // Old Murk-Eye gives +1 ATK to each other friendly murloc (2 murlocs → each gets +1)
    const r = simulateCombat([murloc1, murloc2, oldMurkEye], [enemy], makeRng(0));

    const murloc1Stats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc1.instanceId,
    );
    const murloc2Stats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc2.instanceId,
    );

    expect(murloc1Stats.length).toBeGreaterThan(0);
    if (murloc1Stats[0]?.kind === "Stat") {
      expect(murloc1Stats[0].atk).toBe(3); // 2 + 1 (one +1 buff)
    }
    expect(murloc2Stats.length).toBeGreaterThan(0);
    if (murloc2Stats[0]?.kind === "Stat") {
      expect(murloc2Stats[0].atk).toBe(2); // 1 + 1 (one +1 buff)
    }
  });

  it("counts murlocs on BOTH sides — enemy murlocs also contribute", () => {
    const oldMurkEye = m("old_murk_eye"); // 4/1
    const ourMurloc = m("murloc_tidehunter"); // 2/1
    // Enemy has 2 murlocs
    const enemyMurkEye = m("old_murk_eye"); // 4/1 (enemy)
    const enemyMurloc = m("murloc_tidehunter"); // 2/1 (enemy)

    // Our side: [ourMurloc, oldMurkEye] — 1 other murloc on our side
    // Enemy side: [enemyMurkEye, enemyMurloc] — 2 other murlocs on enemy side
    // Old Murk-Eye gives +1 ATK to each friendly murloc (ourMurloc gets +1)
    const r = simulateCombat([ourMurloc, oldMurkEye], [enemyMurloc, enemyMurkEye], makeRng(0));

    const ourMurlocStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === ourMurloc.instanceId,
    );

    expect(ourMurlocStats.length).toBeGreaterThan(0);
    if (ourMurlocStats[0]?.kind === "Stat") {
      expect(ourMurlocStats[0].atk).toBe(3); // 2 + 1 (one +1 buff)
    }
  });

  it("does NOT buff itself", () => {
    const oldMurkEye = m("old_murk_eye"); // 4/1
    const murloc = m("murloc_tidehunter"); // 2/1
    const enemy = m("alley_cat");

    const r = simulateCombat([murloc, oldMurkEye], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === oldMurkEye.instanceId,
    );
    expect(stats).toHaveLength(0);
  });

  it("only buffs Murlocs, not other tribes", () => {
    const oldMurkEye = m("old_murk_eye");
    const murloc = m("murloc_tidehunter");
    const beast = m("alley_cat");
    const enemy = m("wrath_weaver");

    const r = simulateCombat([murloc, beast, oldMurkEye], [enemy], makeRng(0));

    const beastStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === beast.instanceId,
    );
    const murlocStats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === murloc.instanceId,
    );

    expect(murlocStats.length).toBeGreaterThan(0);
    expect(beastStats).toHaveLength(0);
  });

  it("works with no other murlocs — gives 0 ATK bonus", () => {
    const oldMurkEye = m("old_murk_eye"); // 4/1, no buffs
    const beast = m("alley_cat"); // 1/1
    const enemy = m("wrath_weaver"); // 1/1

    const r = simulateCombat([beast, oldMurkEye], [enemy], makeRng(0));

    const stats = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === oldMurkEye.instanceId,
    );
    expect(stats).toHaveLength(0);
  });
});
