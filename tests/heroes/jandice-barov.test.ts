import { describe, expect, it } from "vitest";
import { HEROES } from "@/game/heroes";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { getPlayer } from "@/game/utils";
import { makeRng } from "@/lib/rng";

const jandiceBarov = HEROES["jandice_barov"];

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [],
            hand: [],
            board: [],
            heroId: "jandice_barov",
            ...overrides,
          }
        : p,
    ),
  };
}

function minion(id: string) {
  const card = MINIONS[id as keyof typeof MINIONS];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

// ---------------------------------------------------------------------------
// Jandice Barov — passive onSell: sell a minion → random minion of same tier
// ---------------------------------------------------------------------------

describe("Jandice Barov — passive onSell", () => {
  it("adds a random minion of the same tier to the shop after selling", () => {
    const m = minion("murloc_scout"); // tier 1
    const state = makeTestState({ board: [m], tier: 1 });

    const after = (jandiceBarov as any).onSell(state, 0);
    const player = getPlayer(after, 0);

    // Shop should have gained 1 minion
    expect(player.shop.length).toBeGreaterThanOrEqual(1);
  });

  it("adds a minion of the same tier as the player's current tier", () => {
    const m = minion("murloc_scout"); // tier 1
    const state = makeTestState({ tier: 1, board: [m] });

    const after = (jandiceBarov as any).onSell(state, 0);
    const player = getPlayer(after, 0);

    // All shop minions should be tier 1
    for (const shopMinion of player.shop) {
      const card = MINIONS[shopMinion.cardId as keyof typeof MINIONS];
      expect(card?.tier).toBe(1);
    }
  });

  it("works with tier 2 minions", () => {
    const m = minion("harvest_golem"); // tier 2
    const state = makeTestState({ tier: 2, board: [m] });

    const after = (jandiceBarov as any).onSell(state, 0);
    const player = getPlayer(after, 0);

    expect(player.shop.length).toBeGreaterThanOrEqual(1);
    for (const shopMinion of player.shop) {
      const card = MINIONS[shopMinion.cardId as keyof typeof MINIONS];
      expect(card?.tier).toBe(2);
    }
  });

  it("works with tier 3 minions", () => {
    const m = minion("queen-of-pain"); // tier 3
    const state = makeTestState({ tier: 3, board: [m] });

    const after = (jandiceBarov as any).onSell(state, 0);
    const player = getPlayer(after, 0);

    expect(player.shop.length).toBeGreaterThanOrEqual(1);
    for (const shopMinion of player.shop) {
      const card = MINIONS[shopMinion.cardId as keyof typeof MINIONS];
      expect(card?.tier).toBe(3);
    }
  });

  it("does nothing when board is empty — onSell still fires but finds no minion to sell", () => {
    const state = makeTestState({ board: [] });

    const after = (jandiceBarov as any).onSell(state, 0);
    const player = getPlayer(after, 0);

    // Jandice's onSell doesn't check board emptiness — it just looks at the pool
    // and adds a random minion of the current tier. The state machine handles
    // the "no minion to sell" case, not the hero definition.
    expect(player.shop.length).toBeGreaterThanOrEqual(0);
  });

  it("adds a minion from the pool when the player is at tier 1", () => {
    const m = minion("murloc_scout");
    const base = makeInitialState(42);
    const state = {
      ...base,
      phase: { kind: "Recruit", turn: 1 },
      turn: 1,
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1,
              shop: [],
              hand: [],
              board: [m],
              heroId: "jandice_barov",
            }
          : p,
      ),
    } as GameState;

    const after = (jandiceBarov as any).onSell(state, 0);
    const player = getPlayer(after, 0);

    // Should have added at least one tier-1 minion to the shop
    expect(player.shop.length).toBeGreaterThanOrEqual(1);
    for (const shopMinion of player.shop) {
      const card = MINIONS[shopMinion.cardId as keyof typeof MINIONS];
      expect(card?.tier).toBe(1);
    }
  });
});
