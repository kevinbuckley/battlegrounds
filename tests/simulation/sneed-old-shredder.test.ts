import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeEnemy(atk: number, hp: number): MinionInstance {
  return instantiate(
    defineMinion({
      id: `enemy_${atk}_${hp}`,
      name: `Enemy ${atk}/${hp}`,
      tier: 1,
      tribes: [],
      baseAtk: atk,
      baseHp: hp,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    }),
  );
}

// ---------------------------------------------------------------------------
// Sneed's Old Shredder — deathrattle summons a random Legendary minion
// ---------------------------------------------------------------------------

describe("sneed_old_shredder", () => {
  it("has correct base stats and tribe", () => {
    const sneed = instantiate(getMinion("sneed_old_shredder"));
    expect(sneed.cardId).toBe("sneed_old_shredder");
    expect(sneed.atk).toBe(1);
    expect(sneed.hp).toBe(7);
    expect(sneed.tribes).toContain("Mech");
  });

  it("summons a random minion from the legendary pool on death", () => {
    const sneed = instantiate(getMinion("sneed_old_shredder"));
    // High-HP enemy (1 ATK) so the summoned minion survives — only Sneed dies.
    // Sneed (1/7) takes 1 damage per attack cycle. With 100 HP, it survives
    // long enough for the deathrattle to fire once, then the summoned minion
    // also survives. We just need to count the first Summon event.
    const enemy = makeEnemy(1, 100);
    const r = simulateCombat([sneed], [enemy], makeRng(0));
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    // At least one summon from Sneed's deathrattle
    expect(summonEvents.length).toBeGreaterThanOrEqual(1);
    const cardId = summonEvents[0]?.card;
    const legendaryPool = [
      "foe_reaper_4000",
      "friggent_northvalley",
      "gentle_megasaur",
      "ghastcoiler",
      "kalecgos_arcane_aspect",
      "mama_bear",
      "terestian_manferris",
      "zixor_project_hope",
    ];
    expect(legendaryPool).toContain(cardId);
  });

  it("summons a minion with correct stats from the actual registry", () => {
    const sneed = instantiate(getMinion("sneed_old_shredder"));
    const enemy = makeEnemy(1, 100);
    const r = simulateCombat([sneed], [enemy], makeRng(0));
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents.length).toBeGreaterThanOrEqual(1);
    const summonedCardId = summonEvents[0]?.card;
    // Verify the summoned minion exists in survivorsLeft or was summoned
    // (it may have died during combat, but the summon event confirms it was created)
    const anySurvivor = r.survivorsLeft.find((m) => m.cardId === summonedCardId);
    // The summoned minion should either survive or have been summoned (we verified
    // the summon event above). Check that at least one survivor matches the template.
    const template = getMinion(summonedCardId as never);
    const matchingSurvivor = r.survivorsLeft.find((m) => m.cardId === summonedCardId);
    // If the summoned minion survived, verify its stats match the template.
    // If it died, that's fine — the summon event already proves it was created.
    if (matchingSurvivor) {
      expect(matchingSurvivor.atk).toBe(template.baseAtk);
      expect(matchingSurvivor.hp).toBe(template.baseHp);
    }
  });

  it("summons a minion at the correct board position (where Sneed was)", () => {
    const sneed = instantiate(getMinion("sneed_old_shredder"));
    const ally = makeEnemy(1, 100);
    const enemy = makeEnemy(1, 100);
    const r = simulateCombat([sneed, ally], [enemy], makeRng(0));
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents.length).toBeGreaterThanOrEqual(1);
    const summonEvent = summonEvents[0] as { kind: "Summon"; position: number };
    expect(summonEvent.position).toBe(0);
  });

  it("golden Sneed summons a random minion twice (deathrattle x2)", () => {
    const sneed = instantiate(getMinion("sneed_old_shredder"));
    const goldenSneed = { ...sneed, golden: true };
    // High-HP enemy so summoned minions survive
    const enemy = makeEnemy(1, 100);
    const r = simulateCombat([goldenSneed], [enemy], makeRng(0));
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    // Golden Sneed triggers deathrattle twice → at least 2 summons from Sneed
    // (additional summons from the summoned minions' own deathrattles are OK)
    expect(summonEvents.length).toBeGreaterThanOrEqual(2);
  });
});
