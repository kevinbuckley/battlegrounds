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
  const metaltooth = instantiate(MINIONS["metaltooth_leaper"]!); // 3/3 Mech
  const microMachine = instantiate(MINIONS["micro_machine"]!); // 1/2 Mech
  const annoyotron = instantiate(MINIONS["annoy_o_tron"]!); // 1/2 Mech divineShield
  const vanilla = instantiate(MINIONS["deck_swabbie"]!); // 1/1 non-Mech
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: {
      metaltooth_leaper: 10,
      micro_machine: 10,
      annoy_o_tron: 10,
      deck_swabbie: 10,
    },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1 as Tier,
            board: [microMachine, vanilla],
            shop: [metaltooth, annoyotron, vanilla],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Metaltooth Leaper — battlecry gives all OTHER friendly Mechs +2 ATK
// ---------------------------------------------------------------------------

describe("metaltooth_leaper — onBattlecry", () => {
  it("gives all OTHER friendly Mechs +2 ATK when played to board", () => {
    const state = makeTestState();
    const metaltoothCard = state.players[0]!.shop[0]!;
    const microMachineOnBoard0 = state.players[0]!.board[0]!;
    const deckSwabbieOnBoard1 = state.players[0]!.board[1]!;

    // Buy Metaltooth Leaper from shop
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Metaltooth Leaper to board at index 2
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Metaltooth Leaper
      2, // board index 2
      RNG,
    );

    // The Micro Machine should be buffed to 3/2 (1+2 ATK)
    const microOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === microMachineOnBoard0.instanceId,
    );
    expect(microOnBoard).toBeDefined();
    expect(microOnBoard!.atk).toBe(3); // 1 + 2
    expect(microOnBoard!.hp).toBe(2); // unchanged HP

    // The Deck Swabbie (non-Mech) should NOT be buffed
    const swabbieOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === deckSwabbieOnBoard1.instanceId,
    );
    expect(swabbieOnBoard).toBeDefined();
    expect(swabbieOnBoard!.atk).toBe(2);
    expect(swabbieOnBoard!.hp).toBe(2);

    // Metaltooth itself should be 3/3 (base stats, no self-buff)
    const mtOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === metaltoothCard.instanceId,
    );
    expect(mtOnBoard).toBeDefined();
    expect(mtOnBoard!.atk).toBe(3);
    expect(mtOnBoard!.hp).toBe(3);
  });

  it("does NOT buff non-Mech minions", () => {
    const base = makeInitialState(42);
    const metaltooth = instantiate(MINIONS["metaltooth_leaper"]!);
    const deckSwabbie = instantiate(MINIONS["deck_swabbie"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { metaltooth_leaper: 10, deck_swabbie: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [deckSwabbie],
              shop: [metaltooth, deckSwabbie],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const swabbieOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === deckSwabbie.instanceId,
    );
    expect(swabbieOnBoard!.atk).toBe(2);
    expect(swabbieOnBoard!.hp).toBe(2);
  });

  it("does nothing when there are no friendly Mechs on board", () => {
    const base = makeInitialState(42);
    const metaltooth = instantiate(MINIONS["metaltooth_leaper"]!);
    const deckSwabbie = instantiate(MINIONS["deck_swabbie"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { metaltooth_leaper: 10, deck_swabbie: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [deckSwabbie],
              shop: [metaltooth, deckSwabbie],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const swabbieOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === deckSwabbie.instanceId,
    );
    expect(swabbieOnBoard!.atk).toBe(2);
    expect(swabbieOnBoard!.hp).toBe(2);
  });

  it("stacks when multiple Metaltooth Leapers are played", () => {
    const base = makeInitialState(42);
    const microMachine = instantiate(MINIONS["micro_machine"]!); // 1/2
    const metaltooth1 = instantiate(MINIONS["metaltooth_leaper"]!);
    const metaltooth2 = instantiate(MINIONS["metaltooth_leaper"]!);
    const deckSwabbie = instantiate(MINIONS["deck_swabbie"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        metaltooth_leaper: 10,
        micro_machine: 10,
        deck_swabbie: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [microMachine],
              shop: [metaltooth1, metaltooth2, deckSwabbie],
            }
          : p,
      ),
    };

    // Buy and play first Metaltooth Leaper
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Buy and play second Metaltooth Leaper
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 2, RNG);

    // Micro Machine should be buffed +4 ATK total (2 Metaltooths × +2 ATK) → 5/2
    const microOnBoard = afterPlay2.players[0]!.board.find(
      (m) => m.instanceId === microMachine.instanceId,
    );
    expect(microOnBoard!.atk).toBe(5); // 1 + 2 + 2
    expect(microOnBoard!.hp).toBe(2);
  });

  it("buffs Mechs that gain Mech tribe via Nightmare Amalgam", () => {
    const base = makeInitialState(42);
    const metaltooth = instantiate(MINIONS["metaltooth_leaper"]!);
    const amalgam = instantiate(MINIONS["nightmare_amalgam"]!); // 2/4, counts as ALL tribes including Mech
    const deckSwabbie = instantiate(MINIONS["deck_swabbie"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        metaltooth_leaper: 10,
        nightmare_amalgam: 10,
        deck_swabbie: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [amalgam],
              shop: [metaltooth, deckSwabbie],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Amalgam counts as Mech, should be buffed to 4/4 (2+2 ATK)
    const amalgamOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgam.instanceId,
    );
    expect(amalgamOnBoard!.atk).toBe(4); // 2 + 2
    expect(amalgamOnBoard!.hp).toBe(4);
  });
});
