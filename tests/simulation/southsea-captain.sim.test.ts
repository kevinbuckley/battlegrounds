/**
 * Simulation tests for Southsea Captain (M5).
 * Southsea Captain (tier 3 pirate, 3/3) gives all other friendly
 * Pirates +1/+1 at start of combat.
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

function plain(atk: number, hp: number) {
  return instantiate({
    id: `plain_${atk}_${hp}`,
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
// Southsea Captain — +1/+1 aura to friendly Pirates at start of combat
// ---------------------------------------------------------------------------

describe("southsea-captain", () => {
  it("gives friendly Pirates +1/+1 at start of combat", () => {
    const captain = m("southsea_captain"); // 3/3 pirate
    const pirate = m("bloodsail_pirate"); // 1/2 pirate

    const r = simulateCombat([captain, pirate], [plain(10, 1)], makeRng(0));

    // Captain should be dead (3/9 vs 10/1 exchange — 3 HP < 10 ATK)
    const captainSurvivor = r.survivorsLeft.find((m) => m.instanceId === captain.instanceId);
    expect(captainSurvivor).toBeUndefined();

    // The Southsea Captain's hook emits Stat events with buffed values (atk: 2, hp: 3)
    // during start-of-combat. Later Stat events show base values during combat.
    // Check for the buffed Stat event (first one with atk: 2).
    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );
    const pirateStats = statEvents.filter((e) => e.target === pirate.instanceId);
    // Find the buffed Stat event (atk: 2, hp: 3)
    const buffedStat = pirateStats.find((e) => e.atk === 2 && e.hp === 3);
    expect(buffedStat).toBeDefined();
  });

  it("does NOT buff non-Pirates", () => {
    const captain = m("southsea_captain"); // 3/3 pirate
    const murloc = m("murloc_scout"); // 1/1 murloc (not a pirate)

    const r = simulateCombat([captain, murloc], [plain(10, 1)], makeRng(0));

    // Murloc should NOT be buffed by Southsea Captain
    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );
    const murlocStats = statEvents.filter((e) => e.target === murloc.instanceId);
    // Murloc Scout is 1/1 — no Stat event should show buffed stats (atk: 2)
    const buffedMurloc = murlocStats.find((e) => e.atk > 1 || e.hp > 1);
    expect(buffedMurloc).toBeUndefined();
  });

  it("stacks across multiple Southsea Captains", () => {
    const captain1 = m("southsea_captain"); // 3/3 pirate
    const captain2 = m("southsea_captain"); // 3/3 pirate
    const pirate = m("bloodsail_pirate"); // 1/2 pirate

    const r = simulateCombat([captain1, captain2, pirate], [plain(10, 1)], makeRng(0));

    // Bloodsail Pirate starts at 1/2, buffed twice: 1/2 → 2/3 → 3/4
    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );
    const pirateStats = statEvents.filter((e) => e.target === pirate.instanceId);
    // Find the doubly-buffed Stat event (atk: 3, hp: 4)
    const buffedStat = pirateStats.find((e) => e.atk === 3 && e.hp === 4);
    expect(buffedStat).toBeDefined();
  });

  it("golden Southsea Captain also buffs Pirates", () => {
    const captain = m("southsea_captain");
    captain.golden = true;
    const pirate = m("bloodsail_pirate");

    const r = simulateCombat([captain, pirate], [plain(10, 1)], makeRng(0));

    const statEvents = r.transcript.filter(
      (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
    );
    const pirateStats = statEvents.filter((e) => e.target === pirate.instanceId);
    // Find the buffed Stat event (atk: 2, hp: 3)
    const buffedStat = pirateStats.find((e) => e.atk === 2 && e.hp === 3);
    expect(buffedStat).toBeDefined();
  });
});
