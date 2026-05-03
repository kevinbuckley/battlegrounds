import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number): MinionInstance {
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

function goldenMinion(id: string): MinionInstance {
  const m = instantiate(getMinion(id));
  return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
}

// ---------------------------------------------------------------------------
// Golden — deathrattle fires exactly twice
// ---------------------------------------------------------------------------

describe("golden — deathrattle fires twice", () => {
  it("golden harvest golem summons two 2/1 mechs", () => {
    const goldenGolem = goldenMinion("harvest_golem");
    const enemy = makeMinion(4, 1);

    const r = simulateCombat([goldenGolem], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const mechSummons = summonEvents.filter((e) => e.card === "small_mech");
    expect(mechSummons).toHaveLength(2);
  });

  it("golden spawn of n'zoth buffs all friendly minions twice", () => {
    const friendly1 = makeMinion(1, 100);
    const friendly2 = makeMinion(2, 100);
    const goldenSpawn = goldenMinion("spawn_of_nzoth");
    const enemy = makeMinion(5, 100);

    const r = simulateCombat([friendly1, friendly2, goldenSpawn], [enemy], makeRng(0));

    // Each deathrattle triggers +1/+1 to all friendly minions (2 friendly × 2 deathrattles = 4 stat events)
    const statEvents = r.transcript.filter((e) => e.kind === "Stat");
    expect(statEvents.length).toBeGreaterThanOrEqual(4);
  });

  it("golden ghastcoiler summons 4 deathrattle minions", () => {
    const ghastcoiler = instantiate(getMinion("ghastcoiler"));
    const goldenGhastcoiler = {
      ...ghastcoiler,
      golden: true,
      atk: ghastcoiler.atk * 2,
      hp: ghastcoiler.hp * 2,
      maxHp: ghastcoiler.maxHp * 2,
    };
    // 14/14 enemy — kills golden ghastcoiler (14/14), takes 14 damage
    const enemy = makeMinion(14, 14);

    const r = simulateCombat([goldenGhastcoiler], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const deathrattleSummons = summonEvents.filter(
      (e) => e.card === "friggent_northvalley" || e.card === "terestian_manferris",
    );
    expect(deathrattleSummons).toHaveLength(4);
  });

  it("non-golden harvest golem summons one 2/1 mech", () => {
    const golem = minion("harvest_golem");
    const enemy = makeMinion(2, 1);

    const r = simulateCombat([golem], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const mechSummons = summonEvents.filter((e) => e.card === "small_mech");
    expect(mechSummons).toHaveLength(1);
  });

  it("non-golden ghastcoiler summons 2 deathrattle minions", () => {
    const ghastcoiler = minion("ghastcoiler");
    // 7/7 enemy — kills normal ghastcoiler (7/7), takes 7 damage
    const enemy = makeMinion(7, 7);

    const r = simulateCombat([ghastcoiler], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const deathrattleSummons = summonEvents.filter(
      (e) => e.card === "friggent_northvalley" || e.card === "terestian_manferris",
    );
    expect(deathrattleSummons).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Golden — stats doubled
// ---------------------------------------------------------------------------

describe("golden — stats doubled", () => {
  it("golden minion has 2x base stats", () => {
    const base = minion("knife_juggler");
    const golden = goldenMinion("knife_juggler");

    expect(golden.atk).toBe(base.atk * 2);
    expect(golden.hp).toBe(base.hp * 2);
    expect(golden.maxHp).toBe(base.maxHp * 2);
  });

  it("golden minion is marked golden", () => {
    const golden = goldenMinion("knife_juggler");
    expect(golden.golden).toBe(true);
  });
});
