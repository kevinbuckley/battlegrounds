import { describe, expect, it } from "vitest";
import { defineMinion, instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { sellMinion } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: {},
    players: base.players.map((p, i) =>
      i === 0 ? { ...p, gold: 10, tier: 1, shop: [], hand: [], board: [], ...overrides } : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// onSell hook — fires when a minion is sold
// ---------------------------------------------------------------------------

describe("onSell hook", () => {
  it("fires when a minion with onSell is sold from board", () => {
    let callCount = 0;
    const sellMinionCard = defineMinion({
      id: "sell_test_minion",
      name: "Sell Test Minion",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onSell: ({ state, playerId }) => {
          callCount++;
          return state;
        },
      },
    });
    MINIONS[sellMinionCard.id] = sellMinionCard;

    const minion = instantiate(sellMinionCard);
    const state = makeTestState({ board: [minion] });

    const after = sellMinion(state, 0, 0, false);

    expect(callCount).toBe(1);
    expect(after.players[0]!.gold).toBe(11); // 10 base gold + 1 from selling
    expect(after.players[0]!.board).toHaveLength(0);
    // Clean up
    delete MINIONS[sellMinionCard.id];
  });

  it("fires when a minion with onSell is sold from hand", () => {
    let callCount = 0;
    const sellMinionCard = defineMinion({
      id: "sell_test_hand_minion",
      name: "Sell Test Hand Minion",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onSell: ({ state, playerId }) => {
          callCount++;
          return state;
        },
      },
    });
    MINIONS[sellMinionCard.id] = sellMinionCard;

    const minion = instantiate(sellMinionCard);
    const state = makeTestState({ hand: [minion] });

    const after = sellMinion(state, 0, 0, true);

    expect(callCount).toBe(1);
    expect(after.players[0]!.gold).toBe(11); // 10 base gold + 1 from selling
    expect(after.players[0]!.hand).toHaveLength(0);
    // Clean up
    delete MINIONS[sellMinionCard.id];
  });

  it("golden minion sells for 2 gold and fires onSell", () => {
    let callCount = 0;
    const sellMinionCard = defineMinion({
      id: "sell_test_golden",
      name: "Sell Test Golden",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onSell: ({ state, playerId }) => {
          callCount++;
          return state;
        },
      },
    });
    MINIONS[sellMinionCard.id] = sellMinionCard;

    const minion = instantiate(sellMinionCard, true);
    const state = makeTestState({ board: [minion] });

    const after = sellMinion(state, 0, 0, false);

    expect(callCount).toBe(1);
    expect(after.players[0]!.gold).toBe(12); // 10 base gold + 2 from golden sell
    // Clean up
    delete MINIONS[sellMinionCard.id];
  });

  it("does not fire onSell for minions without the hook", () => {
    const vanillaMinion = defineMinion({
      id: "vanilla_for_sell",
      name: "Vanilla For Sell",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[vanillaMinion.id] = vanillaMinion;

    const minion = instantiate(vanillaMinion);
    const state = makeTestState({ board: [minion] });

    const after = sellMinion(state, 0, 0, false);

    expect(after.players[0]!.gold).toBe(11);
    expect(after.players[0]!.board).toHaveLength(0);
    // Clean up
    delete MINIONS[vanillaMinion.id];
  });
});
