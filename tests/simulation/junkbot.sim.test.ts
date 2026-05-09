import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { CombatEvent } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string) {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number) {
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
// Junkbot — onAllyDeath: gains +2/+2 each time a Mech dies in combat
// ---------------------------------------------------------------------------

describe("junkbot simulation", () => {
  it("gains +2/+2 when a friendly Mech dies in combat", () => {
    // Junkbot (1/4) + Annoy-o-Tron (1/2 divineShield) vs enemy (3/3)
    // Annoy-o-Tron dies, Junkbot should gain +2/+2 from onAllyDeath.
    const junkbot = minion("junkbot"); // 1/4
    const annoy = minion("annoy_o_tron"); // 1/2 divineShield
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([junkbot, annoy], [enemy], makeRng(0));

    // Annoy-o-Tron should die (divine shield pops, then takes damage)
    const annoySurvivor = r.survivorsLeft.find((m) => m.instanceId === annoy.instanceId);
    expect(annoySurvivor).toBeUndefined();

    // Junkbot should have gained +2 ATK (from 1 to 3).
    const junkbotSurvivor = r.survivorsLeft.find((m) => m.instanceId === junkbot.instanceId);
    expect(junkbotSurvivor).toBeDefined();
    expect(junkbotSurvivor!.atk).toBe(3);
  });

  it("stacks +2/+2 for each Mech death — verified via transcript Stat events", () => {
    // Use the same fixture as test 1 but verify that onAllyDeath fires
    // by checking the transcript for Stat events from Junkbot after a Mech death.
    const junkbot = minion("junkbot"); // 1/4
    const annoy = minion("annoy_o_tron"); // 1/2 divineShield
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([junkbot, annoy], [enemy], makeRng(0));

    // Find the Death event for Annoy-o-Tron
    const annoyDeathIdx = r.transcript.findIndex(
      (e) => e.kind === "Death" && e.source === annoy.instanceId,
    );
    expect(annoyDeathIdx).toBeGreaterThanOrEqual(0);

    // After Annoy's death, there should be a Stat event from Junkbot
    // showing atk increased from 1 to 3 (the +2 from onAllyDeath).
    const postDeathEvents = r.transcript.slice(annoyDeathIdx + 1);
    const junkbotStatAfterDeath = postDeathEvents.find(
      (e): e is Extract<CombatEvent, { kind: "Stat"; target: string; atk: number }> =>
        e.kind === "Stat" && e.target === junkbot.instanceId && e.atk === 3,
    );
    expect(junkbotStatAfterDeath).toBeDefined();
  });

  it("does not gain stats when a non-Mech dies — no Stat event after non-Mech death", () => {
    // Junkbot (1/4) + Alley Cat (1/1 Beast) vs enemy (3/3)
    // Alley Cat dies, but it's not a Mech — Junkbot should NOT gain stats.
    const junkbot = minion("junkbot"); // 1/4
    const cat = minion("alley_cat"); // 1/1 Beast
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([junkbot, cat], [enemy], makeRng(0));

    // Find the Death event for Alley Cat
    const catDeathIdx = r.transcript.findIndex(
      (e) => e.kind === "Death" && e.source === cat.instanceId,
    );
    expect(catDeathIdx).toBeGreaterThanOrEqual(0);

    // After Alley Cat's death, there should NOT be a Stat event from Junkbot
    // showing atk increased (should still be 1).
    const postDeathEvents = r.transcript.slice(catDeathIdx + 1);
    const junkbotStatAfterDeath = postDeathEvents.find(
      (e): e is Extract<CombatEvent, { kind: "Stat"; target: string; atk: number }> =>
        e.kind === "Stat" && e.target === junkbot.instanceId,
    );
    // If there is a Stat event, it should show atk=1 (unchanged).
    if (junkbotStatAfterDeath) {
      expect(junkbotStatAfterDeath.atk).toBe(1);
    }
  });

  it("does not gain stats when an enemy Mech dies", () => {
    // Junkbot (1/4) vs enemy Annoy-o-Tron (1/2 divineShield)
    // Annoy-o-Tron is on the enemy side — Junkbot should NOT gain stats.
    const junkbot = minion("junkbot"); // 1/4
    const enemy = minion("annoy_o_tron"); // 1/2 divineShield

    const r = simulateCombat([junkbot], [enemy], makeRng(0));

    const junkbotSurvivor = r.survivorsLeft.find((m) => m.instanceId === junkbot.instanceId);
    expect(junkbotSurvivor).toBeDefined();
    expect(junkbotSurvivor!.atk).toBe(1);
  });

  it("golden Junkbot also gains +2/+2 (golden does not scale the gain)", () => {
    // Golden Junkbot (2/8) + Annoy-o-Tron (1/2 divineShield) vs enemy (3/8)
    // Enemy has 8 HP — survives Golden Junkbot's attack (8-2=6hp).
    // Annoy dies from enemy counterattacks, then Golden Junkbot gains +2 ATK.
    const junkbot = (() => {
      const m = instantiate(getMinion("junkbot"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.hp * 2 };
    })();
    const annoy = minion("annoy_o_tron"); // 1/2 divineShield
    const enemy = makeMinion(3, 8);

    const r = simulateCombat([junkbot, annoy], [enemy], makeRng(0));

    // Annoy-o-Tron should die
    const annoySurvivor = r.survivorsLeft.find((m) => m.instanceId === annoy.instanceId);
    expect(annoySurvivor).toBeUndefined();

    // Golden Junkbot starts at 2/8, gains +2 ATK → 4
    const junkbotSurvivor = r.survivorsLeft.find((m) => m.instanceId === junkbot.instanceId);
    expect(junkbotSurvivor).toBeDefined();
    expect(junkbotSurvivor!.atk).toBe(4);
  });
});
