import { describe, expect, it } from "vitest";
import { scabbsCutterbutter } from "@/game/heroes/scabbs-cutterbutter";
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
            heroId: "scabbs_cutterbutter",
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Scabbs Cutterbutter — active hero power (1g): give a friendly minion +1/+1
// ---------------------------------------------------------------------------

describe("Scabbs Cutterbutter — hero power", () => {
  it("gives a friendly board minion +1/+1", () => {
    const state = makeTestState({
      board: [
        {
          ...makeInitialState(42).players[0]!.board[0]!,
        },
      ],
    });
    // Build a simple minion on the board
    const minion = {
      instanceId: "test_minion",
      cardId: "alley_cat" as never,
      card: {
        id: "alley_cat",
        name: "Alley Cat",
        tier: 1,
        tribes: ["Beast"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      },
      atk: 1,
      hp: 1,
      maxHp: 1,
      keywords: [],
      golden: false,
    };
    const stateWithBoard = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, board: [minion] } : p)),
    } as GameState;

    const after = scabbsCutterbutter.onHeroPower!(stateWithBoard, 0, 0, makeRng(0));
    const boardMinion = after.players[0]!.board[0]!;
    expect(boardMinion.atk).toBe(2);
    expect(boardMinion.hp).toBe(2);
    expect(boardMinion.maxHp).toBe(2);
  });

  it("does nothing when no friendly minions on board", () => {
    const state = makeTestState({ board: [] });

    const after = scabbsCutterbutter.onHeroPower!(state, 0, 0, makeRng(0));
    expect(after.players[0]!.board).toHaveLength(0);
  });

  it("stacks across multiple uses", () => {
    const minion = {
      instanceId: "test_minion",
      cardId: "alley_cat" as never,
      card: {
        id: "alley_cat",
        name: "Alley Cat",
        tier: 1,
        tribes: ["Beast"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      },
      atk: 1,
      hp: 1,
      maxHp: 1,
      keywords: [],
      golden: false,
    };
    const base = makeInitialState(42);
    const state = {
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
              board: [minion],
              heroId: "scabbs_cutterbutter",
            }
          : p,
      ),
    } as GameState;

    let s = scabbsCutterbutter.onHeroPower!(state, 0, 0, makeRng(0));
    s = scabbsCutterbutter.onHeroPower!(s, 0, 0, makeRng(0));
    s = scabbsCutterbutter.onHeroPower!(s, 0, 0, makeRng(0));

    const boardMinion = s.players[0]!.board[0]!;
    expect(boardMinion.atk).toBe(4);
    expect(boardMinion.hp).toBe(4);
    expect(boardMinion.maxHp).toBe(4);
  });

  it("does not affect shop minions", () => {
    const shopMinion = {
      instanceId: "shop_minion",
      cardId: "alley_cat" as never,
      card: {
        id: "alley_cat",
        name: "Alley Cat",
        tier: 1,
        tribes: ["Beast"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      },
      atk: 1,
      hp: 1,
      maxHp: 1,
      keywords: [],
      golden: false,
    };
    const base = makeInitialState(42);
    const state = {
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
              shop: [shopMinion],
              hand: [],
              board: [],
              heroId: "scabbs_cutterbutter",
            }
          : p,
      ),
    } as GameState;

    const after = scabbsCutterbutter.onHeroPower!(state, 0, 0, makeRng(0));
    // Board is empty, so hero power does nothing
    expect(after.players[0]!.board).toHaveLength(0);
  });
});
