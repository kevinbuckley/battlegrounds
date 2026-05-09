import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { Keyword } from "@/game/types";
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
// Nadina the Red — deathrattle: give divine shield to friendly non-divine-shield
// Deathrattle minions (minions with onDeath hook)
// ---------------------------------------------------------------------------

describe("nadina the Red simulation", () => {
  it("gives divine shield to allies that have an onDeath hook", () => {
    const nadina = minion("nadina_the_red"); // 7/4 Demon
    const harvestGolem = minion("harvest_golem"); // 2/2 Mech with deathrattle
    const filler = makeMinion(1, 1);
    // Give Nadina taunt so the enemy targets her; she dies mid-combat,
    // her deathrattle fires while Harvest Golem (untouched) survives
    const nadinaWithTaunt = { ...nadina, keywords: new Set<Keyword>(["taunt"]) };
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([nadinaWithTaunt, harvestGolem, filler], [enemy], makeRng(0));

    // Nadina dies (taunt draws enemy fire), her deathrattle fires, giving Harvest Golem divineShield
    const harvestAfter = r.survivorsLeft.find((m) => m.instanceId === harvestGolem.instanceId);
    expect(harvestAfter).toBeDefined();
    expect(harvestAfter!.keywords.has("divineShield" as Keyword)).toBe(true);
  });

  it("does not give divine shield to minions that already have it", () => {
    const nadina = minion("nadina_the_red");
    const harvestGolem = minion("harvest_golem");
    // Give harvestGolem divineShield upfront
    const golemWithShield = { ...harvestGolem, keywords: new Set<Keyword>(["divineShield"]) };
    const filler = makeMinion(1, 1);
    // Give Nadina taunt so she draws fire and dies
    const nadinaWithTaunt = { ...nadina, keywords: new Set<Keyword>(["taunt"]) };
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([nadinaWithTaunt, golemWithShield, filler], [enemy], makeRng(0));

    // Harvest Golem should still have divineShield (unchanged, not double-applied)
    const harvestAfter = r.survivorsLeft.find((m) => m.instanceId === golemWithShield.instanceId);
    expect(harvestAfter).toBeDefined();
    expect(harvestAfter!.keywords.has("divineShield" as Keyword)).toBe(true);
  });

  it("does not give divine shield to vanilla minions without onDeath", () => {
    const nadina = minion("nadina_the_red");
    const harvestGolem = minion("harvest_golem");
    const vanilla = makeMinion(2, 2);
    // Give Nadina taunt so she draws fire and dies
    const nadinaWithTaunt = { ...nadina, keywords: new Set<Keyword>(["taunt"]) };
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([nadinaWithTaunt, harvestGolem, vanilla], [enemy], makeRng(0));

    // Harvest Golem should have divineShield (has onDeath hook)
    const harvestAfter = r.survivorsLeft.find((m) => m.instanceId === harvestGolem.instanceId);
    expect(harvestAfter).toBeDefined();
    expect(harvestAfter!.keywords.has("divineShield" as Keyword)).toBe(true);

    // Vanilla minion should NOT have divineShield (no onDeath hook)
    const vanillaAfter = r.survivorsLeft.find((m) => m.instanceId === vanilla.instanceId);
    expect(vanillaAfter).toBeDefined();
    expect(vanillaAfter!.keywords.has("divineShield" as Keyword)).toBe(false);
  });

  it("golden Nadina also gives divine shield (deathrattle fires twice)", () => {
    const nadina = (() => {
      const m = instantiate(getMinion("nadina_the_red"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.hp * 2 };
    })();
    const harvestGolem = minion("harvest_golem");
    const filler = makeMinion(1, 1);
    // Give golden Nadina taunt so she draws fire
    const nadinaWithTaunt = { ...nadina, keywords: new Set<Keyword>(["taunt"]) };
    const enemy = makeMinion(11, 11);

    const r = simulateCombat([nadinaWithTaunt, harvestGolem, filler], [enemy], makeRng(0));

    // Harvest Golem should have divineShield from the deathrattle
    const harvestAfter = r.survivorsLeft.find((m) => m.instanceId === harvestGolem.instanceId);
    expect(harvestAfter).toBeDefined();
    expect(harvestAfter!.keywords.has("divineShield" as Keyword)).toBe(true);
  });
});
