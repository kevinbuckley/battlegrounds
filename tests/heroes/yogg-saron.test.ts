import { describe, expect, it } from "vitest";
import { yoggSaron } from "@/game/heroes/yogg-saron";
import { makeInitialState } from "@/game/state";
import type { GameState, Keyword, MinionHooks } from "@/game/types";
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
            heroId: "yogg_saron",
            ...overrides,
          }
        : p,
    ),
  };
}

function baseMinion(
  cardId: string,
  instanceId: string,
): GameState["players"][number]["board"][number] {
  return {
    cardId,
    instanceId,
    baseAtk: 1,
    baseHp: 1,
    atk: 1,
    hp: 1,
    maxHp: 1,
    tribes: [],
    keywords: new Set<Keyword>(),
    golden: false,
    spellDamage: 0,
    attachments: {},
    hooks: {} as MinionHooks,
  };
}

// ---------------------------------------------------------------------------
// Yogg-Saron — hero power (2g): give all friendly minions a random keyword
// ---------------------------------------------------------------------------

describe("Yogg-Saron — hero power", () => {
  it("gives all board minions the same keyword", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("murloc_scout", "m0"),
          atk: 3,
          hp: 2,
          maxHp: 2,
        },
        {
          ...baseMinion("vulgar_homunculus", "m1"),
          atk: 2,
          hp: 1,
          maxHp: 1,
        },
      ],
    });

    const rng = makeRng(42);
    const after = yoggSaron.onHeroPower!(state, 0, undefined, rng);
    const board = after.players[0]!.board;

    expect(board).toHaveLength(2);
    const kw0 = [...board[0]!.keywords];
    const kw1 = [...board[1]!.keywords];
    expect(kw0).toEqual(kw1);
    expect(kw0.length).toBe(1);
  });

  it("does nothing when board is empty", () => {
    const state = makeTestState({ board: [] });

    const after = yoggSaron.onHeroPower!(state, 0, undefined, makeRng(0));
    expect(after.players[0]!.board).toHaveLength(0);
  });

  it("preserves existing stats when adding keyword", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("murloc_scout", "m0"),
          atk: 5,
          hp: 4,
          maxHp: 4,
        },
      ],
    });

    const after = yoggSaron.onHeroPower!(state, 0, undefined, makeRng(0));
    const minion = after.players[0]!.board[0]!;

    expect(minion.atk).toBe(5);
    expect(minion.hp).toBe(4);
    expect(minion.maxHp).toBe(4);
    expect(minion.keywords.size).toBe(1);
  });

  it("stacks across multiple uses", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("murloc_scout", "m0"),
          atk: 3,
          hp: 2,
          maxHp: 2,
        },
      ],
    });

    const after1 = yoggSaron.onHeroPower!(state, 0, undefined, makeRng(0));
    const after2 = yoggSaron.onHeroPower!(after1, 0, undefined, makeRng(1));
    const minion = after2.players[0]!.board[0]!;

    expect(minion.keywords.size).toBe(2);
  });

  it("does not affect minions on other players' boards", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("murloc_scout", "m0"),
          atk: 3,
          hp: 2,
          maxHp: 2,
        },
      ],
    });

    const after = yoggSaron.onHeroPower!(state, 0, undefined, makeRng(0));
    const opponentBoard = after.players[1]!.board;

    for (const m of opponentBoard) {
      expect([...m.keywords].length).toBe(0);
    }
  });
});
