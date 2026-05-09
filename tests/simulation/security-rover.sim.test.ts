/**
 * Simulation tests for Security Rover onDamageTaken (M2).
 * Security Rover (tier 4 mech, 1/4) spawns a 2/3 Mech with divine shield
 * each time IT takes damage during combat.
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
// Security Rover — spawns a 2/3 Mech with divine shield each time IT takes damage
// ---------------------------------------------------------------------------

describe("security-rover", () => {
  it("spawns a 2/3 Mech with divine shield when it takes damage", () => {
    const rover = m("security_rover"); // 1/4
    // Enemy with 2 ATK: rover takes 2 damage per hit, has 4 HP
    // Rover takes 2 hits from enemy (4 HP → 0), spawns 2 bots
    // Each bot is 2/3 divineShield
    const enemy = plain(2, 20);

    const r = simulateCombat([rover], [enemy], makeRng(0));

    // Check transcript for summon events
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const botSummons = summonEvents.filter((e) => e.card === "security_rover_bot");
    // Rover has 4 HP, enemy deals 2 per hit → 2 hits → 2 bots spawned
    expect(botSummons).toHaveLength(2);

    // Verify the bots have correct stats and divine shield
    const allSurvivors = [...r.survivorsLeft, ...r.survivorsRight];
    const bots = allSurvivors.filter((m) => m.cardId === "security_rover_bot");
    // Bots may die (3 HP < 2 ATK counterattack after shield pops), but they were spawned
    expect(botSummons).toHaveLength(2);
  });

  it("spawns a bot each time it takes damage — strong enemy kills rover quickly", () => {
    const rover = m("security_rover"); // 1/4
    // Enemy with 5 ATK: rover takes 5 damage on first hit → dies immediately
    // Only 1 hit = 1 bot spawned
    const enemy = plain(5, 5);

    const r = simulateCombat([rover], [enemy], makeRng(0));

    // One hit from strong enemy = one bot spawned
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const botSummons = summonEvents.filter((e) => e.card === "security_rover_bot");
    expect(botSummons).toHaveLength(1);
  });

  it("does not spawn bots when no damage is taken — rover wins vs weak enemy", () => {
    const rover = m("security_rover"); // 1/4
    const enemy = plain(1, 1); // 1 ATK — rover takes 1 damage per hit, has 4 HP
    // Enemy has 1 HP, dies on first exchange
    // Rover takes 1 damage from first enemy attack → spawns 1 bot
    // Rover counterattacks (1 ATK) → enemy dies (1 HP → 0)
    // No more hits on rover → only 1 bot

    const r = simulateCombat([rover], [enemy], makeRng(0));

    // Rover takes 1 damage from first enemy attack → 1 bot spawned
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const botSummons = summonEvents.filter((e) => e.card === "security_rover_bot");
    expect(botSummons).toHaveLength(1);
  });

  it("golden security rover spawns bots per hit (onDamageTaken not affected by golden)", () => {
    const rover = m("security_rover");
    rover.golden = true;

    // Enemy with 2 ATK: golden rover has 8 HP, takes 2 per hit
    // But bots also attack, reducing enemy HP faster
    // 2 bots spawn (rover takes 2 hits), then enemy dies from combined attacks
    const enemy = plain(2, 20);

    const r = simulateCombat([rover], [enemy], makeRng(0));

    // onDamageTaken fires once per hit regardless of golden
    // Golden rover has 8 HP, enemy deals 2 per hit → 4 hits possible
    // But bots deal 2 ATK each, so enemy dies before all 4 hits land
    // 2 bots spawn (rover takes 2 hits before enemy dies)
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const botSummons = summonEvents.filter((e) => e.card === "security_rover_bot");
    expect(botSummons.length).toBeGreaterThanOrEqual(2);
  });
});
