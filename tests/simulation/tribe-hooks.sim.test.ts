/**
 * Simulation tests for tribe-synergy minion hooks (M5).
 * Each test verifies a specific hook interaction in an isolated combat.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

// ---------------------------------------------------------------------------
// Scavenging Hyena
// ---------------------------------------------------------------------------

describe("scavenging_hyena", () => {
  it("gains +2/+1 when a friendly beast dies", () => {
    // cat is left[0] so it attacks and dies first, triggering hyena's buff.
    const hyena = m("scavenging_hyena"); // 2/1
    const cat = m("alley_cat"); // 1/1 Beast
    const killer = m("wrath_weaver"); // 1/3 — will survive long enough

    // 2 left vs 1 right → left attacks first; cat[0] attacks and dies
    const r = simulateCombat([cat, hyena], [killer], makeRng(0));
    const statEvent = r.transcript.find((e) => e.kind === "Stat" && e.target === hyena.instanceId);
    expect(statEvent).toBeDefined();
    if (statEvent?.kind !== "Stat") return;
    expect(statEvent.atk).toBe(4); // 2 + 2
    expect(statEvent.hp).toBe(2); // 1 + 1
  });

  it("does NOT trigger when a non-beast ally dies", () => {
    const hyena = m("scavenging_hyena");
    const neutral = m("wrath_weaver"); // not a Beast
    const killer = m("murloc_tidehunter"); // 2/1

    const r = simulateCombat([hyena, neutral], [killer], makeRng(0));
    const hyenaStatEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === hyena.instanceId,
    );
    // Neutral dying should NOT buff hyena
    const beastDeaths = r.transcript.filter(
      (e) => e.kind === "Death" && r.survivorsLeft.every((s) => s.instanceId !== e.source) && true,
    );
    void beastDeaths;
    expect(hyenaStatEvents).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Murloc Tidecaller
// ---------------------------------------------------------------------------

describe("murloc_tidecaller", () => {
  it("gains +1 ATK when a murloc with reborn is summoned", () => {
    const tidecaller = m("murloc_tidecaller"); // 1/1
    // Use a reborn murloc: murloc_tidehunter (2/1, Murloc) + reborn keyword manually
    const reborn = instantiate(MINIONS["murloc_tidehunter"]!);
    reborn.keywords.add("reborn");

    const killer = m("wrath_weaver"); // 1/3

    // reborn is left[0] so it attacks and dies first, summoning a Murloc ghost
    // → tidecaller (left[1]) gains +1 ATK from onSummon
    const r = simulateCombat([reborn, tidecaller], [killer], makeRng(0));
    const statEvent = r.transcript.find(
      (e) => e.kind === "Stat" && e.target === tidecaller.instanceId,
    );
    expect(statEvent).toBeDefined();
    if (statEvent?.kind !== "Stat") return;
    expect(statEvent.atk).toBe(2); // 1 + 1
  });
});

// ---------------------------------------------------------------------------
// Glyph Guardian
// ---------------------------------------------------------------------------

describe("glyph_guardian", () => {
  it("doubles its ATK each time it attacks", () => {
    const glyph = m("glyph_guardian"); // 2/4
    const dummy = m("wrath_weaver"); // 1/3

    // 1v1 with 2v1 giving left first attack... let's just use 2v1
    const r = simulateCombat([glyph, m("alley_cat")], [dummy], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === glyph.instanceId,
    );
    // After first attack: atk becomes 4
    expect(statEvents.length).toBeGreaterThanOrEqual(1);
    if (statEvents[0]?.kind === "Stat") {
      expect(statEvents[0].atk).toBe(4); // 2 * 2
    }
  });
});

// ---------------------------------------------------------------------------
// Unstable Ghoul
// ---------------------------------------------------------------------------

describe("unstable_ghoul", () => {
  it("deals 1 damage to all minions when it dies", () => {
    const ghoul = m("unstable_ghoul"); // 1/3 taunt
    const enemy = m("alley_cat"); // 1/1 — dies from the splash

    // Give left 2 minions so it attacks first; ghoul is killed, splash hits enemy
    const survivor = m("wrath_weaver"); // 1/3 — on right, takes 1 dmg from splash
    const leftAttacker = m("murloc_tidehunter"); // 2/1

    // left: [leftAttacker (2/1)], right: [ghoul (1/3, taunt), survivor (1/3)]
    // left attacks first (1v2 → right has more, right attacks first)
    // Hmm, need left to have more. Let's use 3 vs 2.
    const r = simulateCombat(
      [leftAttacker, m("wrath_weaver"), m("wrath_weaver")],
      [ghoul, enemy],
      makeRng(0),
    );
    // When ghoul dies it damages all remaining minions for 1
    const ghoulDeath = r.transcript.findIndex(
      (e) => e.kind === "Death" && e.source === ghoul.instanceId,
    );
    expect(ghoulDeath).toBeGreaterThan(-1);
    // After ghoul death, expect Damage events for all minions
    const afterDeath = r.transcript.slice(ghoulDeath + 1);
    const splashDamage = afterDeath.filter((e) => e.kind === "Damage" && e.amount === 1);
    expect(splashDamage.length).toBeGreaterThan(0);
  });

  it("deathrattle chain: minions killed by splash get their own deaths processed", () => {
    const ghoul = m("unstable_ghoul"); // 1/3 taunt
    const fragile = m("alley_cat"); // 1/1 — dies from splash

    const leftAttacker = m("murloc_tidehunter"); // 2/1

    // 3 left vs 2 right so left goes first; left kills ghoul; splash kills fragile
    const r = simulateCombat(
      [leftAttacker, m("wrath_weaver"), m("wrath_weaver")],
      [ghoul, fragile],
      makeRng(0),
    );
    const deaths = r.transcript.filter((e) => e.kind === "Death");
    // ghoul AND fragile (killed by splash) should both have Death events
    const fragileDeathCount = deaths.filter(
      (e) => e.kind === "Death" && e.source === fragile.instanceId,
    ).length;
    expect(fragileDeathCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Selfless Hero
// ---------------------------------------------------------------------------

describe("selfless_hero", () => {
  it("grants divine shield to a random friendly minion on death", () => {
    const hero = m("selfless_hero"); // 2/1
    const ally = m("wrath_weaver"); // 1/3 — should receive divine shield

    const killer = m("murloc_tidehunter"); // 2/1 — kills the hero

    // 2 left vs 1 right → left attacks first
    // hero (2/1) attacks killer (2/1); hero and killer trade; ally gets divine shield
    const r = simulateCombat([hero, ally], [killer], makeRng(0));
    const statAfterHeroDeath = r.transcript.find(
      (e) => e.kind === "Stat" && e.target === ally.instanceId,
    );
    expect(statAfterHeroDeath).toBeDefined();
    // Check ally survived with divine shield
    const allyInSurvivors = r.survivorsLeft.find((m) => m.instanceId === ally.instanceId);
    expect(allyInSurvivors?.keywords.has("divineShield")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Metaltooth Leaper battlecry
// ---------------------------------------------------------------------------

describe("metaltooth_leaper battlecry", () => {
  it("gives +2 ATK to all other friendly mechs on play", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const leaper = instantiate(MINIONS["metaltooth_leaper"]!);
    const mech = instantiate(MINIONS["metaltooth_leaper"]!); // another mech
    const nonMech = instantiate(MINIONS["wrath_weaver"]!);

    // Put mech and nonMech on board, then play leaper
    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [leaper], board: [mech, nonMech], gold: 10, tier: 2 as const } : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 2, rng);
    const board = after.players[0]!.board;
    const mechOnBoard = board.find((m) => m.instanceId === mech.instanceId)!;
    const nonMechOnBoard = board.find((m) => m.instanceId === nonMech.instanceId)!;
    const leaperOnBoard = board.find((m) => m.instanceId === leaper.instanceId)!;

    expect(mechOnBoard.atk).toBe(mech.atk + 2); // buffed
    expect(nonMechOnBoard.atk).toBe(nonMech.atk); // not buffed
    expect(leaperOnBoard.atk).toBe(leaper.atk); // self not buffed
  });
});
