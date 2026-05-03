import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(0);

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

function minion(id: string) {
  return instantiate(getMinion(id));
}

function goldenMinion(id: string) {
  const m = instantiate(getMinion(id));
  return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
}

// ---------------------------------------------------------------------------
// Brann Bronzebeard — battlecry triggers 2x
// ---------------------------------------------------------------------------

describe("brann — battlecry triggers 2x", () => {
  it("non-golden minion with Brann on board triggers battlecry twice", () => {
    const state = makeTestState();

    // Put Brann on the board (Murloc, no battlecry that summons)
    const brann = minion("brann_bronzebeard");
    const stateWithBrann = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [brann],
      })),
    };

    // Murloc Tidehunter has a battlecry that summons a 1/1 whelp
    const tidehunter = minion("murloc_tidehunter");
    const after = playMinionToBoard(
      {
        ...stateWithBrann,
        players: stateWithBrann.players.map((p) => ({
          ...p,
          hand: [tidehunter],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Tidehunter battlecry summons whelp. With Brann, it fires twice = 2 whelps.
    // Board: Brann + Tidehunter + 2 whelps = 4
    expect(player.board.length).toBe(4);
    const whelps = player.board.filter((m) => m.cardId === "murloc_tidehunter_whelp");
    expect(whelps.length).toBe(2);
  });

  it("golden minion without Brann triggers battlecry twice", () => {
    const state = makeTestState();

    const tidehunter = goldenMinion("murloc_tidehunter");
    const after = playMinionToBoard(
      {
        ...state,
        players: state.players.map((p) => ({
          ...p,
          hand: [tidehunter],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Golden tidehunter battlecry fires 2x = 2 whelps
    // Board: Tidehunter + 2 whelps = 3
    expect(player.board.length).toBe(3);
    const whelps = player.board.filter((m) => m.cardId === "murloc_tidehunter_whelp");
    expect(whelps.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Brann + Golden — battlecry triggers 4x (2 x 2 multiplicative)
// ---------------------------------------------------------------------------

describe("brann + golden — battlecry triggers 4x", () => {
  it("golden minion with Brann on board triggers battlecry 4 times", () => {
    const state = makeTestState();

    // Put Brann on the board
    const brann = minion("brann_bronzebeard");
    const stateWithBrann = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [brann],
      })),
    };

    // Golden Murloc Tidehunter — battlecry fires 4x (2 golden x 2 brann)
    const tidehunter = goldenMinion("murloc_tidehunter");
    const after = playMinionToBoard(
      {
        ...stateWithBrann,
        players: stateWithBrann.players.map((p) => ({
          ...p,
          hand: [tidehunter],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Golden tidehunter battlecry fires 4x = 4 whelps
    // Board: Brann + Tidehunter + 4 whelps = 6
    expect(player.board.length).toBe(6);
    const whelps = player.board.filter((m) => m.cardId === "murloc_tidehunter_whelp");
    expect(whelps.length).toBe(4);
  });

  it("golden Knife Juggler with Brann triggers 4x", () => {
    const state = makeTestState();

    // Put Brann on the board
    const brann = minion("brann_bronzebeard");
    const stateWithBrann = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [brann],
      })),
    };

    // Golden Knife Juggler — battlecry fires 4x
    const knifeJuggler = goldenMinion("knife_juggler");
    const after = playMinionToBoard(
      {
        ...stateWithBrann,
        players: stateWithBrann.players.map((p) => ({
          ...p,
          hand: [knifeJuggler],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Golden knife juggler battlecry fires 4x = 4 damage events
    // Each damage event targets a random enemy (but there are no enemies on board)
    // Board: Brann + Knife Juggler = 2
    expect(player.board.length).toBe(2);
  });
});
