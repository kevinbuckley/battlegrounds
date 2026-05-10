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
  const zixor = instantiate(MINIONS["zixor_project_hope"]!); // 3/6 Elemental
  const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: {
      zixor_project_hope: 10,
      murloc_scout: 10,
    },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 6 as Tier,
            board: [murlocScout],
            shop: [zixor, murlocScout],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Zixor, Project Hope — onBattlecry summons a random tier-5 minion to board
// ---------------------------------------------------------------------------

describe("zixor_project_hope — onBattlecry", () => {
  it("summons a random tier-5 minion to the player's board", () => {
    const state = makeTestState();
    const murlocOnBoard = state.players[0]!.board[0]!;
    const zixorOnShop = state.players[0]!.shop[0]!;

    // Buy Zixor from shop
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Zixor to board at index 1
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Zixor
      1, // board index 1
      RNG,
    );

    // Board should have 3 minions: murloc scout + zixor + summoned tier-5
    expect(afterPlay.players[0]!.board.length).toBe(3);

    // The summoned minion should be tier 5
    const summoned = afterPlay.players[0]!.board.find(
      (m) => m.instanceId !== murlocOnBoard.instanceId && m.instanceId !== zixorOnShop.instanceId,
    );
    expect(summoned).toBeDefined();
    expect(MINIONS[summoned!.cardId]!.tier).toBe(5);
  });

  it("respects board cap — does NOT summon when board is full", () => {
    const base = makeInitialState(42);
    const zixor = instantiate(MINIONS["zixor_project_hope"]!);
    const minions = Array.from({ length: 6 }, () => instantiate(MINIONS["murloc_scout"]!));

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { zixor_project_hope: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 6 as Tier,
              board: minions,
              shop: [zixor],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 6, RNG);

    // Board should have 7 minions (6 original + zixor), no summoned minion
    expect(afterPlay.players[0]!.board.length).toBe(7);
  });

  it("summons a tier-5 minion even when pool is empty (uses global MINIONS)", () => {
    const base = makeInitialState(42);
    const zixorOnShop = instantiate(MINIONS["zixor_project_hope"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { zixor_project_hope: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 6 as Tier,
              board: [],
              shop: [zixorOnShop],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    // Zixor + 1 summoned tier-5 minion (MINIONS has tier-5 cards globally)
    expect(afterPlay.players[0]!.board.length).toBe(2);
    const summoned = afterPlay.players[0]!.board.find(
      (m) => m.instanceId !== zixorOnShop.instanceId,
    );
    expect(summoned).toBeDefined();
    expect(MINIONS[summoned!.cardId]!.tier).toBe(5);
  });

  it("summoned minion is a MinionInstance with correct properties", () => {
    const state = makeTestState();
    const murlocOnBoard = state.players[0]!.board[0]!;
    const zixorOnShop = state.players[0]!.shop[0]!;

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const summoned = afterPlay.players[0]!.board.find(
      (m) => m.instanceId !== murlocOnBoard.instanceId && m.instanceId !== zixorOnShop.instanceId,
    );
    expect(summoned).toBeDefined();
    expect(summoned!.cardId).toMatch(/^[a-z_]+$/);
    expect(typeof summoned!.instanceId).toBe("string");
  });
});
