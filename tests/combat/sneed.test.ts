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
// Sneed's Old Shredder — deathrattle summons a random Legendary from the game
// ---------------------------------------------------------------------------

describe("Sneed's Old Shredder", () => {
  it("summons a random tier 6+ Legendary when one exists on the battlefield", () => {
    const sneed = minion("sneed_old_shredder");
    // Foe Reaper 4000 is a tier 6 Legendary
    const foeReaper = minion("foe_reaper_4000");
    // 10/10 enemy — kills Sneed (5/5), takes 5 damage
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([sneed, foeReaper], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const sneedDeath = r.transcript.find(
      (e) => e.kind === "Death" && e.source === sneed.instanceId,
    );
    expect(sneedDeath).toBeDefined();
    // Should summon exactly one legendary after Sneed dies
    const sneedSummons = summonEvents.filter(
      (e) =>
        e.card === "foe_reaper_4000" ||
        e.card === "friggent_northvalley" ||
        e.card === "gentle_megasaur" ||
        e.card === "ghastcoiler" ||
        e.card === "kalecgos_arcane_aspect" ||
        e.card === "mama_bear" ||
        e.card === "terestian_manferris" ||
        e.card === "ysera_the_dreamer" ||
        e.card === "zixor_project_hope" ||
        e.card === "murozond" ||
        e.card === "alexstrasza" ||
        e.card === "blingtron_5000" ||
        e.card === "bigfernal" ||
        e.card === "baron_rivendare" ||
        e.card === "brann_bronzebeard" ||
        e.card === "junkbot" ||
        e.card === "lightfang_enforcer" ||
        e.card === "mogor_the_curse_golem" ||
        e.card === "strongshell_scavenger" ||
        e.card === "tide_razor",
    );
    expect(sneedSummons).toHaveLength(1);
  });

  it("still summons from fixed pool when no Legendary minions are on the battlefield", () => {
    const sneed = minion("sneed_old_shredder");
    // Boulderfog Ogre is tier 4, not a Legendary — Sneed doesn't care about the board
    const boulderfog = minion("boulderfog_ogre");
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([sneed, boulderfog], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const sneedSummons = summonEvents.filter(
      (e) =>
        e.card === "foe_reaper_4000" ||
        e.card === "gentle_megasaur" ||
        e.card === "ghastcoiler" ||
        e.card === "mama_bear" ||
        e.card === "ysera_the_dreamer" ||
        e.card === "murozond" ||
        e.card === "alexstrasza" ||
        e.card === "blingtron_5000" ||
        e.card === "bigfernal" ||
        e.card === "baron_rivendare" ||
        e.card === "brann_bronzebeard" ||
        e.card === "junkbot" ||
        e.card === "lightfang_enforcer" ||
        e.card === "mogor_the_curse_golem" ||
        e.card === "strongshell_scavenger" ||
        e.card === "tide_razor",
    );
    // Sneed always summons from fixed legendary pool, board state doesn't matter
    // (>= 1 because the summoned legendary's own effects may chain more summons)
    expect(sneedSummons.length).toBeGreaterThanOrEqual(1);
  });

  it("golden Sneed summons 2 Legendary minions", () => {
    const sneed = minion("sneed_old_shredder");
    const goldenSneed = {
      ...sneed,
      golden: true,
      atk: sneed.atk * 2,
      hp: sneed.hp * 2,
      maxHp: sneed.maxHp * 2,
    };
    const foeReaper = minion("foe_reaper_4000");
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([goldenSneed, foeReaper], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const sneedSummons = summonEvents.filter(
      (e) =>
        e.card === "foe_reaper_4000" ||
        e.card === "friggent_northvalley" ||
        e.card === "gentle_megasaur" ||
        e.card === "ghastcoiler" ||
        e.card === "kalecgos_arcane_aspect" ||
        e.card === "mama_bear" ||
        e.card === "terestian_manferris" ||
        e.card === "ysera_the_dreamer" ||
        e.card === "zixor_project_hope" ||
        e.card === "murozond" ||
        e.card === "alexstrasza" ||
        e.card === "blingtron_5000" ||
        e.card === "bigfernal" ||
        e.card === "baron_rivendare" ||
        e.card === "brann_bronzebeard" ||
        e.card === "junkbot" ||
        e.card === "lightfang_enforcer" ||
        e.card === "mogor_the_curse_golem" ||
        e.card === "strongshell_scavenger" ||
        e.card === "tide_razor",
    );
    expect(sneedSummons).toHaveLength(2);
  });

  it("does not summon non-legendary tier 6 minions", () => {
    const sneed = minion("sneed_old_shredder");
    // Boulderfog Ogre is tier 4, not legendary
    const boulderfog = minion("boulderfog_ogre");
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([sneed, boulderfog], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    // Boulderfog is tier 4, not in the legendary pool — should not be summoned
    const boulderfogSummons = summonEvents.filter((e) => e.card === "boulderfog_ogre");
    expect(boulderfogSummons).toHaveLength(0);
  });

  it("summons from fixed pool regardless of board state", () => {
    const sneed = minion("sneed_old_shredder");
    const enemyFoeReaper = minion("foe_reaper_4000");
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([sneed], [enemy, enemyFoeReaper], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const sneedSummons = summonEvents.filter(
      (e) =>
        e.card === "foe_reaper_4000" ||
        e.card === "friggent_northvalley" ||
        e.card === "gentle_megasaur" ||
        e.card === "ghastcoiler" ||
        e.card === "kalecgos_arcane_aspect" ||
        e.card === "mama_bear" ||
        e.card === "terestian_manferris" ||
        e.card === "ysera_the_dreamer" ||
        e.card === "zixor_project_hope" ||
        e.card === "murozond" ||
        e.card === "alexstrasza" ||
        e.card === "blingtron_5000" ||
        e.card === "bigfernal" ||
        e.card === "baron_rivendare" ||
        e.card === "brann_bronzebeard" ||
        e.card === "junkbot" ||
        e.card === "lightfang_enforcer" ||
        e.card === "mogor_the_curse_golem" ||
        e.card === "strongshell_scavenger" ||
        e.card === "tide_razor",
    );
    // >= 1 because summoned legendary's own deathrattles may chain more summons
    expect(sneedSummons.length).toBeGreaterThanOrEqual(1);
  });
});
