import { describe, expect, it } from "vitest";
import { defineMinion, instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { beginRecruitTurn, makeInitialState } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

const TEST_MECH = defineMinion({
  id: "test_mech",
  name: "Test Mech",
  tier: 1,
  tribes: ["Mech"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});
MINIONS[TEST_MECH.id] = TEST_MECH;

const TEST_BEAST = defineMinion({
  id: "test_beast",
  name: "Test Beast",
  tier: 1,
  tribes: ["Beast"],
  baseAtk: 3,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});
MINIONS[TEST_BEAST.id] = TEST_BEAST;

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  const shopMinion = instantiate(TEST_MECH);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: { test_mech: 10, test_beast: 10 },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [shopMinion],
            hand: [],
            board: [],
            heroId: "millificent_manastorm",
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Millificent Manastorm — passive: buying a Mech buffs all friendly Mechs +1/+1
// ---------------------------------------------------------------------------

describe("Millificent Manastorm — Mech buff on buy", () => {
  it("buffs all friendly Mechs +1/+1 when a Mech is bought", () => {
    const mech1 = instantiate(TEST_MECH);
    const mech2 = instantiate(TEST_MECH);
    const state = makeTestState({ board: [mech1, mech2] });
    const shopMinion = instantiate(TEST_MECH);
    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [shopMinion] } : p)),
    };

    const after = buyMinion(stateWithShop, 0, 0);
    const board = after.players[0]!.board;

    // All Mechs on board should be buffed by +1/+1
    expect(board).toHaveLength(2);
    expect(board[0]!.atk).toBe(3);
    expect(board[0]!.hp).toBe(2);
    expect(board[1]!.atk).toBe(3);
    expect(board[1]!.hp).toBe(2);
  });

  it("does NOT buff non-Mech minions", () => {
    const beast = instantiate(TEST_BEAST);
    const mech = instantiate(TEST_MECH);
    const state = makeTestState({ board: [beast, mech] });
    const shopMinion = instantiate(TEST_MECH);
    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [shopMinion] } : p)),
    };

    const after = buyMinion(stateWithShop, 0, 0);
    const board = after.players[0]!.board;

    // Mech should be buffed, beast should not
    const boardMech = board.find((m) => m.tribes.includes("Mech"));
    const boardBeast = board.find((m) => m.tribes.includes("Beast"));
    expect(boardMech).toBeDefined();
    expect(boardMech!.atk).toBe(3);
    expect(boardMech!.hp).toBe(2);
    expect(boardBeast).toBeDefined();
    expect(boardBeast!.atk).toBe(3);
    expect(boardBeast!.hp).toBe(2);
  });

  it("does NOT buff when a non-Mech is bought", () => {
    const mech = instantiate(TEST_MECH);
    const state = makeTestState({ board: [mech] });
    const shopMinion = instantiate(TEST_BEAST);
    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [shopMinion] } : p)),
    };

    const after = buyMinion(stateWithShop, 0, 0);
    const board = after.players[0]!.board;

    // Mech should NOT be buffed since a Beast was bought
    expect(board).toHaveLength(1);
    expect(board[0]!.atk).toBe(2);
    expect(board[0]!.hp).toBe(1);
  });

  it("buffs golden Mechs too", () => {
    const goldenMech = instantiate(TEST_MECH);
    const normalMech = instantiate(TEST_MECH);
    const golden = {
      ...goldenMech,
      golden: true,
      atk: goldenMech.atk * 2,
      hp: goldenMech.hp * 2,
      maxHp: goldenMech.maxHp * 2,
    };
    const state = makeTestState({ board: [golden, normalMech] });
    const shopMinion = instantiate(TEST_MECH);
    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [shopMinion] } : p)),
    };

    const after = buyMinion(stateWithShop, 0, 0);
    const board = after.players[0]!.board;

    // Both golden and normal Mechs should be buffed
    const g = board.find((m) => m.golden);
    const n = board.find((m) => !m.golden);
    expect(g).toBeDefined();
    expect(g!.atk).toBe(5); // 4 + 1
    expect(g!.hp).toBe(3); // 2 + 1
    expect(n).toBeDefined();
    expect(n!.atk).toBe(3); // 2 + 1
    expect(n!.hp).toBe(2); // 1 + 1
  });

  it("stacks — each Mech bought adds +1/+1 to all Mechs", () => {
    const mech1 = instantiate(TEST_MECH);
    const mech2 = instantiate(TEST_MECH);
    const state = makeTestState({ board: [mech1, mech2] });
    const shopMinion1 = instantiate(TEST_MECH);
    const shopMinion2 = instantiate(TEST_MECH);
    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [shopMinion1] } : p)),
    };

    // First buy
    let after = buyMinion(stateWithShop, 0, 0);
    expect(after.players[0]!.board).toHaveLength(2);
    expect(after.players[0]!.board[0]!.atk).toBe(3); // 2 + 1

    // Second buy
    const stateWithShop2 = {
      ...after,
      players: after.players.map((p, i) =>
        i === 0 ? { ...p, shop: [shopMinion2], gold: p.gold + 3 } : p,
      ),
    };
    after = buyMinion(stateWithShop2, 0, 0);
    const finalBoard = after.players[0]!.board;
    expect(finalBoard).toHaveLength(2);
    expect(finalBoard[0]!.atk).toBe(4); // 2 + 1 + 1
    expect(finalBoard[0]!.hp).toBe(3); // 1 + 1 + 1
  });

  it("does not apply when hero is not Millificent", () => {
    const mech = instantiate(TEST_MECH);
    const state = makeTestState({ board: [mech], heroId: "patchwerk" });
    const shopMinion = instantiate(TEST_MECH);
    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [shopMinion] } : p)),
    };

    const after = buyMinion(stateWithShop, 0, 0);
    const board = after.players[0]!.board;

    // Mech should NOT be buffed since hero is not Millificent
    expect(board).toHaveLength(1);
    expect(board[0]!.atk).toBe(2);
    expect(board[0]!.hp).toBe(1);
  });
});
