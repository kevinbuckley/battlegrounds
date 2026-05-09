import { describe, expect, it } from "vitest";
import { edwinVanCleef } from "@/game/heroes/edwin-van-cleef";
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
            heroId: "edwin_van_cleef",
            ...overrides,
          }
        : p,
    ),
  };
}

function minion(atk: number, hp: number) {
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
// Edwin Van Cleef — active hero power (4g): give all minions in hand +1/+1
// ---------------------------------------------------------------------------

describe("Edwin Van Cleef — hero power", () => {
  it("gives all minions in hand +1/+1", () => {
    const m1 = minion(2, 3);
    const m2 = minion(4, 5);
    const state = makeTestState({ hand: [m1, m2] });

    const after = edwinVanCleef.onHeroPower!(state, 0, null, makeRng(0));
    const hand = after.players[0]!.hand;

    expect(hand).toHaveLength(2);
    expect(hand[0]!.atk).toBe(3);
    expect(hand[0]!.hp).toBe(4);
    expect(hand[0]!.maxHp).toBe(4);
    expect(hand[1]!.atk).toBe(5);
    expect(hand[1]!.hp).toBe(6);
    expect(hand[1]!.maxHp).toBe(6);
  });

  it("does nothing when hand is empty", () => {
    const state = makeTestState({ hand: [] });

    const after = edwinVanCleef.onHeroPower!(state, 0, null, makeRng(0));
    expect(after.players[0]!.hand).toHaveLength(0);
  });

  it("stacks — using the power multiple times adds up", () => {
    const m = minion(2, 3);
    const state = makeTestState({ hand: [m] });

    const after1 = edwinVanCleef.onHeroPower!(state, 0, null, makeRng(0));
    const after2 = edwinVanCleef.onHeroPower!(after1, 0, null, makeRng(0));
    const hand = after2.players[0]!.hand;

    expect(hand).toHaveLength(1);
    expect(hand[0]!.atk).toBe(4); // 2 + 1 + 1
    expect(hand[0]!.hp).toBe(5); // 3 + 1 + 1
    expect(hand[0]!.maxHp).toBe(5);
  });

  it("does not affect board minions, only hand", () => {
    const boardMinion = minion(3, 3);
    const handMinion = minion(2, 2);
    const state = makeTestState({ board: [boardMinion], hand: [handMinion] });

    const after = edwinVanCleef.onHeroPower!(state, 0, null, makeRng(0));
    const board = after.players[0]!.board;
    const hand = after.players[0]!.hand;

    // Board minion unchanged
    expect(board[0]!.atk).toBe(3);
    expect(board[0]!.hp).toBe(3);
    // Hand minion buffed
    expect(hand[0]!.atk).toBe(3);
    expect(hand[0]!.hp).toBe(3);
  });
});
