import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Screwjank Clunker — battlecry gives a friendly Mech +2/+2
// ---------------------------------------------------------------------------

describe("screwjank-clunker — onBattlecry", () => {
  it("gives a friendly Mech +2/+2 when played to board", () => {
    const base = makeInitialState(42);
    const mech = instantiate(MINIONS["micro_machine"]!); // 1/2 Mech
    const nonMech = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const screwjank = instantiate(MINIONS["screwjank_clunker"]!); // 3/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { micro_machine: 10, alley_cat: 10, screwjank_clunker: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [mech, nonMech],
              shop: [screwjank],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Screwjank itself should be 3/3 (base stats)
    const screwjankOnBoard = board.find((m) => m.cardId === "screwjank_clunker");
    expect(screwjankOnBoard).toBeDefined();
    expect(screwjankOnBoard!.atk).toBe(3);
    expect(screwjankOnBoard!.hp).toBe(3);

    // The Mech (micro machine) should be buffed to 3/4 (1+2, 2+2)
    const mechOnBoard = board.find((m) => m.instanceId === mech.instanceId);
    expect(mechOnBoard).toBeDefined();
    expect(mechOnBoard!.atk).toBe(3); // 1 + 2
    expect(mechOnBoard!.hp).toBe(4); // 2 + 2
  });

  it("does NOT buff non-Mech friendly minions", () => {
    const base = makeInitialState(42);
    const nonMech = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const screwjank = instantiate(MINIONS["screwjank_clunker"]!); // 3/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, screwjank_clunker: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [nonMech],
              shop: [screwjank],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should NOT be buffed
    const catOnBoard = board.find((m) => m.instanceId === nonMech.instanceId);
    expect(catOnBoard!.atk).toBe(1);
    expect(catOnBoard!.hp).toBe(1);
  });

  it("does nothing when there are no friendly Mechs on board", () => {
    const base = makeInitialState(42);
    const nonMech1 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const nonMech2 = instantiate(MINIONS["flame_imp"]!); // 1/2 Demon
    const screwjank = instantiate(MINIONS["screwjank_clunker"]!); // 3/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, flame_imp: 10, screwjank_clunker: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [nonMech1, nonMech2],
              shop: [screwjank],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Neither non-Mech should be buffed
    const catOnBoard = board.find((m) => m.instanceId === nonMech1.instanceId);
    expect(catOnBoard!.atk).toBe(1);
    expect(catOnBoard!.hp).toBe(1);
    const impOnBoard = board.find((m) => m.instanceId === nonMech2.instanceId);
    expect(impOnBoard!.atk).toBe(3);
    expect(impOnBoard!.hp).toBe(1);
  });

  it("does nothing when board is empty (only Screwjank itself)", () => {
    const base = makeInitialState(42);
    const screwjank = instantiate(MINIONS["screwjank_clunker"]!); // 3/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { screwjank_clunker: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              shop: [screwjank],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(1);

    const screwjankOnBoard = board.find((m) => m.cardId === "screwjank_clunker");
    expect(screwjankOnBoard!.atk).toBe(3);
    expect(screwjankOnBoard!.hp).toBe(3);
  });
});
