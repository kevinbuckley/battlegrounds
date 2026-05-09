import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Coldlight Oracle — battlecry draws 2 random minions from pool
// ---------------------------------------------------------------------------

describe("coldlight-oracle — onBattlecry", () => {
  it("draws 2 random minions from pool into hand when played to board", () => {
    const base = makeInitialState(42);
    const oracle = instantiate(MINIONS["coldlight_oracle"]!); // 2/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, murloc_tidecaller: 10, coldlight_oracle: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              hand: [],
              shop: [oracle],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const hand = afterPlay.players[0]!.hand;

    // Should have drawn 2 minions from the pool
    expect(hand.length).toBe(2);
    // Each drawn item should be a MinionInstance with a cardId
    for (const card of hand) {
      expect(card.cardId).toBeDefined();
      expect(card.atk).toBeGreaterThan(0);
      expect(card.hp).toBeGreaterThan(0);
    }
  });

  it("does nothing when the pool is depleted", () => {
    const base = makeInitialState(42);
    const oracle = instantiate(MINIONS["coldlight_oracle"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {}, // empty pool
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              hand: [],
              shop: [oracle],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const hand = afterPlay.players[0]!.hand;

    // No minions drawn from empty pool
    expect(hand.length).toBe(0);
  });

  it("draws minions matching the active tribe rotation", () => {
    const base = makeInitialState(42);
    const oracle = instantiate(MINIONS["coldlight_oracle"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, murloc_tidehunter: 10, coldlight_oracle: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              hand: [],
              shop: [oracle],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const hand = afterPlay.players[0]!.hand;

    // Should have drawn 2 murlocs from the pool
    expect(hand.length).toBe(2);
    for (const card of hand) {
      const cardDef = MINIONS[card.cardId as keyof typeof MINIONS];
      expect(cardDef?.tribes).toContain("Murloc");
    }
  });
});
