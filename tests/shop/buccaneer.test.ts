import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Buccaneer — battlecry gives a random friendly Pirate +2/+2
// ---------------------------------------------------------------------------

describe("buccaneer — onBattlecry", () => {
  it("gives a random friendly Pirate +2/+2 when played to board", () => {
    const base = makeInitialState(42);
    const pirate = instantiate(MINIONS["southsea-strongarm"]!); // 5/4 Pirate
    const nonPirate = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const buccaneer = instantiate(MINIONS["buccaneer"]!); // 3/2 Pirate

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, southsea_strongarm: 10, buccaneer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [pirate, nonPirate],
              shop: [buccaneer],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Buccaneer itself should be 3/2 (base stats)
    const buccaneerOnBoard = board.find((m) => m.cardId === "buccaneer");
    expect(buccaneerOnBoard).toBeDefined();
    expect(buccaneerOnBoard!.atk).toBe(3);
    expect(buccaneerOnBoard!.hp).toBe(2);

    // The Pirate (southsea strongarm) should be buffed to 7/6 (5+2, 4+2)
    const pirateOnBoard = board.find((m) => m.instanceId === pirate.instanceId);
    expect(pirateOnBoard).toBeDefined();
    expect(pirateOnBoard!.atk).toBe(7); // 5 + 2
    expect(pirateOnBoard!.hp).toBe(6); // 4 + 2
  });

  it("does NOT buff non-Pirate friendly minions", () => {
    const base = makeInitialState(42);
    const nonPirate = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const buccaneer = instantiate(MINIONS["buccaneer"]!); // 3/2 Pirate

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, buccaneer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [nonPirate],
              shop: [buccaneer],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should NOT be buffed
    const catOnBoard = board.find((m) => m.instanceId === nonPirate.instanceId);
    expect(catOnBoard!.atk).toBe(1);
    expect(catOnBoard!.hp).toBe(1);
  });

  it("does nothing when there are no other Pirates on board", () => {
    const base = makeInitialState(42);
    const nonPirate = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const buccaneer = instantiate(MINIONS["buccaneer"]!); // 3/2 Pirate

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, buccaneer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [nonPirate],
              shop: [buccaneer],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Buccaneer should not buff itself
    const buccaneerOnBoard = board.find((m) => m.cardId === "buccaneer");
    expect(buccaneerOnBoard!.atk).toBe(3);
    expect(buccaneerOnBoard!.hp).toBe(2);
  });

  it("stacks across multiple Buccaneers — first pirate on board gets buffed", () => {
    const base = makeInitialState(42);
    const buccaneer1 = instantiate(MINIONS["buccaneer"]!); // 3/2 Pirate
    const buccaneer2 = instantiate(MINIONS["buccaneer"]!); // 3/2 Pirate

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { buccaneer: 20 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              shop: [buccaneer1, buccaneer2],
            }
          : p,
      ),
    };

    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 0, RNG);
    // After buying index 0, the shop shifts — buccaneer2 is now at index 0
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 0, RNG);

    const board = afterPlay2.players[0]!.board;

    // First Buccaneer (index 0) gets buffed by second's battlecry: 5/4
    // Second Buccaneer (index 1) stays at 3/2 (it's the one being played, skips self)
    const b1OnBoard = board.find((m) => m.instanceId === buccaneer1.instanceId);
    const b2OnBoard = board.find((m) => m.instanceId === buccaneer2.instanceId);
    expect(b1OnBoard).toBeDefined();
    expect(b2OnBoard).toBeDefined();
    expect(b1OnBoard!.atk).toBe(5); // 3 + 2
    expect(b1OnBoard!.hp).toBe(4); // 2 + 2
    expect(b2OnBoard!.atk).toBe(3); // base, not buffed (it's the attacker)
    expect(b2OnBoard!.hp).toBe(2); // base
  });
});
