import { describe, expect, it } from "vitest";
import { HEROES } from "@/game/heroes";
import { afKay } from "@/game/heroes/af-kay";
import { makeRng } from "@/lib/rng";

describe("A.F. Kay — hero definition", () => {
  it("exists in the HEROES registry", () => {
    expect(HEROES["af_kay"]).toBe(afKay);
  });

  it("has correct id", () => {
    expect(afKay.id).toBe("af_kay");
  });

  it("has correct name", () => {
    expect(afKay.name).toBe("A.F. Kay");
  });

  it("has start_of_game power kind", () => {
    expect(afKay.power.kind).toBe("start_of_game");
  });

  it("has startHp of 40", () => {
    expect(afKay.startHp).toBe(40);
  });

  it("has startArmor of 3", () => {
    expect(afKay.startArmor).toBe(3);
  });

  it("has description", () => {
    expect(afKay.description).toBe("Skip your first two turns. Start at Tavern Tier 3.");
  });
});
