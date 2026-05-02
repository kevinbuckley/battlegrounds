import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { CombatEvent } from "@/game/types";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  return instantiate(getMinion(id));
}

/**
 * Replace raw instance IDs (e.g. "m47") with stable relative labels ("x1", "x2", …)
 * so snapshots are deterministic regardless of the global instantiate() counter.
 */
function normalizeTranscript(transcript: CombatEvent[]): unknown[] {
  const map = new Map<string, string>();
  let n = 0;
  const norm = (id: string) => {
    if (!map.has(id)) map.set(id, `x${++n}`);
    return map.get(id)!;
  };
  return transcript.map((e) => {
    switch (e.kind) {
      case "Attack":
        return { ...e, attacker: norm(e.attacker), target: norm(e.target) };
      case "Damage":
        return { ...e, target: norm(e.target) };
      case "DivineShield":
        return { ...e, target: norm(e.target) };
      case "Death":
        return { ...e, source: norm(e.source) };
      case "Stat":
        return { ...e, target: norm(e.target) };
      case "StartOfCombat":
        return { ...e, source: norm(e.source) };
      case "Summon":
        return e;
      case "End":
        return e;
    }
  });
}

describe("vanilla combat snapshots", () => {
  it("1v1: murloc_tidehunter (2/1) vs wrath_weaver (1/3)", () => {
    const result = simulateCombat(
      [m("murloc_tidehunter")],
      [m("wrath_weaver")],
      makeRng(1),
      undefined,
      1,
    );
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("2v2: tidecaller+tidehunter vs dragonspawn+alley_cat (seed 42)", () => {
    const left = [m("murloc_tidecaller"), m("murloc_tidehunter")];
    const right = [m("dragonspawn_lieutenant"), m("alley_cat")];
    const result = simulateCombat(left, right, makeRng(42), undefined, 1);
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("3v1: three 1/1s vs one 1/3 (seed 7)", () => {
    const tidecallers = [m("murloc_tidecaller"), m("murloc_tidecaller"), m("murloc_tidecaller")];
    const result = simulateCombat(tidecallers, [m("wrath_weaver")], makeRng(7), undefined, 1);
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("tier2 brawl: glyph_guardian+metaltooth vs unstable_ghoul+scavenging_hyena (seed 99)", () => {
    const left = [m("glyph_guardian"), m("metaltooth_leaper")];
    const right = [m("unstable_ghoul"), m("scavenging_hyena")];
    const result = simulateCombat(left, right, makeRng(99), undefined, 1);
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("selfless_hero survives a big hit (seed 1)", () => {
    const result = simulateCombat(
      [m("selfless_hero"), m("glyph_guardian")],
      [m("metaltooth_leaper")],
      makeRng(1),
      undefined,
      1,
    );
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("poisonous minion kills target on attack", () => {
    const result = simulateCombat(
      [m("murloc_tidehunter")],
      [m("wrath_weaver")],
      makeRng(1),
      undefined,
      1,
    );
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("2v2: tidecaller+tidehunter vs dragonspawn+alley_cat (seed 42)", () => {
    const left = [m("murloc_tidecaller"), m("murloc_tidehunter")];
    const right = [m("dragonspawn_lieutenant"), m("alley_cat")];
    const result = simulateCombat(left, right, makeRng(42), undefined, 1);
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("3v1: three 1/1s vs one 1/3 (seed 7)", () => {
    const tidecallers = [m("murloc_tidecaller"), m("murloc_tidecaller"), m("murloc_tidecaller")];
    const result = simulateCombat(tidecallers, [m("wrath_weaver")], makeRng(7), undefined, 1);
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("tier2 brawl: glyph_guardian+metaltooth vs unstable_ghoul+scavenging_hyena (seed 99)", () => {
    const left = [m("glyph_guardian"), m("metaltooth_leaper")],
      right = [m("unstable_ghoul"), m("scavenging_hyena")];
    const result = simulateCombat(left, right, makeRng(99), undefined, 1);
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("selfless_hero survives a big hit (seed 1)", () => {
    const result = simulateCombat(
      [m("selfless_hero"), m("glyph_guardian")],
      [m("metaltooth_leaper")],
      makeRng(1),
      undefined,
      1,
    );
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });

  it("poisonous minion kills target on attack", () => {
    const result = simulateCombat(
      [m("murloc_tidehunter")],
      [m("wrath_weaver")],
      makeRng(1),
      undefined,
      1,
    );
    expect(result.winner).toMatchSnapshot();
    expect(normalizeTranscript(result.transcript)).toMatchSnapshot();
  });
});
