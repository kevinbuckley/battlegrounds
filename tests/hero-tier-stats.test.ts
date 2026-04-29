import { describe, expect, it } from "vitest";
import { getAllHeroIds, HEROES } from "@/game/heroes";
import type { HeroId } from "@/game/types";

// Tier-to-HP mapping per Battlegrounds spec
const TIER_HP: Record<number, number> = {
  1: 25,
  2: 30,
  3: 35,
  4: 40,
  5: 50,
  6: 60,
};

// Tier-to-armor mapping per Battlegrounds spec
const TIER_ARMOR: Record<number, number> = {
  1: 0,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
};

/** Reverse-map HP to tier number. */
function hpToTier(hp: number): number | null {
  for (const [tier, hpVal] of Object.entries(TIER_HP)) {
    if (hpVal === hp) return Number(tier);
  }
  return null;
}

/** Reverse-map armor to tier number. */
function armorToTier(armor: number): number | null {
  for (const [tier, armorVal] of Object.entries(TIER_ARMOR)) {
    if (armorVal === armor) return Number(tier);
  }
  return null;
}

describe("hero tier stats", () => {
  it("every non-stub hero's startHp maps to a valid tier", () => {
    const nonStubIds = getAllHeroIds().filter((id) => id !== "stub_hero");
    for (const id of nonStubIds) {
      const hero = HEROES[id as HeroId];
      expect(hero).toBeDefined();
      const tier = hpToTier(hero!.startHp);
      expect(tier).not.toBeNull();
      expect(Object.keys(TIER_HP).map(Number).includes(tier!)).toBe(true);
    }
  });

  it("every non-stub hero's startArmor maps to a valid tier", () => {
    const nonStubIds = getAllHeroIds().filter((id) => id !== "stub_hero");
    for (const id of nonStubIds) {
      const hero = HEROES[id as HeroId];
      expect(hero).toBeDefined();
      const tier = armorToTier(hero!.startArmor);
      expect(tier).not.toBeNull();
      expect(Object.keys(TIER_ARMOR).map(Number).includes(tier!)).toBe(true);
    }
  });

  it("stub hero has tier 4 HP (40) and tier 1 armor (0)", () => {
    const stub = HEROES["stub_hero"];
    expect(stub).toBeDefined();
    expect(hpToTier(stub!.startHp)).toBe(4);
    expect(armorToTier(stub!.startArmor)).toBe(1);
  });

  it("Patchwerk has tier 6 HP (60) and tier 1 armor (0)", () => {
    const pw = HEROES["patchwerk"];
    expect(pw).toBeDefined();
    expect(hpToTier(pw!.startHp)).toBe(6);
    expect(armorToTier(pw!.startArmor)).toBe(1);
  });

  it("George the Fallen has tier 3 HP (35) and tier 3 armor (5)", () => {
    const george = HEROES["george_the_fallen"];
    expect(george).toBeDefined();
    expect(hpToTier(george!.startHp)).toBe(3);
    expect(armorToTier(george!.startArmor)).toBe(3);
  });

  it("Af Kay has tier 4 HP (40) and tier 2 armor (3)", () => {
    const afKay = HEROES["af_kay"];
    expect(afKay).toBeDefined();
    expect(hpToTier(afKay!.startHp)).toBe(4);
    expect(armorToTier(afKay!.startArmor)).toBe(2);
  });

  it("all 16 non-stub heroes have valid HP/armor tier mappings", () => {
    const nonStubIds = getAllHeroIds().filter((id) => id !== "stub_hero");
    expect(nonStubIds).toHaveLength(16);

    for (const id of nonStubIds) {
      const hero = HEROES[id as HeroId];
      expect(hero).toBeDefined();
      const hpTier = hpToTier(hero!.startHp);
      const armorTier = armorToTier(hero!.startArmor);
      expect(hpTier).not.toBeNull();
      expect(armorTier).not.toBeNull();
    }
  });
});
