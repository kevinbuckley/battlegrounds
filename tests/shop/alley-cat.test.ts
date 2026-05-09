import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Alley Cat — battlecry summons a random minion from your hand
// ---------------------------------------------------------------------------

describe("alley_cat — battlecry", () => {
  it("summons a random minion from hand to board", () => {
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const handMinion1 = instantiate(MINIONS["murloc_scout"]!); // 1/2 Murloc
    const handMinion2 = instantiate(MINIONS["flame_imp"]!); // 1/2 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        alley_cat: 10,
        murloc_scout: 10,
        flame_imp: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              hand: [handMinion1, handMinion2],
              shop: [alleyCat],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 2, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(2); // Alley Cat + 1 from hand

    // The summoned minion should be one of the hand minions
    const summoned = board.find((m) => m.instanceId !== alleyCat.instanceId);
    expect(summoned).toBeDefined();
    expect([handMinion1.instanceId, handMinion2.instanceId]).toContain(summoned!.instanceId);

    // The summoned minion should no longer be in hand
    const hand = afterPlay.players[0]!.hand;
    expect(hand).not.toContainEqual(summoned!);
  });

  it("does nothing when hand is empty", () => {
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              hand: [],
              shop: [alleyCat],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(1); // Only Alley Cat, nothing summoned
  });

  it("does nothing when board is full (7 minions)", () => {
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!);
    const existingMinions = [
      instantiate(MINIONS["murloc_scout"]!),
      instantiate(MINIONS["flame_imp"]!),
      instantiate(MINIONS["virmen_sensei"]!),
      instantiate(MINIONS["bloodsail_pirate"]!),
      instantiate(MINIONS["deck_swabbie"]!),
      instantiate(MINIONS["murloc_tidehunter"]!),
    ];
    const handMinion = instantiate(MINIONS["murloc_tidecaller"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        alley_cat: 10,
        murloc_scout: 10,
        flame_imp: 10,
        virmen_sensei: 10,
        bloodsail_pirate: 10,
        deck_swabbie: 10,
        murloc_tidehunter: 10,
        murloc_tidecaller: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: existingMinions,
              hand: [handMinion],
              shop: [alleyCat],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 1, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(7); // Board cap, no summon from battlecry
  });

  it("summons Alley Cat itself from hand (self-referential)", () => {
    // If hand contains a copy of Alley Cat, it can summon itself
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!);
    const anotherAlleyCat = instantiate(MINIONS["alley_cat"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [],
              hand: [anotherAlleyCat],
              shop: [alleyCat],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 1, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(2); // Both Alley Cats on board
  });
});
