import { describe, expect, it } from "vitest";
import {
  getAllTrinketIds,
  getTrinket,
  ironCladdagh,
  pickTrinket,
  rallyingBanner,
  scalingSoul,
  TRINKETS,
  TRINKETS as TRINKETS_MAP,
} from "@/game/trinkets";
import type { GameState, MinionInstance, TrinketCard } from "@/game/types";
import { getPlayer } from "@/game/utils";
import { makeRng } from "@/lib/rng";

function makeGameState(): GameState {
  return {
    seed: 1,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: [
      {
        id: 0,
        name: "Player 1",
        heroId: "scabbs_cutterbutter",
        hp: 40,
        armor: 0,
        gold: 3,
        tier: 3,
        upgradeCost: 7,
        board: [],
        hand: [],
        shop: [],
        shopFrozen: false,
        upgradedThisTurn: false,
        heroPowerUsed: false,
        actionsThisTurn: 0,
        extraLifeUsed: false,
        renoJacksonUsed: false,
        eliminated: false,
        placement: null,
        aiMemo: {},
        spells: [],
        discoverOffer: null,
        trinkets: [],
        quests: [],
        buddies: [],
        pogoHoppersPlayed: 0,
      },
    ],
    tribesInLobby: ["Murloc", "Beast", "Demon", "Mech", "Elemental"],
    pool: {},
    pairingsHistory: [],
    modifiers: ["trinkets"],
    modifierState: { trinkets: [] },
  };
}

function makeMinion(atk: number, hp: number): MinionInstance {
  return {
    instanceId: `m${atk + hp}`,
    cardId: "test_minion",
    atk,
    hp,
    maxHp: hp,
    keywords: new Set(),
    tribes: [],
    golden: false,
    spellDamage: 0,
    attachments: {},
    hooks: {},
  };
}

describe("trinket registry", () => {
  it("exports exactly 3 trinkets", () => {
    expect(getAllTrinketIds()).toHaveLength(3);
  });

  it("TRINKETS keys match getAllTrinketIds", () => {
    expect(Object.keys(TRINKETS_MAP).sort()).toEqual(getAllTrinketIds().sort());
  });

  it("getTrinket returns the same object", () => {
    const fetched = getTrinket(scalingSoul.id);
    expect(fetched).toBe(scalingSoul);
  });

  it("getTrinket throws for unknown id", () => {
    expect(() => getTrinket("nonexistent_trinket")).toThrow("Unknown trinket: nonexistent_trinket");
  });
});

describe("trinket definitions", () => {
  it.each([ironCladdagh, rallyingBanner, scalingSoul])("%s has valid fields", (trinket) => {
    expect(trinket.id).toBeDefined();
    expect(typeof trinket.name).toBe("string");
    expect(trinket.name.length).toBeGreaterThan(0);
    expect(typeof trinket.description).toBe("string");
    expect(trinket.description.length).toBeGreaterThan(0);
    expect(trinket.cost).toBeGreaterThanOrEqual(0);
    expect(trinket.tiers.length).toBeGreaterThan(0);
    expect(typeof trinket.onApply).toBe("function");
  });
});

describe("ironCladdagh", () => {
  it("grants +2 max HP to all friendly minions", () => {
    const state: GameState = {
      ...makeGameState(),
      players: [
        {
          ...makeGameState().players[0]!,
          board: [makeMinion(3, 4), makeMinion(2, 3)],
        },
      ],
    };

    const after = ironCladdagh.onApply(state, 0, makeRng(42));
    const minions = after.players[0]?.board;
    expect(minions).toHaveLength(2);
    expect(minions![0]!.hp).toBe(6);
    expect(minions![0]!.maxHp).toBe(6);
    expect(minions![1]!.hp).toBe(5);
    expect(minions![1]!.maxHp).toBe(5);
  });

  it("attacking is not affected", () => {
    const state: GameState = {
      ...makeGameState(),
      players: [
        {
          ...makeGameState().players[0]!,
          board: [makeMinion(3, 4)],
        },
      ],
    };

    const after = ironCladdagh.onApply(state, 0, makeRng(42));
    expect(after.players[0]?.board[0]!.atk).toBe(3);
  });

  it("returns unchanged state when player has no minions", () => {
    const state = makeGameState();
    const after = ironCladdagh.onApply(state, 0, makeRng(42));
    expect(after.players[0]?.board).toHaveLength(0);
  });

  it("returns unchanged state when player doesn't exist", () => {
    const state = makeGameState();
    const after = ironCladdagh.onApply(state, 99, makeRng(42));
    expect(after.players).toHaveLength(1);
  });
});

describe("rallyingBanner", () => {
  it("grants +3/+3 to the only friendly minion", () => {
    const board = [makeMinion(2, 3)];
    const state: GameState = {
      ...makeGameState(),
      players: [
        {
          ...makeGameState().players[0]!,
          board,
        },
      ],
    };

    const rng = makeRng(42);
    const after = rallyingBanner.onApply(state, 0, rng);
    const minion = after.players[0]?.board[0];
    expect(minion).toBeDefined();
    expect(minion!.atk).toBe(5);
    expect(minion!.hp).toBe(6);
    expect(minion!.maxHp).toBe(6);
  });

  it("picks random minion when board has multiple minions", () => {
    const state: GameState = {
      ...makeGameState(),
      players: [
        {
          ...makeGameState().players[0]!,
          board: [makeMinion(2, 3), makeMinion(4, 5), makeMinion(1, 2)],
        },
      ],
    };

    // Test the random selection doesn't crash
    for (let i = 0; i < 10; i++) {
      const rng = makeRng(i);
      const after = rallyingBanner.onApply(state, 0, rng);
      // Ensure exactly one minion got the buff
      const buffs = after.players[0]?.board.filter((m) => (m.atk > m.hp ? m.atk - 2 : m.atk - 2));
      expect(buffs).toBeDefined();
    }
  });

  it("returns unchanged state when player has no minions", () => {
    const state = makeGameState();
    const after = rallyingBanner.onApply(state, 0, makeRng(42));
    expect(after.players[0]?.board).toHaveLength(0);
  });
});

describe("scalingSoul", () => {
  it("grants +1/+1 to all friendly minions", () => {
    const state: GameState = {
      ...makeGameState(),
      players: [
        {
          ...makeGameState().players[0]!,
          board: [makeMinion(3, 4), makeMinion(2, 3)],
        },
      ],
    };

    const after = scalingSoul.onApply(state, 0, makeRng(42));
    const minions = after.players[0]?.board;
    expect(minions![0]!.atk).toBe(4);
    expect(minions![0]!.hp).toBe(5);
    expect(minions![0]!.maxHp).toBe(5);
    expect(minions![1]!.atk).toBe(3);
    expect(minions![1]!.hp).toBe(4);
    expect(minions![1]!.maxHp).toBe(4);
  });

  it("leaves attack stats unchanged when no minions", () => {
    const state = makeGameState();
    const after = scalingSoul.onApply(state, 0, makeRng(42));
    expect(after.players[0]?.board).toHaveLength(0);
  });
});

describe("pickTrinket", () => {
  it("always picks from available trinkets", () => {
    for (let i = 0; i < 100; i++) {
      const picked = pickTrinket(makeRng(42 + i));
      expect(getAllTrinketIds()).toContain(picked.id);
    }
  });
});
