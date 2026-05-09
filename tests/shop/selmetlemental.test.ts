import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { sellMinion } from "@/game/shop";
import { makeInitialState } from "@/game/state";

const TEST_STATE = makeInitialState(42);

function makeTestState(
  boardMinions: ReturnType<typeof instantiate>[],
  handMinions: ReturnType<typeof instantiate>[] = [],
): ReturnType<typeof makeInitialState> {
  return {
    ...TEST_STATE,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: TEST_STATE.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            board: boardMinions,
            shop: [],
            hand: handMinions,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Sellemental — onSell adds a 1/1 Elemental token to hand
// ---------------------------------------------------------------------------

describe("sellemental — onSell", () => {
  it("adds a 1/1 Elemental token to hand when sold from board", () => {
    const sellemental = instantiate(MINIONS["sellemental"]!);
    const state = makeTestState([sellemental]);

    const afterSell = sellMinion(state, 0, 0);

    // Hand should have 1 Elemental token
    expect(afterSell.players[0]!.hand.length).toBe(1);
    const token = afterSell.players[0]!.hand[0]!;
    expect(token.tribes).toEqual(["Elemental"]);
    expect(token.atk).toBe(1);
    expect(token.hp).toBe(1);
    expect(token.golden).toBe(false);
  });

  it("adds a 1/1 Elemental token when sold from hand", () => {
    const sellemental = instantiate(MINIONS["sellemental"]!);
    const state = makeTestState([], [sellemental]);

    const afterSell = sellMinion(state, 0, 0, true);

    // Hand should be empty (sold minion removed), but hand should have 1 token
    expect(afterSell.players[0]!.hand.length).toBe(1);
    const token = afterSell.players[0]!.hand[0]!;
    expect(token.tribes).toEqual(["Elemental"]);
    expect(token.atk).toBe(1);
    expect(token.hp).toBe(1);
  });

  it("does NOT add a token when selling a non-Sellemental", () => {
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);
    const state = makeTestState([murlocScout]);

    const afterSell = sellMinion(state, 0, 0);

    // No token should be added
    expect(afterSell.players[0]!.hand.length).toBe(0);
  });

  it("works with multiple Sellementals on board", () => {
    const sellemental1 = instantiate(MINIONS["sellemental"]!);
    const sellemental2 = instantiate(MINIONS["sellemental"]!);
    const state = makeTestState([sellemental1, sellemental2]);

    // Sell first Sellemental
    const afterSell1 = sellMinion(state, 0, 0);
    expect(afterSell1.players[0]!.hand.length).toBe(1);

    // Sell second Sellemental
    const afterSell2 = sellMinion(afterSell1, 0, 0);
    expect(afterSell2.players[0]!.hand.length).toBe(2);
  });
});
