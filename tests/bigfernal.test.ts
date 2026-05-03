import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState() {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    players: base.players.map((p) => ({ ...p, gold: 10, tier: 5 as const })),
  };
}

// Test Bigfernal — tier 5 demon gains +2/+2 when another friendly demon is summoned
describe("Bigfernal", () => {
  it("gains +2/+2 when a friendly demon is summoned to board", () => {
    const state = makeTestState();

    const bigfernal = instantiate(getMinion("bigfernal"));
    const demon = instantiate(getMinion("flame_imp"));

    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [bigfernal, demon] } : p)),
    };

    // Buy Bigfernal (moves to hand)
    const afterBuyBf = buyMinion(stateWithShop, 0, 0);
    expect(afterBuyBf.players[0]!.hand).toHaveLength(1);
    expect(afterBuyBf.players[0]!.hand[0]!.cardId).toBe("bigfernal");

    // Play Bigfernal to board
    const afterPlayBf = playMinionToBoard(afterBuyBf, 0, 0, 0, RNG);
    expect(afterPlayBf.players[0]!.board).toHaveLength(1);
    expect(afterPlayBf.players[0]!.board[0]!.atk).toBe(3);
    expect(afterPlayBf.players[0]!.board[0]!.hp).toBe(6);

    // Buy the demon (moves to hand)
    const afterBuyDemon = buyMinion(afterPlayBf, 0, 0);
    expect(afterBuyDemon.players[0]!.hand).toHaveLength(1);

    // Play demon to board — Bigfernal should gain +2/+2 via onShopSummon
    const afterPlayDemon = playMinionToBoard(afterBuyDemon, 0, 0, 0, RNG);
    const bf = afterPlayDemon.players[0]!.board.find((m) => m.cardId === "bigfernal");
    expect(bf).toBeDefined();
    expect(bf!.atk).toBe(5);
    expect(bf!.hp).toBe(8);
  });

  it("does not buff when a non-demon is summoned", () => {
    const state = makeTestState();

    const bigfernal = instantiate(getMinion("bigfernal"));
    const minion = instantiate(getMinion("bloodsail_pirate"));

    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [bigfernal, minion] } : p)),
    };

    const afterBuyBf = buyMinion(stateWithShop, 0, 0);
    const afterPlayBf = playMinionToBoard(afterBuyBf, 0, 0, 0, RNG);
    expect(afterPlayBf.players[0]!.board[0]!.atk).toBe(3);
    expect(afterPlayBf.players[0]!.board[0]!.hp).toBe(6);

    const afterBuyMinion = buyMinion(afterPlayBf, 0, 0);
    const afterPlayMinion = playMinionToBoard(afterBuyMinion, 0, 0, 0, RNG);
    const bf = afterPlayMinion.players[0]!.board.find((m) => m.cardId === "bigfernal");
    expect(bf).toBeDefined();
    expect(bf!.atk).toBe(3);
    expect(bf!.hp).toBe(6);
  });

  it("stacks with multiple demons summoned", () => {
    const state = makeTestState();

    const bigfernal = instantiate(getMinion("bigfernal"));
    const demon1 = instantiate(getMinion("flame_imp"));
    const demon2 = instantiate(getMinion("vulgar_homunculus"));

    const stateWithShop = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, shop: [bigfernal, demon1, demon2] } : p,
      ),
    };

    const afterBuyBf = buyMinion(stateWithShop, 0, 0);
    const afterPlayBf = playMinionToBoard(afterBuyBf, 0, 0, 0, RNG);

    const afterBuyD1 = buyMinion(afterPlayBf, 0, 0);
    const afterPlayD1 = playMinionToBoard(afterBuyD1, 0, 0, 0, RNG);

    const afterBuyD2 = buyMinion(afterPlayD1, 0, 0);
    const afterPlayD2 = playMinionToBoard(afterBuyD2, 0, 0, 0, RNG);

    const bf = afterPlayD2.players[0]!.board.find((m) => m.cardId === "bigfernal");
    expect(bf).toBeDefined();
    expect(bf!.atk).toBe(7); // 3 + 2 + 2
    expect(bf!.hp).toBe(10); // 6 + 2 + 2
  });
});
