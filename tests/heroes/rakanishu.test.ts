import { describe, expect, it } from "vitest";
import { rakanishu } from "@/game/heroes/rakanishu";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pairingsHistory: [[0, 1]],
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [],
            hand: [],
            board: [],
            heroId: "rakanishu",
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Rakanishu — passive hero: 40 HP, no active hero power
// ---------------------------------------------------------------------------

describe("Rakanishu — passive hero", () => {
  it("starts at 40 HP", () => {
    expect(rakanishu.startHp).toBe(40);
  });

  it("has no active hero power", () => {
    expect(rakanishu.onHeroPower).toBeUndefined();
  });

  it("does not give opponent Bananas (unlike King Mukla)", () => {
    const state = makeTestState();
    // Rakanishu has no onHeroPower, so calling it should be a no-op or undefined
    expect(rakanishu.onHeroPower).toBeUndefined();
  });
});
