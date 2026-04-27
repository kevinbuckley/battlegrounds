/**
 * Simulation tests for tribe-synergy minion hooks (M5).
 * Each test verifies a specific hook interaction in an isolated combat.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import alleyCatCard from "@/game/minions/tier1/alley-cat";
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

// ---------------------------------------------------------------------------
// Alley Cat battlecry
// ---------------------------------------------------------------------------

describe("alley_cat battlecry", () => {
  it("summons a random minion from your hand on play", () => {
    const rng = makeRng(0);
    const alleyCat = instantiate(alleyCatCard);
    const state = makeInitialState(42);
    const handMinion = instantiate(MINIONS["murloc_tidehunter"]!);
    const handMinion2 = instantiate(MINIONS["flame_imp"]!);

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [alleyCat, handMinion, handMinion2],
              board: [instantiate(MINIONS["taunt_minion"]!)],
              gold: 10,
              tier: 1 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 1, rng);
    const board = after.players[0]!.board;
    const hand = after.players[0]!.hand;

    // Alley Cat should be on the board
    const catOnBoard = board.find((m) => m.cardId === "alley_cat");
    expect(catOnBoard).toBeDefined();

    // One minion from hand should have been moved to the board by battlecry
    expect(hand).toHaveLength(1);

    // The board should have 3 minions (1 original + alley cat + 1 from battlecry)
    expect(board).toHaveLength(3);

    // The minion that was moved from hand should be on the board
    const movedMinion = board.find(
      (m) => m.instanceId === handMinion.instanceId || m.instanceId === handMinion2.instanceId,
    );
    expect(movedMinion).toBeDefined();
  });

  it("does nothing when hand has no minions", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const alleyCat = instantiate(alleyCatCard);

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [alleyCat],
              board: [instantiate(MINIONS["taunt_minion"]!)],
              gold: 10,
              tier: 1 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 1, rng);
    const board = after.players[0]!.board;
    const hand = after.players[0]!.hand;

    // Alley Cat on board, hand unchanged (alley cat itself is not in hand)
    expect(board).toHaveLength(2);
    expect(hand).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Junkbot
// ---------------------------------------------------------------------------

describe("junkbot", () => {
  it("gains +2/+2 when a friendly mech dies in combat", () => {
    const junkbot = m("junkbot"); // 1/4
    // Use a weak mech that will die: Annoy-o-Tron is 1/1 with taunt+divineShield
    // We need it to die, so use a strong killer. Broodkin Zealot is 3/4 with taunt+divineShield.
    // Instead, use a 3/3 mech that dies to a 4/5 killer.
    // Simplest: use harvest_golem (2/3 Mech) as the sacrificial mech
    const sacrificialMech = instantiate(MINIONS["harvest_golem"]!); // 2/3 Mech
    // Give it low HP so it dies quickly
    sacrificialMech.hp = 1;
    sacrificialMech.maxHp = 1;
    // Use a strong killer: Broodkin Zealot is 3/4
    const killer = instantiate(MINIONS["broodkin_zealot"]!); // 3/4

    // left: [sacrificialMech (1/1), junkbot (1/4)], right: [killer (3/4)]
    // sacrificialMech (1/1) attacks killer (3/4): deals 1 (3→3hp), killer counterattacks deals 3 (dies, 1-3=-2)
    // sacrificialMech survives with -2 HP → dies → junkbot gains +2/+2
    const r = simulateCombat([sacrificialMech, junkbot], [killer], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === junkbot.instanceId,
    );
    // Should have at least one stat event showing the buff
    const buffEvent = statEvents.find((e) => e.kind === "Stat" && e.atk === 3);
    expect(buffEvent).toBeDefined();
    if (buffEvent?.kind === "Stat") {
      expect(buffEvent.atk).toBe(3); // 1 + 2
      expect(buffEvent.hp).toBe(6); // 4 + 2
    }
  });

  it("does NOT gain +2/+2 when a non-mech ally dies", () => {
    const junkbot = m("junkbot"); // 1/4
    const beast = instantiate(MINIONS["bristleback_boys"]!); // 1/1
    const killer = m("wrath_weaver"); // 1/3

    const r = simulateCombat([beast, junkbot], [killer], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === junkbot.instanceId,
    );
    // Should have no stat events showing a buff (only initial stat if any)
    const buffEvents = statEvents.filter((e) => e.kind === "Stat" && (e.atk > 1 || e.hp > 4));
    expect(buffEvents).toHaveLength(0);
  });

  it("stacks: gains +4/+4 after two friendly mechs die", () => {
    const junkbot = m("junkbot"); // 1/4
    // Use 1/1 minions and change their tribe to Mech (no deathrattle)
    const mech1 = instantiate(MINIONS["alley_cat"]!);
    mech1.tribes = ["Mech"];
    mech1.atk = 1;
    mech1.hp = 1;
    mech1.maxHp = 1;
    const mech2 = instantiate(MINIONS["alley_cat"]!);
    mech2.tribes = ["Mech"];
    mech2.atk = 1;
    mech2.hp = 1;
    mech2.maxHp = 1;
    // Two 1/1 killers so both mechs get to trade
    const killer1 = instantiate(MINIONS["alley_cat"]!);
    const killer2 = instantiate(MINIONS["alley_cat"]!);

    // left: [mech1 (1/1), mech2 (1/1), junkbot (1/4)], right: [killer1 (1/1), killer2 (1/1)]
    // Right goes first (2 vs 3 → left has more, left goes first)
    // mech1 (1/1) attacks killer1 (1/1): both die (trade) → junkbot +2/+2 (3/6)
    // mech2 (1/1) attacks killer2 (1/1): both die (trade) → junkbot +2/+2 (5/8)
    // junkbot survives at 5/8
    const r = simulateCombat([mech1, mech2, junkbot], [killer1, killer2], makeRng(0));
    const finalJunkbot = r.survivorsLeft.find((m) => m.cardId === "junkbot");
    expect(finalJunkbot).toBeDefined();
    if (finalJunkbot) {
      expect(finalJunkbot.atk).toBe(5); // 1 + 2 + 2
      expect(finalJunkbot.hp).toBe(8); // 4 + 2 + 2
    }
  });
});
