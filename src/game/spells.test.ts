import { describe, expect, it } from "vitest";
import {
  duskrayBuff,
  getAllSpellIds,
  getSpell,
  pancakeSpell,
  poisonDartShield,
  SPELLS,
} from "@/game/spells";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { Action, GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

describe("spell registry", () => {
  it("exports exactly 3 spells", () => {
    expect(getAllSpellIds()).toHaveLength(3);
  });

  it.each([poisonDartShield, duskrayBuff, pancakeSpell])("%s has valid fields", (spell) => {
    expect(spell.id).toBeDefined();
    expect(spell.name).toBeDefined();
    expect(spell.description.length).toBeGreaterThan(0);
    expect(spell.cost).toBeGreaterThan(0);
    expect(spell.tiers.length).toBeGreaterThan(0);
    expect(spell.effects).toBeDefined();
    expect(spell.effects.onPlay).toBeDefined();
  });

  it("getSpell returns the same object", () => {
    expect(getSpell(poisonDartShield.id)).toBe(poisonDartShield);
  });

  it("getSpell throws for unknown id", () => {
    expect(() => getSpell("nonexistent_spell")).toThrow("Unknown spell: nonexistent_spell");
  });

  it("SPELLS object keys match getAllSpellIds", () => {
    expect(Object.keys(SPELLS).sort()).toEqual(getAllSpellIds().sort());
  });
});

describe("poison dart shield", () => {
  function makeSpellcastState(): GameState {
    const state = makeInitialState(42);
    return step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "selectHero"),
    );
  }

  it("can be created and has correct cost", () => {
    expect(poisonDartShield.cost).toBe(2);
    expect(poisonDartShield.tiers).toContain(1);
    expect(poisonDartShield.tiers).toContain(6);
  });

  it("is available at all tiers", () => {
    for (let t = 1; t <= 6; t++) {
      expect(poisonDartShield.tiers).toContain(t as 1 | 2 | 3 | 4 | 5 | 6);
    }
  });
});

describe("duskray buff", () => {
  it("is available at tiers 3-6 only", () => {
    expect(duskrayBuff.tiers).toEqual([3, 4, 5, 6]);
  });

  it("costs 3 gold", () => {
    expect(duskrayBuff.cost).toBe(3);
  });
});

describe("pancake", () => {
  it("is available at all tiers", () => {
    for (let t = 1; t <= 6; t++) {
      expect(pancakeSpell.tiers).toContain(t as 1 | 2 | 3 | 4 | 5 | 6);
    }
  });

  it("costs 1 gold", () => {
    expect(pancakeSpell.cost).toBe(1);
  });
});
