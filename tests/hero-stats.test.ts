import { describe, expect, it } from "vitest";
import { getAllHeroIds, HEROES } from "@/game/heroes";
import type { HeroId } from "@/game/types";

describe("hero start stats", () => {
  const VALID_HP = [25, 30, 35, 40, 50, 60];
  const VALID_ARMOR = [0, 3, 5, 7, 9, 11];

  it.each(
    getAllHeroIds().filter((id) => id !== "stub_hero"),
  )("every non-stub hero has valid startHp (%d) and startArmor (%d)", (id: string) => {
    const hero = HEROES[id as HeroId];
    if (!hero) {
      expect.fail(`${id} not found in HEROES`);
      return;
    }
    expect(VALID_HP.includes(hero.startHp)).toBe(true);
    expect(VALID_ARMOR.includes(hero.startArmor)).toBe(true);
  });

  it("stub hero has no game impact (placeholder defaults)", () => {
    const stub = HEROES["stub_hero"];
    expect(stub).toBeDefined();
    expect(stub!.startHp).toBe(40);
    expect(stub!.startArmor).toBe(0);
  });

  it("valid HP tiers match Battlegrounds spec: 25/30/35/40/50/60", () => {
    expect(VALID_HP.sort((a, b) => a - b)).toEqual([25, 30, 35, 40, 50, 60]);
  });

  it("valid armor tiers match Battlegrounds spec: 0/3/5/7/9/11", () => {
    expect(VALID_ARMOR.sort((a, b) => a - b)).toEqual([0, 3, 5, 7, 9, 11]);
  });
});
