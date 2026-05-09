/**
 * Simulation tests for Infested Wolf deathrattle (M5).
 * Infested Wolf (tier 3 beast, 3/3) summons two 1/1 Spiders when it dies
 * in combat (respecting board cap).
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
// Infested Wolf — deathrattle summons two 1/1 Spiders
// ---------------------------------------------------------------------------

describe("infested_wolf", () => {
  it("summons two 1/1 Spiders when it dies", () => {
    const wolf = m("infested_wolf"); // 3/3
    const enemy = plain(5, 5); // strong enemy so wolf dies

    const r = simulateCombat([wolf], [enemy], makeRng(0));

    // Count Summon events for spider_token
    const spiderSummons = r.transcript.filter(
      (e) => e.kind === "Summon" && e.card === "spider_token",
    );
    expect(spiderSummons).toHaveLength(2);
  });

  it("summons spiders even when Infested Wolf dies to a weak enemy", () => {
    const wolf = m("infested_wolf"); // 3/3
    const enemy = plain(3, 3); // equal strength — wolf dies

    const r = simulateCombat([wolf], [enemy], makeRng(0));

    const spiderSummons = r.transcript.filter(
      (e) => e.kind === "Summon" && e.card === "spider_token",
    );
    expect(spiderSummons).toHaveLength(2);

    // Enemy should also die (3 damage from wolf + 2 from spiders = 5 total)
    const enemySurvivor = r.survivorsRight.find((m) => m.instanceId === enemy.instanceId);
    expect(enemySurvivor).toBeUndefined();
  });

  it("does not summon spiders when Infested Wolf survives combat", () => {
    const wolf = m("infested_wolf"); // 3/3
    const enemy = plain(1, 1); // weak enemy — wolf wins

    const r = simulateCombat([wolf], [enemy], makeRng(0));

    const spiderSummons = r.transcript.filter(
      (e) => e.kind === "Summon" && e.card === "spider_token",
    );
    expect(spiderSummons).toHaveLength(0);
  });

  it("respects board cap — summons fewer spiders when board is full", () => {
    const wolf = m("infested_wolf"); // 3/3
    // Fill board: 7 existing minions + wolf = 8, deathrattle gets 0 slots
    const allies = [
      wolf,
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
      plain(1, 1),
    ];
    const enemy = plain(1, 1);

    const r = simulateCombat(allies, [enemy], makeRng(0));

    const spiderSummons = r.transcript.filter(
      (e) => e.kind === "Summon" && e.card === "spider_token",
    );
    // Board cap = 7, wolf dies leaving 7, 0 slots for spiders
    expect(spiderSummons).toHaveLength(0);
  });
});
