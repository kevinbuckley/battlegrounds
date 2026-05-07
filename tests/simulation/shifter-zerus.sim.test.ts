import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { beginRecruitTurn, makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

function makeZerus() {
  return instantiate(getMinion("shifter_zerus"));
}

function makeTestState() {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 } as (typeof base)["phase"],
    turn: 1,
    players: base.players.map((p) => ({
      ...p,
      gold: 10,
      tier: 1 as (typeof base)["players"][number]["tier"],
      shop: [],
      hand: [],
      board: [],
    })),
  };
}

describe("shifter_zerus", () => {
  it("transforms into a random minion from the pool at start of turn", () => {
    const state = makeTestState();
    const zerus = makeZerus();
    const stateWithZerus = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [zerus],
      })),
    };
    const after = beginRecruitTurn(stateWithZerus, makeRng(100));
    const board = after.players[0]!.board;
    expect(board.length).toBe(1);
    expect(board[0]!.cardId).not.toBe("shifter_zerus");
  });

  it("replaces the Shifter Zerus instance on the board with the new minion", () => {
    const state = makeTestState();
    const zerus = makeZerus();
    const stateWithZerus = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [zerus],
      })),
    };
    const after = beginRecruitTurn(stateWithZerus, makeRng(200));
    const board = after.players[0]!.board;
    expect(board.length).toBe(1);
    expect(board[0]!.cardId).not.toBe("shifter_zerus");
    // The new minion should be from the pool (any tier <= player tier)
    const newMinion = board[0]!;
    expect(newMinion.cardId).not.toBe("shifter_zerus");
  });

  it("does not transform when Shifter Zerus is not on the board", () => {
    const state = makeTestState();
    const after = beginRecruitTurn(state, makeRng(400));
    expect(after.players[0]!.board.length).toBe(0);
  });

  it("transforms even when other minions are on the board", () => {
    const state = makeTestState();
    const zerus = makeZerus();
    const otherMinion = instantiate(getMinion("murloc_scout"));
    const stateWithBoard = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [otherMinion, zerus],
      })),
    };
    const after = beginRecruitTurn(stateWithBoard, makeRng(500));
    const board = after.players[0]!.board;
    expect(board.length).toBe(2);
    // Zerus should be replaced, murloc_scout should remain
    const cardIds = board.map((m) => m.cardId);
    expect(cardIds).toContain("murloc_scout");
    expect(cardIds).not.toContain("shifter_zerus");
  });
});
