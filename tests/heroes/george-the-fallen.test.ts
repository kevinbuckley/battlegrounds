import { describe, expect, it } from "vitest";
import { georgeTheFallen } from "@/game/heroes/george-the-fallen";
import { instantiate } from "@/game/minions/define";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [],
            hand: [],
            board: [],
            heroId: "george_the_fallen",
            ...overrides,
          }
        : p,
    ),
  };
}

function minion(atk: number, hp: number, keywords: string[] = []) {
  return instantiate({
    id: `test_minion_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// George the Fallen — active hero power (2g): give a friendly minion Divine Shield
// ---------------------------------------------------------------------------

describe("George the Fallen — hero power", () => {
  it("gives a friendly minion divine shield", () => {
    const m = minion(3, 3);
    const state = makeTestState({ board: [m] });

    const after = georgeTheFallen.onHeroPower!(state, 0, 0, makeRng(0));
    const board = after.players[0]!.board;

    expect(board).toHaveLength(1);
    expect(board[0]!.keywords.has("divineShield")).toBe(true);
  });

  it("does nothing when used on a minion that already has divine shield", () => {
    const m = minion(3, 3);
    const mWithShield = { ...m, keywords: new Set(["divineShield" as const]) };
    const state = makeTestState({ board: [mWithShield] });

    const after = georgeTheFallen.onHeroPower!(state, 0, 0, makeRng(0));
    const board = after.players[0]!.board;

    expect(board).toHaveLength(1);
    expect(board[0]!.keywords.has("divineShield")).toBe(true);
    // Should not add a duplicate — divine shield is a Set, so adding again is a no-op
    expect(board[0]!.keywords.size).toBe(1);
  });

  it("does nothing when board is empty", () => {
    const state = makeTestState({ board: [] });

    const after = georgeTheFallen.onHeroPower!(state, 0, 0, makeRng(0));
    expect(after.players[0]!.board).toHaveLength(0);
  });

  it("targets the correct board index", () => {
    const m1 = minion(2, 2);
    const m2 = minion(4, 4);
    const state = makeTestState({ board: [m1, m2] });

    const after = georgeTheFallen.onHeroPower!(state, 0, 1, makeRng(0));
    const board = after.players[0]!.board;

    expect(board).toHaveLength(2);
    expect(board[0]!.keywords.has("divineShield")).toBe(false);
    expect(board[1]!.keywords.has("divineShield")).toBe(true);
  });
});
