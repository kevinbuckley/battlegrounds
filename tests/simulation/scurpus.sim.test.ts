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

function makeScurpus() {
  return instantiate(getMinion("scurpus"));
}

function makeMinionWithBattlecry(cardId: string) {
  return instantiate(getMinion(cardId));
}

describe("scurpus", () => {
  it("summons a 1/1 Beast for each other minion with a battlecry on the board", () => {
    const state = makeTestState();

    // Put a minion with battlecry on the board (Rockpool Hunter)
    const rockpool = makeMinionWithBattlecry("rockpool_hunter");
    const stateWithRockpool = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [rockpool],
      })),
    };

    const scurpus = makeScurpus();
    const after = playMinionToBoard(
      {
        ...stateWithRockpool,
        players: stateWithRockpool.players.map((p) => ({
          ...p,
          hand: [scurpus],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Should have scurpus + 1 snake (rockpool has battlecry)
    // Note: rockpool is already on board at index 0, scurpus inserted at index 1, snakes appended
    // total = rockpool + scurpus + 1 snake = 3
    expect(player.board.length).toBe(3);
    expect(player.board[1]!.cardId).toBe("scurpus");
    const snakes = player.board.filter((m) => m.cardId === "scurpus_snake");
    expect(snakes.length).toBe(1);
    expect(snakes[0]!.atk).toBe(1);
    expect(snakes[0]!.hp).toBe(1);
  });

  it("summons multiple snakes for multiple battlecry minions", () => {
    const state = makeTestState();

    const rockpool = makeMinionWithBattlecry("rockpool_hunter");
    const tidehunter = makeMinionWithBattlecry("murloc_tidehunter");
    const stateWithBoth = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [rockpool, tidehunter],
      })),
    };

    const scurpus = makeScurpus();
    const after = playMinionToBoard(
      {
        ...stateWithBoth,
        players: stateWithBoth.players.map((p) => ({
          ...p,
          hand: [scurpus],
        })),
      },
      0,
      0,
      2,
      RNG,
    );

    const player = after.players[0]!;
    // Should have scurpus + 2 snakes (rockpool + tidehunter have battlecry)
    // Total = rockpool + tidehunter + scurpus + 2 snakes = 5
    expect(player.board.length).toBe(5);
    expect(player.board[2]!.cardId).toBe("scurpus");
    const snakes = player.board.filter((m) => m.cardId === "scurpus_snake");
    expect(snakes.length).toBe(2);
  });

  it("summons no snakes when no other minions have battlecry", () => {
    const state = makeTestState();

    // Put a minion without battlecry on the board
    // Murloc Tinyfin has no battlecry hook
    const tinyfin = instantiate(getMinion("murloc_tinyfin"));
    const stateWithTinyfin = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [tinyfin],
      })),
    };

    const scurpus = makeScurpus();
    const after = playMinionToBoard(
      {
        ...stateWithTinyfin,
        players: stateWithTinyfin.players.map((p) => ({
          ...p,
          hand: [scurpus],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Tinyfin + scurpus = 2 minions, no snakes summoned (tinyfin has no battlecry)
    expect(player.board.length).toBe(2);
    expect(player.board[1]!.cardId).toBe("scurpus");
  });

  it("respects board cap of 7 minions", () => {
    const state = makeTestState();

    // Fill board with 6 battlecry minions
    const battlecryMinions = [
      makeMinionWithBattlecry("rockpool_hunter"),
      makeMinionWithBattlecry("murloc_tidehunter"),
      makeMinionWithBattlecry("murloc_tidehunter"),
      makeMinionWithBattlecry("murloc_tidehunter"),
      makeMinionWithBattlecry("murloc_tidehunter"),
      makeMinionWithBattlecry("murloc_tidehunter"),
    ];
    const stateFullBoard = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: battlecryMinions,
      })),
    };

    const scurpus = makeScurpus();
    const after = playMinionToBoard(
      {
        ...stateFullBoard,
        players: stateFullBoard.players.map((p) => ({
          ...p,
          hand: [scurpus],
        })),
      },
      0,
      0,
      6,
      RNG,
    );

    const player = after.players[0]!;
    // Board is full (7), Scurpus takes the last slot, 0 available for snakes
    expect(player.board.length).toBe(7);
    // No snakes can be summoned since board is full (Scurpus occupies the 7th slot)
    const snakeCount = player.board.filter((m) => m.cardId === "scurpus_snake").length;
    expect(snakeCount).toBe(0);
  });

  it("does not count itself when counting battlecry minions", () => {
    const state = makeTestState();

    // Put another Scurpus on the board (it has battlecry)
    const otherScurpus = makeScurpus();
    const stateWithScurpus = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [otherScurpus],
      })),
    };

    const scurpus = makeScurpus();
    const after = playMinionToBoard(
      {
        ...stateWithScurpus,
        players: stateWithScurpus.players.map((p) => ({
          ...p,
          hand: [scurpus],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // Should have otherScurpus + scurpus + 1 snake (the other scurpus has battlecry)
    // Total = otherScurpus + scurpus + 1 snake = 3
    expect(player.board.length).toBe(3);
    expect(player.board[1]!.cardId).toBe("scurpus");
    const snakes = player.board.filter((m) => m.cardId === "scurpus_snake");
    expect(snakes.length).toBe(1);
  });

  it("counts other Scurpuses on the board for battlecry", () => {
    const state = makeTestState();

    // Put 2 Scurpuses on the board
    const scurpus1 = makeScurpus();
    const stateWithTwoScurpus = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [scurpus1],
      })),
    };

    const scurpus2 = makeScurpus();
    const after = playMinionToBoard(
      {
        ...stateWithTwoScurpus,
        players: stateWithTwoScurpus.players.map((p) => ({
          ...p,
          hand: [scurpus2],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // 2 Scurpuses on board + 1 snake (second Scurpus counts first Scurpus's battlecry)
    // Total = 2 Scurpuses + 1 snake = 3
    expect(player.board.length).toBe(3);
    const snakes = player.board.filter((m) => m.cardId === "scurpus_snake");
    expect(snakes.length).toBe(1);
  });
});
