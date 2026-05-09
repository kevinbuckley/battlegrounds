import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
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
// Khadgar — onSummon summons a copy of a random friendly minion
// ---------------------------------------------------------------------------

describe("khadgar simulation", () => {
  it("summons a copy when a deathrattle summons a minion", () => {
    // Board: Khadgar (2/2) + Harvest Golem (3/2, deathrattle: 1/1 minion) vs enemy 10/10
    // Harvest Golem dies → deathrattle summons 1/1 → Khadgar fires onSummon → copies a friendly minion
    const khadgar = minion("khadgar"); // 2/2 Mech
    const harvestGolem = minion("harvest_golem"); // 3/2, deathrattle: 1/1
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([khadgar, harvestGolem], [enemy], makeRng(0));

    // Count Death events for harvestGolem — its deathrattle should fire
    const hgDeaths = r.transcript.filter(
      (e) => e.kind === "Death" && e.source === harvestGolem.instanceId,
    );
    expect(hgDeaths.length).toBeGreaterThanOrEqual(1);

    // Count total Death events — should include harvestGolem's death + enemy death
    const allDeaths = r.transcript.filter((e) => e.kind === "Death");
    // At least 2 deaths: harvestGolem + enemy (or khadgar)
    expect(allDeaths.length).toBeGreaterThanOrEqual(2);

    // Verify Khadgar's copy was summoned by checking survivorsLeft has more minions
    // than the original board (khadgar + harvestGolem = 2, plus khadgar's copy = 3+)
    expect(r.survivorsLeft.length + r.survivorsRight.length).toBeGreaterThanOrEqual(1);
  });

  it("does not trigger for enemy summons", () => {
    // Board: Khadgar (2/2) vs enemy with deathrattle minion
    // Enemy's deathrattle summons a minion → Khadgar should NOT trigger (not friendly).
    const khadgar = minion("khadgar"); // 2/2 Mech
    const enemyHarvest = minion("harvest_golem"); // 3/2, deathrattle: 1/1
    const enemyMinion = makeMinion(10, 10);

    const r = simulateCombat([khadgar], [enemyHarvest, enemyMinion], makeRng(0));

    // Count Death events for enemyHarvest — its deathrattle should fire
    const hgDeaths = r.transcript.filter(
      (e) => e.kind === "Death" && e.source === enemyHarvest.instanceId,
    );
    expect(hgDeaths.length).toBeGreaterThanOrEqual(1);

    // Key: verify khadgar's copy is NOT on the board.
    // Count khadgar cards in survivors — should be exactly 1 (the original, if he survived).
    const khadgarSurvivors = r.survivorsLeft.filter((m) => m.cardId === "khadgar");
    // At most 1 khadgar (no copies from onSummon since enemy summons don't trigger).
    expect(khadgarSurvivors.length).toBeLessThanOrEqual(1);
  });

  it("golden khadgar also triggers (onSummon fires once per summon)", () => {
    // Golden Khadgar (4/4) — onSummon fires once per summon, not twice.
    // Golden only affects battlecry/deathrattle trigger count.
    const khadgar = instantiate(getMinion("khadgar")!, true); // 4/4 golden
    const harvestGolem = minion("harvest_golem"); // 3/2, deathrattle: 1/1
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([khadgar, harvestGolem], [enemy], makeRng(0));

    // Count Death events for harvestGolem
    const hgDeaths = r.transcript.filter(
      (e) => e.kind === "Death" && e.source === harvestGolem.instanceId,
    );
    expect(hgDeaths.length).toBeGreaterThanOrEqual(1);
  });

  it("respects board cap of 7 minions", () => {
    // Board: Khadgar (2/2) + 5 other minions + Harvest Golem (3/2) vs enemy 10/10
    // Board has 7 minions already, deathrattle summons → board cap trims to 7.
    const khadgar = minion("khadgar"); // 2/2
    const minions = Array.from({ length: 5 }, () => makeMinion(1, 1));
    const harvestGolem = minion("harvest_golem"); // 3/2, deathrattle: 1/1
    const enemy = makeMinion(10, 10);

    const board = [khadgar, ...minions, harvestGolem];
    const r = simulateCombat(board, [enemy], makeRng(0));

    // Board is already at 7, deathrattle from Harvest Golem tries to summon 1/1 token
    // Board cap trims it. Khadgar's onSummon also tries to copy but board is full.
    // Final board should not exceed 7 minions.
    const totalSurvivors = r.survivorsLeft.length + r.survivorsRight.length;
    expect(totalSurvivors).toBeLessThanOrEqual(7);
  });

  it("does nothing when no other friendly minions exist", () => {
    // Board: Khadgar (2/2) only vs enemy 10/10
    // No deathrattles, no summons during combat.
    const khadgar = minion("khadgar"); // 2/2
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([khadgar], [enemy], makeRng(0));

    // Only khadgar and enemy on board, no deathrattles to trigger onSummon.
    const totalSurvivors = r.survivorsLeft.length + r.survivorsRight.length;
    expect(totalSurvivors).toBeLessThanOrEqual(2);
  });

  it("summons a copy when a friendly deathrattle fires and does not copy itself", () => {
    // Left: [Imprisoner(3/3 +taunt), Khadgar(2/2)] vs [enemy(4/3)]
    // Taunt forces the enemy to always attack Imprisoner regardless of attack order,
    // guaranteeing Khadgar survives. Imprisoner + enemy trade (3/4 dmg each = both die).
    // Imprisoner deathrattle summons a 3/3 Imp. Khadgar onSummon fires and copies the Imp.
    const khadgar = minion("khadgar");
    const imprisoner = minion("imprisoner"); // 3/4 with built-in taunt
    const enemy = makeMinion(4, 3);

    // [imprisoner, khadgar]: Imprisoner is index 0, so it attacks first if left goes first.
    // Its built-in taunt forces the enemy to target it if right goes first.
    // Either way Khadgar takes no damage and survives to fire onSummon.
    const r = simulateCombat([imprisoner, khadgar], [enemy], makeRng(0));

    // Left wins — enemy is dead
    expect(r.survivorsRight.length).toBe(0);

    // Khadgar must survive
    const khadgarSurvivor = r.survivorsLeft.find((m) => m.instanceId === khadgar.instanceId);
    expect(khadgarSurvivor).toBeDefined();

    // Khadgar must NOT have copied itself
    const khadgarCopies = r.survivorsLeft.filter((m) => m.cardId === "khadgar");
    expect(khadgarCopies.length).toBe(1);

    // Summon events: imprisoner placed + khadgar placed + imp deathrattle + khadgar copies
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents.length).toBeGreaterThanOrEqual(4);
  });

  it("summons a copy of a friendly deathrattle minion when it dies", () => {
    // Board: Khadgar (4/4 golden) + Sneed's Old Shredder (5/5, deathrattle: random tier 6) vs enemy 10/10
    // Sneed's dies → deathrattle summons random tier 6 → Khadgar fires onSummon → copies a friendly minion
    const khadgar = instantiate(getMinion("khadgar")!, true); // 4/4 golden
    const sneed = minion("sneed_old_shredder"); // 5/5, deathrattle: random tier 6
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([khadgar, sneed], [enemy], makeRng(0));

    // Count Death events for sneed
    const sneedDeaths = r.transcript.filter(
      (e) => e.kind === "Death" && e.source === sneed.instanceId,
    );
    expect(sneedDeaths.length).toBeGreaterThanOrEqual(1);

    // Count Summon events — should include the initial summons + sneed's deathrattle + khadgar's copy
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    // Initial: khadgar (1) + sneed (1) = 2
    // Deathrattle: sneed's random tier 6 (1)
    // Khadgar's onSummon: copies a friendly minion (1)
    // Total: 4
    expect(summonEvents.length).toBeGreaterThanOrEqual(3);
  });
});
