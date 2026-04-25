import { describe, expect, it } from "vitest";
import { baseGoldForTurn } from "./economy";

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
});
