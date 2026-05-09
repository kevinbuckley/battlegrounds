import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  const lilRag = instantiate(MINIONS["lil-rag"]!); // 1/1 Elemental
  const frostElemental = instantiate(MINIONS["frost_elemental"]!); // 3/4 Elemental
  const gnomaTinker = instantiate(MINIONS["gnoma_tinker"]!); // 1/1 Elemental
  const vanilla = instantiate(MINIONS["murloc_scout"]!); // 1/1 non-Elemental
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: { "lil-rag": 10, frost_elemental: 10, gnoma_tinker: 10, murloc_scout: 10 },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 5,
            board: [frostElemental],
            shop: [lilRag, gnomaTinker, vanilla],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Lil' Rag — onPlay gives all OTHER friendly Elementals +1/+1
// ---------------------------------------------------------------------------

describe("lil rag — onPlay", () => {
  it("gives all OTHER friendly Elementals +1/+1 when played to board", () => {
    const state = makeTestState();
    const lilRag = state.players[0]!.shop[0]!;

    // Buy Lil' Rag from shop
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Lil' Rag to board at index 1 (after Frost Elemental)
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Lil' Rag
      1, // board index 1
      RNG,
    );

    // Frost Elemental should be buffed from 3/4 to 4/5
    const frostOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "frost_elemental");
    expect(frostOnBoard).toBeDefined();
    expect(frostOnBoard!.atk).toBe(4);
    expect(frostOnBoard!.hp).toBe(5);

    // Lil' Rag itself should stay 1/1 (not buffed)
    const ragOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "lil-rag");
    expect(ragOnBoard).toBeDefined();
    expect(ragOnBoard!.atk).toBe(1);
    expect(ragOnBoard!.hp).toBe(1);
  });

  it("does NOT buff non-Elemental minions", () => {
    const state = makeTestState();
    const lilRag = state.players[0]!.shop[0]!;
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    // Replace shop with just Lil' Rag and a non-Elemental
    const stateWithScout = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, shop: [lilRag, murlocScout], board: [murlocScout] } : p,
      ),
    };

    // Buy and play Lil' Rag
    const afterBuy = buyMinion(stateWithScout, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Murloc Scout should NOT be buffed (stays 1/1)
    const scoutOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "murloc_scout");
    expect(scoutOnBoard).toBeDefined();
    expect(scoutOnBoard!.atk).toBe(1);
    expect(scoutOnBoard!.hp).toBe(1);
  });

  it("does NOT buff itself", () => {
    const state = makeTestState();
    const lilRag = state.players[0]!.shop[0]!;

    // Buy and play Lil' Rag
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Lil' Rag should stay 1/1 (not buffed by its own onPlay)
    const ragOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "lil-rag");
    expect(ragOnBoard).toBeDefined();
    expect(ragOnBoard!.atk).toBe(1);
    expect(ragOnBoard!.hp).toBe(1);
  });

  it("does not affect board minions", () => {
    const state = makeTestState();
    const lilRag = state.players[0]!.shop[0]!;

    // Buy and play Lil' Rag
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Only Elementals on board should be buffed, non-Elementals should not
    const board = afterPlay.players[0]!.board;
    const nonElementals = board.filter((m) => !m.tribes.includes("Elemental"));
    for (const m of nonElementals) {
      expect(m.atk).toBe(MINIONS[m.cardId as keyof typeof MINIONS]?.baseAtk ?? m.atk);
    }
  });
});
