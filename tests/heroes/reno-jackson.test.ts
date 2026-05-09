import { describe, expect, it } from "vitest";
import { renoJackson } from "@/game/heroes/reno-jackson";
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
            heroId: "reno_jackson",
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
// Reno Jackson — hero power (5g): make a friendly minion golden (once per game)
// ---------------------------------------------------------------------------

describe("Reno Jackson — hero power", () => {
  it("makes a friendly minion golden", () => {
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

    const after = renoJackson.onHeroPower!(state, 0, 0, makeRng(0));
    const minion = after.players[0]!.board[0]!;

    expect(minion.golden).toBe(true);
    expect(minion.atk).toBe(3);
    expect(minion.hp).toBe(2);
    expect(minion.maxHp).toBe(2);
  });

  it("does nothing when no minion exists at target index", () => {
    const state = makeTestState();

    const after = renoJackson.onHeroPower!(state, 0, 0, makeRng(0));
    expect(after.players[0]!.board).toHaveLength(0);
  });

  it("sets renoJacksonUsed flag after use", () => {
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

    const after = renoJackson.onHeroPower!(state, 0, 0, makeRng(0));
    expect(after.players[0]!.renoJacksonUsed).toBe(true);
  });

  it("preserves existing buffs when making golden", () => {
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

    const after = renoJackson.onHeroPower!(state, 0, 0, makeRng(0));
    const minion = after.players[0]!.board[0]!;

    expect(minion.golden).toBe(true);
    expect(minion.atk).toBe(5);
    expect(minion.hp).toBe(4);
  });

  it("does not affect other board minions", () => {
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

    const after = renoJackson.onHeroPower!(state, 0, 0, makeRng(0));
    const otherMinion = after.players[0]!.board[1]!;

    expect(otherMinion.golden).toBe(false);
  });
});
