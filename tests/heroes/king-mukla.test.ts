import { describe, expect, it } from "vitest";
import { kingMukla } from "@/game/heroes/king-mukla";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

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
            heroId: "king_mukla",
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// King Mukla — active hero power (1g): give opponent 2 Bananas
// ---------------------------------------------------------------------------

describe("King Mukla — hero power", () => {
  it("gives opponent 2 Banana cards in their hand", () => {
    const state = makeTestState();

    const after = kingMukla.onHeroPower!(state, 0, null, makeRng(0));
    const opponentSpells = after.players[1]!.spells;

    expect(opponentSpells).toHaveLength(2);
    expect(opponentSpells[0]!.cardId).toBe("banana");
    expect(opponentSpells[1]!.cardId).toBe("banana");
  });

  it("does nothing when no pairing exists", () => {
    const base = makeInitialState(42);
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 1 },
      turn: 1,
      pairingsHistory: [],
      players: base.players.map((p, i) =>
        i === 0
          ? { ...p, gold: 10, tier: 1, shop: [], hand: [], board: [], heroId: "king_mukla" }
          : p,
      ),
    };

    const after = kingMukla.onHeroPower!(state, 0, null, makeRng(0));
    expect(after.players[1]!.spells).toHaveLength(0);
  });
});
