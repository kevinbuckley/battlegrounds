import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Bloodsail Cannoneer — battlecry gives the FIRST friendly Pirate on board
// +3 ATK (only the first, not all); skips itself.
// ---------------------------------------------------------------------------

describe("bloodsail-cannoneer — onBattlecry", () => {
  it("gives +3 ATK to first friendly Pirate on board", () => {
    const base = makeInitialState(42);
    const cannoner = instantiate(MINIONS["bloodsail_cannoneer"]!); // 2/3 Pirate
    const pirate = instantiate(MINIONS["southsea-strongarm"]!); // 5/4 Pirate

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { bloodsail_cannoneer: 10, southsea_strongarm: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [pirate],
              shop: [cannoner],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const c = board.find((m) => m.cardId === "bloodsail_cannoneer");
    const s = board.find((m) => m.instanceId === pirate.instanceId);

    expect(c).toBeDefined();
    expect(s).toBeDefined();
    // Cannoneer stays at base stats (battlecry skips self)
    expect(c!.atk).toBe(2);
    expect(c!.hp).toBe(3);
    // First pirate gets +3 ATK: 5+3=8, hp unchanged 4
    expect(s!.atk).toBe(8);
    expect(s!.hp).toBe(4);
  });

  it("does NOT buff non-Pirate friendly minions", () => {
    const base = makeInitialState(42);
    const cannoner = instantiate(MINIONS["bloodsail_cannoneer"]!); // 2/3 Pirate
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { bloodsail_cannoneer: 10, alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [cannoner],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const cat = board.find((m) => m.instanceId === beast.instanceId);
    expect(cat!.atk).toBe(1);
    expect(cat!.hp).toBe(1);
  });

  it("does nothing when there are no other Pirates on board", () => {
    const base = makeInitialState(42);
    const cannoner = instantiate(MINIONS["bloodsail_cannoneer"]!); // 2/3 Pirate
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { bloodsail_cannoneer: 10, alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [cannoner],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const c = board.find((m) => m.cardId === "bloodsail_cannoneer");
    expect(c).toBeDefined();
    // Cannoneer should stay at base stats (no other pirates to buff)
    expect(c!.atk).toBe(2);
    expect(c!.hp).toBe(3);
  });

  it("buffs only the first Pirate, not subsequent ones", () => {
    const base = makeInitialState(42);
    const cannoner = instantiate(MINIONS["bloodsail_cannoneer"]!); // 2/3 Pirate
    const pirate1 = instantiate(MINIONS["southsea-strongarm"]!); // 5/4 Pirate
    const pirate2 = instantiate(MINIONS["bloodsail_pirate"]!); // 1/2 Pirate

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        bloodsail_cannoneer: 10,
        southsea_strongarm: 10,
        bloodsail_pirate: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [pirate1, pirate2],
              shop: [cannoner],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const c = board.find((m) => m.cardId === "bloodsail_cannoneer");
    const s = board.find((m) => m.instanceId === pirate1.instanceId);
    const bp = board.find((m) => m.instanceId === pirate2.instanceId);

    expect(c).toBeDefined();
    expect(s).toBeDefined();
    expect(bp).toBeDefined();
    // First pirate (southsea-strongarm) gets +3 ATK: 5+3=8
    expect(s!.atk).toBe(8);
    expect(s!.hp).toBe(4);
    // Second pirate (bloodsail-pirate) NOT buffed: stays 1/2
    expect(bp!.atk).toBe(1);
    expect(bp!.hp).toBe(2);
    // Cannoneer itself stays at base: 2/3
    expect(c!.atk).toBe(2);
    expect(c!.hp).toBe(3);
  });
});
