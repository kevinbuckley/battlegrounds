import { describe, expect, it } from "vitest";
import { baseGoldForTurn, calcInterestGold } from "./economy";

describe("economy", () => {
  it("starts at 3g turn 1 and increments by 1", () => {
    expect(baseGoldForTurn(1)).toBe(3);
    expect(baseGoldForTurn(2)).toBe(4);
    expect(baseGoldForTurn(7)).toBe(9);
  });

  it("caps at 10g", () => {
    expect(baseGoldForTurn(8)).toBe(10);
    expect(baseGoldForTurn(20)).toBe(10);
  });

  describe("interest gold", () => {
    it("gives 0 interest at 4 gold or less", () => {
      expect(calcInterestGold(0)).toBe(0);
      expect(calcInterestGold(1)).toBe(0);
      expect(calcInterestGold(4)).toBe(0);
    });

    it("gives 1 interest at 5-9 gold", () => {
      expect(calcInterestGold(5)).toBe(1);
      expect(calcInterestGold(6)).toBe(1);
      expect(calcInterestGold(9)).toBe(1);
    });

    it("gives 2 interest at 10-14 gold", () => {
      expect(calcInterestGold(10)).toBe(2);
      expect(calcInterestGold(14)).toBe(2);
    });

    it("caps at 10 interest gold", () => {
      expect(calcInterestGold(50)).toBe(10);
      expect(calcInterestGold(100)).toBe(10);
    });
  });
});
