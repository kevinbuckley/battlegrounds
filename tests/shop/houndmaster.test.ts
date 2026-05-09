import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  const houndmaster = instantiate(MINIONS["houndmaster"]!); // 4/3
  const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
  const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1 non-Beast
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: { houndmaster: 10, alley_cat: 10, murloc_scout: 10 },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1 as Tier,
            board: [alleyCat],
            shop: [houndmaster, murlocScout],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Houndmaster — battlecry gives a friendly Beast +2/+2 and taunt
// ---------------------------------------------------------------------------

describe("houndmaster — onBattlecry", () => {
  it("gives a friendly Beast +2/+2 and taunt when played to board", () => {
    const state = makeTestState();
    const houndmasterCard = state.players[0]!.shop[0]!;
    const alleyCatOnBoard0 = state.players[0]!.board[0]!;

    // Buy Houndmaster from shop
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Houndmaster to board at index 1 (after the Alley Cat)
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Houndmaster
      1, // board index 1
      RNG,
    );

    // The Alley Cat (Beast) should be buffed to 3/3 with taunt
    const alleyCatOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === alleyCatOnBoard0.instanceId,
    );
    expect(alleyCatOnBoard).toBeDefined();
    expect(alleyCatOnBoard!.atk).toBe(3); // 1 + 2
    expect(alleyCatOnBoard!.hp).toBe(3); // 1 + 2
    expect(alleyCatOnBoard!.keywords).toContain("taunt");

    // Houndmaster itself should be 4/3 (base stats, no self-buff)
    const hmOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === houndmasterCard.instanceId,
    );
    expect(hmOnBoard).toBeDefined();
    expect(hmOnBoard!.atk).toBe(4);
    expect(hmOnBoard!.hp).toBe(3);
  });

  it("does NOT buff non-Beast minions", () => {
    const base = makeInitialState(42);
    const houndmaster = instantiate(MINIONS["houndmaster"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { houndmaster: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [murlocScout],
              shop: [houndmaster, murlocScout],
            }
          : p,
      ),
    };

    // Buy and play Houndmaster
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // The Murloc Scout should NOT be buffed (stays 1/1, no taunt)
    const murlocOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "murloc_scout");
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(1);
    expect(murlocOnBoard!.keywords).not.toContain("taunt");
  });

  it("does nothing when there are no friendly Beasts on board", () => {
    const base = makeInitialState(42);
    const houndmaster = instantiate(MINIONS["houndmaster"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { houndmaster: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [murlocScout],
              shop: [houndmaster, murlocScout],
            }
          : p,
      ),
    };

    // Buy and play Houndmaster
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // The Murloc Scout should be unchanged (no Beast to buff)
    const murlocOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "murloc_scout");
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(1);
    expect(murlocOnBoard!.keywords).not.toContain("taunt");
  });

  it("stacks when multiple Houndmasters are played", () => {
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const houndmaster1 = instantiate(MINIONS["houndmaster"]!);
    const houndmaster2 = instantiate(MINIONS["houndmaster"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        houndmaster: 10,
        alley_cat: 10,
        murloc_scout: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [alleyCat],
              shop: [houndmaster1, houndmaster2, murlocScout],
            }
          : p,
      ),
    };

    // Buy and play first Houndmaster
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Buy and play second Houndmaster
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 2, RNG);

    // Alley Cat should be buffed +4/+4 total (2 Houndmasters × +2/+2) → 5/5 with taunt
    const alleyCatOnBoard = afterPlay2.players[0]!.board.find((m) => m.cardId === "alley_cat");
    expect(alleyCatOnBoard!.atk).toBe(5); // 1 + 2 + 2
    expect(alleyCatOnBoard!.hp).toBe(5); // 1 + 2 + 2
    expect(alleyCatOnBoard!.keywords).toContain("taunt");
  });
});
