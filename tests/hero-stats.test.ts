import { describe, expect, it } from "vitest";
import { getAllHeroIds, HEROES } from "@/game/heroes";
import type { HeroId } from "@/game/types";

describe("hero start stats", () => {
  const VALID_HP = new Set([25, 30, 35, 40, 50, 60]);
  const VALID_ARMOR = new Set([0, 3, 5, 7, 9]);

  it.each(
    getAllHeroIds().filter((id) => id !== "stub_hero"),
  )("every non-stub hero has valid startHp (%d) and startArmor (%d)", (id: string) => {
    const hero = HEROES[id as HeroId];
    if (!hero) {
      expect.fail(`${id} not found in HEROES`);
      return;
    }
    expect(VALID_HP).toContain(hero.startHp);
    expect(VALID_ARMOR).toContain(hero.startArmor);
  });

  it("stub hero has no game impact (placeholder defaults)", () => {
    const stub = HEROES["stub_hero"];
    expect(stub).toBeDefined();
    expect(stub!.startHp).toBe(40);
    expect(stub!.startArmor).toBe(0);
  });
});
