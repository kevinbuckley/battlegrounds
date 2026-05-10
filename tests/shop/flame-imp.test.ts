import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Flame Imp — battlecry deals 2 damage to the hero
// ---------------------------------------------------------------------------

describe("flame-imp — onBattlecry", () => {
  it("deals 2 damage to the hero when played to board", () => {
    const base = makeInitialState(42);
    const flameImp = instantiate(MINIONS["flame_imp"]!); // 3/1 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { flame_imp: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              shop: [flameImp],
              hp: 30,
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    // Hero should have taken 2 damage
    expect(afterPlay.players[0]!.hp).toBe(28);

    // Flame Imp should be on board at 3/1
    const board = afterPlay.players[0]!.board;
    const imp = board.find((m) => m.cardId === "flame_imp");
    expect(imp).toBeDefined();
    expect(imp!.atk).toBe(3);
    expect(imp!.hp).toBe(1);
  });

  it("does nothing when hero is at 1 HP (clamped to 0)", () => {
    const base = makeInitialState(42);
    const flameImp = instantiate(MINIONS["flame_imp"]!); // 3/1 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { flame_imp: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              shop: [flameImp],
              hp: 1,
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    // Hero should be clamped to 0, not negative
    expect(afterPlay.players[0]!.hp).toBe(0);

    // Flame Imp should still be on board
    const board = afterPlay.players[0]!.board;
    const imp = board.find((m) => m.cardId === "flame_imp");
    expect(imp).toBeDefined();
  });

  it("does nothing when hero is already at 0 HP", () => {
    const base = makeInitialState(42);
    const flameImp = instantiate(MINIONS["flame_imp"]!); // 3/1 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { flame_imp: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              shop: [flameImp],
              hp: 0,
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    // Hero stays at 0
    expect(afterPlay.players[0]!.hp).toBe(0);

    // Flame Imp should still be on board
    const board = afterPlay.players[0]!.board;
    const imp = board.find((m) => m.cardId === "flame_imp");
    expect(imp).toBeDefined();
  });

  it("does not affect the enemy hero", () => {
    const base = makeInitialState(42);
    const flameImp = instantiate(MINIONS["flame_imp"]!); // 3/1 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { flame_imp: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              shop: [flameImp],
              hp: 30,
            }
          : i === 1
            ? { ...p, hp: 30 }
            : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    // Enemy hero should be unaffected
    expect(afterPlay.players[1]!.hp).toBe(30);
  });
});
