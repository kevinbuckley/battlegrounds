import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Bloodsail Corsair — battlecry deals 2 damage to a random enemy minion
// ---------------------------------------------------------------------------

describe("bloodsail_corsair — battlecry", () => {
  it("deals 2 damage to a random enemy minion on opponent's board", () => {
    const base = makeInitialState(42);
    const corsair = instantiate(MINIONS["bloodsail_corsair"]!); // 4/3 Pirate

    const enemyMinion = instantiate(MINIONS["murloc_scout"]!); // 1/2 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        bloodsail_corsair: 10,
        murloc_scout: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [],
              shop: [corsair],
            }
          : i === 1
            ? {
                ...p,
                board: [enemyMinion],
              }
            : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(1); // Only Corsair

    const enemyBoard = afterPlay.players[1]!.board;
    expect(enemyBoard.length).toBe(1);
    expect(enemyBoard[0]!.hp).toBe(-1); // 1 - 2 = -1, dead (filtered by hp > 0 elsewhere)
  });

  it("does not kill when enemy has high HP", () => {
    const base = makeInitialState(42);
    const corsair = instantiate(MINIONS["bloodsail_corsair"]!);

    const enemyMinion = instantiate(MINIONS["murloc_scout"]!);
    const highHpMinion = { ...enemyMinion, hp: 10 };

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        bloodsail_corsair: 10,
        murloc_scout: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [],
              shop: [corsair],
            }
          : i === 1
            ? {
                ...p,
                board: [highHpMinion],
              }
            : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const enemyBoard = afterPlay.players[1]!.board;
    expect(enemyBoard.length).toBe(1);
    expect(enemyBoard[0]!.hp).toBe(8); // 10 - 2 = 8
  });

  it("does nothing when no enemies have minions", () => {
    const base = makeInitialState(42);
    const corsair = instantiate(MINIONS["bloodsail_corsair"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        bloodsail_corsair: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [],
              shop: [corsair],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(1); // Only Corsair, no effect
  });

  it("picks a random enemy when multiple opponents have minions", () => {
    const base = makeInitialState(42);
    const corsair = instantiate(MINIONS["bloodsail_corsair"]!);

    const enemy1 = instantiate(MINIONS["murloc_scout"]!);
    const enemy2 = instantiate(MINIONS["flame_imp"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        bloodsail_corsair: 10,
        murloc_scout: 10,
        flame_imp: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [],
              shop: [corsair],
            }
          : i === 1
            ? {
                ...p,
                board: [enemy1],
              }
            : i === 2
              ? {
                  ...p,
                  board: [enemy2],
                }
              : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(1);

    // Exactly one opponent should have their minion damaged (2 damage kills the 1/2 scout)
    const enemy1Board = afterPlay.players[1]!.board;
    const enemy2Board = afterPlay.players[2]!.board;

    // One enemy should have hp -1 (dead), the other should still have full hp
    const enemy1Dead = enemy1Board.length === 1 && enemy1Board[0]!.hp <= 0;
    const enemy2Dead = enemy2Board.length === 1 && enemy2Board[0]!.hp <= 0;
    expect(enemy1Dead || enemy2Dead).toBe(true);
    expect(enemy1Dead && enemy2Dead).toBe(false);
  });
});
