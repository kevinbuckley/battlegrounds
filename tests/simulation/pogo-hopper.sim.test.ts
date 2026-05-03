import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(0);

function makePogo() {
  return instantiate(getMinion("pogo_hopper"));
}

function makeTestState() {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 } as GameState["phase"],
    turn: 1,
    players: base.players.map((p) => ({
      ...p,
      gold: 10,
      tier: 1 as GameState["players"][number]["tier"],
      shop: [],
      hand: [],
      board: [],
    })),
  };
}

describe("pogo_hopper", () => {
  it("gains +1/+1 for each Pogo-Hopper previously played this game", () => {
    const state = makeTestState();
    const pogo1 = makePogo();
    const state1 = playMinionToBoard(
      { ...state, players: state.players.map((p) => ({ ...p, hand: [pogo1] })) },
      0,
      0,
      0,
      RNG,
    );
    const player1 = state1.players[0]!;
    expect(player1.board[0]!.atk).toBe(1);
    expect(player1.board[0]!.hp).toBe(1);
    expect(player1.pogoHoppersPlayed).toBe(1);

    // Play second Pogo-Hopper (handIndex=0 since hand has 1 element)
    const pogo2 = makePogo();
    const state2 = playMinionToBoard(
      { ...state1, players: state1.players.map((p) => ({ ...p, hand: [pogo2] })) },
      0,
      0,
      1,
      RNG,
    );
    const player2 = state2.players[0]!;
    expect(player2.board[1]!.atk).toBe(2);
    expect(player2.board[1]!.hp).toBe(2);
    expect(player2.pogoHoppersPlayed).toBe(2);

    // Play third Pogo-Hopper
    const pogo3 = makePogo();
    const state3 = playMinionToBoard(
      { ...state2, players: state2.players.map((p) => ({ ...p, hand: [pogo3] })) },
      0,
      0,
      2,
      RNG,
    );
    const player3 = state3.players[0]!;
    expect(player3.board[2]!.atk).toBe(3);
    expect(player3.board[2]!.hp).toBe(3);
    expect(player3.pogoHoppersPlayed).toBe(3);
  });

  it("does not buff when it is the first Pogo-Hopper played", () => {
    const state = makeTestState();
    const pogo = makePogo();
    const after = playMinionToBoard(
      { ...state, players: state.players.map((p) => ({ ...p, hand: [pogo] })) },
      0,
      0,
      0,
      RNG,
    );
    expect(after.players[0]!.board[0]!.atk).toBe(1);
    expect(after.players[0]!.board[0]!.hp).toBe(1);
  });

  it("only counts own Pogo-Hoppers, not enemy ones", () => {
    const state = makeTestState();
    const pogo1 = makePogo();
    const state1 = playMinionToBoard(
      { ...state, players: state.players.map((p) => ({ ...p, hand: [pogo1] })) },
      0,
      0,
      0,
      RNG,
    );
    const pogo2 = makePogo();
    const state2 = playMinionToBoard(
      { ...state1, players: state1.players.map((p) => ({ ...p, hand: [pogo2] })) },
      0,
      0,
      1,
      RNG,
    );
    const player = state2.players[0]!;
    expect(player.pogoHoppersPlayed).toBe(2);
    expect(player.board[1]!.atk).toBe(2);
  });
});
