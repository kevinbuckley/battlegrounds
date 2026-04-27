import { beforeEach, describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { HEROES } from "./heroes/index";
import { defineMinion, instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import {
  buyMinion,
  drawFromPool,
  freezeShop,
  playMinionToBoard,
  refreshShop,
  reorderBoard,
  returnToPool,
  rollShopForPlayer,
  sellMinion,
  upgradeTier,
} from "./shop";
import { beginRecruitTurn, makeInitialState } from "./state";
import type { GameState, MinionInstance } from "./types";

// Register a test minion into the global MINIONS registry
const TEST_CARD = defineMinion({
  id: "test_murloc",
  name: "Test Murloc",
  tier: 1,
  tribes: ["Murloc"],
  baseAtk: 2,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});
MINIONS[TEST_CARD.id] = TEST_CARD;

const TEST_CARD_2 = defineMinion({
  id: "test_beast",
  name: "Test Beast",
  tier: 2,
  tribes: ["Beast"],
  baseAtk: 3,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {},
});

// Test minion with a battlecry that is easy to observe
const TEST_BATTLECRY_CARD = defineMinion({
  id: "test_battlecry",
  name: "Test Battlecry",
  tier: 1,
  tribes: [],
  baseAtk: 1,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self }) => {
      return {
        ...state,
        players: state.players.map((p, i) =>
          i !== playerId
            ? p
            : {
                ...p,
                hand: [
                  ...p.hand,
                  instantiate(
                    defineMinion({
                      id: "battlecry_coin",
                      name: "Battlecry Coin",
                      tier: 1,
                      tribes: [],
                      baseAtk: 0,
                      baseHp: 0,
                      baseKeywords: [],
                      spellDamage: 0,
                      hooks: {},
                    }),
                  ),
                ],
              },
        ),
      };
    },
  },
});
MINIONS[TEST_BATTLECRY_CARD.id] = TEST_BATTLECRY_CARD;
MINIONS[TEST_CARD_2.id] = TEST_CARD_2;

const RNG = makeRng(42);

// Build a state at recruit turn 1 with player 0 having 10 gold and the test
// minion pre-loaded into their shop.
function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  const shopMinion = instantiate(TEST_CARD);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: { test_murloc: 10, test_beast: 10, test_battlecry: 10 },
    players: base.players.map((p, i) =>
      i === 0
        ? { ...p, gold: 10, tier: 1, shop: [shopMinion], hand: [], board: [], ...overrides }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Pool
// ---------------------------------------------------------------------------

describe("drawFromPool", () => {
  it("draws up to count from eligible cards", () => {
    const pool = { test_murloc: 5, test_beast: 5 };
    const { instances, pool: after } = drawFromPool(pool, 1, 3, makeRng(1));
    // Only tier-1 cards eligible at tier 1
    expect(instances).toHaveLength(3);
    expect(instances.every((m) => m.cardId === "test_murloc")).toBe(true);
    expect(after.test_murloc).toBe(2);
  });

  it("includes higher-tier cards when player tier allows", () => {
    const pool = { test_murloc: 3, test_beast: 3 };
    const { instances } = drawFromPool(pool, 2, 6, makeRng(99));
    const ids = instances.map((m) => m.cardId);
    expect(ids).toContain("test_murloc");
    expect(ids).toContain("test_beast");
  });

  it("draws fewer than count when pool is sparse", () => {
    const pool = { test_murloc: 2 };
    const { instances, pool: after } = drawFromPool(pool, 1, 5, makeRng(1));
    expect(instances).toHaveLength(2);
    expect(after.test_murloc).toBe(0);
  });
});

describe("returnToPool", () => {
  it("increments pool counts for each returned instance", () => {
    const inst = instantiate(TEST_CARD);
    const after = returnToPool({ test_murloc: 0 }, [inst]);
    expect(after.test_murloc).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Buy
// ---------------------------------------------------------------------------

describe("buyMinion", () => {
  it("moves shop minion to hand and deducts 3 gold", () => {
    const state = makeTestState();
    const shopCardId = state.players[0]!.shop[0]!.cardId;
    const after = buyMinion(state, 0, 0);
    const p = after.players[0]!;
    expect(p.gold).toBe(7);
    expect(p.hand).toHaveLength(1);
    expect(p.hand[0]!.cardId).toBe(shopCardId);
    expect(p.shop).toHaveLength(0);
  });

  it("throws when not enough gold", () => {
    const state = makeTestState({ gold: 2 });
    expect(() => buyMinion(state, 0, 0)).toThrow("Not enough gold");
  });

  it("throws when hand is full", () => {
    const hand: MinionInstance[] = Array.from({ length: 10 }, () => instantiate(TEST_CARD));
    const state = makeTestState({ hand });
    expect(() => buyMinion(state, 0, 0)).toThrow("Hand is full");
  });

  it("throws for invalid shop index", () => {
    const state = makeTestState();
    expect(() => buyMinion(state, 0, 5)).toThrow("No minion at shop index 5");
  });
});

// ---------------------------------------------------------------------------
// Sell
// ---------------------------------------------------------------------------

describe("sellMinion", () => {
  it("removes minion from board, adds 1 gold, returns to pool", () => {
    const boardMinion = instantiate(TEST_CARD);
    const state = makeTestState({ board: [boardMinion], gold: 5 });
    const after = sellMinion(state, 0, 0);
    const p = after.players[0]!;
    expect(p.board).toHaveLength(0);
    expect(p.gold).toBe(6);
    expect(after.pool.test_murloc).toBeGreaterThan(state.pool.test_murloc ?? 0);
  });

  it("throws for invalid board index", () => {
    const state = makeTestState({ board: [] });
    expect(() => sellMinion(state, 0, 0)).toThrow("No minion at board index 0");
  });

  it("calls hero.onSell when the player's hero has one (Jandice Barov)", () => {
    const boardMinion = instantiate(TEST_CARD);
    const base = makeInitialState(42);
    const state = {
      ...base,
      phase: { kind: "Recruit", turn: 1 },
      turn: 1,
      pool: { test_murloc: 10, test_beast: 10, test_battlecry: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1,
              shop: [],
              hand: [],
              board: [boardMinion],
              heroId: "jandice_barov",
            }
          : p,
      ),
    } as GameState;
    const beforeShop = state.players[0]!.shop.length;
    const after = sellMinion(state, 0, 0);
    // Jandice's onSell should have added a minion to the shop
    expect(after.players[0]!.shop.length).toBeGreaterThan(beforeShop);
  });

  it("does not call onSell for non-Jandice heroes", () => {
    const boardMinion = instantiate(TEST_CARD);
    const base = makeInitialState(42);
    const state = {
      ...base,
      phase: { kind: "Recruit", turn: 1 },
      turn: 1,
      pool: { test_murloc: 10, test_beast: 10, test_battlecry: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1,
              shop: [],
              hand: [],
              board: [boardMinion],
              heroId: "patchwerk",
            }
          : p,
      ),
    } as GameState;
    const beforeShop = state.players[0]!.shop.length;
    const after = sellMinion(state, 0, 0);
    expect(after.players[0]!.shop.length).toBe(beforeShop);
  });
});

// ---------------------------------------------------------------------------
// Play to board
// ---------------------------------------------------------------------------

describe("playMinionToBoard", () => {
  it("moves minion from hand to board at given position", () => {
    const m1 = instantiate(TEST_CARD);
    const m2 = instantiate(TEST_CARD);
    const state = makeTestState({ hand: [m1, m2], board: [] });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const p = after.players[0]!;
    expect(p.hand).toHaveLength(1);
    expect(p.board).toHaveLength(1);
    expect(p.board[0]!.instanceId).toBe(m1.instanceId);
  });

  it("inserts at correct position among existing board minions", () => {
    const m1 = instantiate(TEST_CARD);
    const m2 = instantiate(TEST_CARD);
    const existing = instantiate(TEST_CARD);
    const state = makeTestState({ hand: [m1, m2], board: [existing] });
    const after = playMinionToBoard(state, 0, 0, 0, RNG); // insert at front
    expect(after.players[0]!.board[0]!.instanceId).toBe(m1.instanceId);
    expect(after.players[0]!.board[1]!.instanceId).toBe(existing.instanceId);
  });

  it("throws when board is full", () => {
    const board: MinionInstance[] = Array.from({ length: 7 }, () => instantiate(TEST_CARD));
    const state = makeTestState({ hand: [instantiate(TEST_CARD)], board });
    expect(() => playMinionToBoard(state, 0, 0, 0, RNG)).toThrow("Board is full");
  });

  it("fires onBattlecry hook when minion has one", () => {
    const battlecryMinion = instantiate(TEST_BATTLECRY_CARD);
    const state = makeTestState({ hand: [battlecryMinion], board: [] });
    expect(state.players[0]!.hand.length).toBe(1);
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const afterPlayer = after.players[0]!;
    // Minion moved from hand to board
    expect(afterPlayer.hand.length).toBe(1);
    expect(afterPlayer.hand[0]!.cardId).toBe("battlecry_coin");
    expect(afterPlayer.board.length).toBe(1);
    expect(afterPlayer.board[0]!.cardId).toBe("test_battlecry");
  });

  it("passes correct RecruitCtx to onBattlecry", () => {
    let capturedCtx: { selfInstanceId?: string; playerId: number } | null = null;
    const customCard = defineMinion({
      id: "ctx_test",
      name: "Ctx Test",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onBattlecry: (ctx) => {
          capturedCtx = {
            selfInstanceId: ctx.self.instanceId,
            playerId: ctx.playerId,
          };
          return ctx.state;
        },
      },
    });
    const inst = instantiate(customCard);
    const state = makeTestState({ hand: [inst], board: [] });
    playMinionToBoard(state, 0, 0, 0, RNG);
    expect(capturedCtx).not.toBeNull();
    expect(capturedCtx!.selfInstanceId).toBe(inst.instanceId);
    expect(capturedCtx!.playerId).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Reorder board
// ---------------------------------------------------------------------------

describe("reorderBoard", () => {
  it("swaps two minions correctly", () => {
    const [a, b, c] = [instantiate(TEST_CARD), instantiate(TEST_CARD), instantiate(TEST_CARD)];
    const state = makeTestState({ board: [a!, b!, c!] });
    const after = reorderBoard(state, 0, 0, 2);
    const board = after.players[0]!.board;
    expect(board[0]!.instanceId).toBe(b!.instanceId);
    expect(board[1]!.instanceId).toBe(c!.instanceId);
    expect(board[2]!.instanceId).toBe(a!.instanceId);
  });
});

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

describe("refreshShop", () => {
  it("deducts 1 gold and draws a new shop", () => {
    const state = makeTestState({ gold: 5 });
    const after = refreshShop(state, 0, RNG);
    expect(after.players[0]!.gold).toBe(4);
    // Shop should be re-filled with up to SHOP_SIZE_BY_TIER[1] = 3 minions
    expect(after.players[0]!.shop.length).toBeLessThanOrEqual(3);
  });

  it("throws when not enough gold", () => {
    const state = makeTestState({ gold: 0 });
    expect(() => refreshShop(state, 0, RNG)).toThrow("Not enough gold to refresh");
  });
});

// ---------------------------------------------------------------------------
// Freeze
// ---------------------------------------------------------------------------

describe("freezeShop", () => {
  it("marks shop as frozen", () => {
    const state = makeTestState();
    const after = freezeShop(state, 0);
    expect(after.players[0]!.shopFrozen).toBe(true);
  });

  it("rollShopForPlayer skips re-roll when frozen and clears flag", () => {
    const shopMinion = instantiate(TEST_CARD);
    const state = makeTestState({ shop: [shopMinion], shopFrozen: true });
    const after = rollShopForPlayer(state, 0, RNG);
    // Minion stays, freeze cleared
    expect(after.players[0]!.shop[0]!.instanceId).toBe(shopMinion.instanceId);
    expect(after.players[0]!.shopFrozen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tier upgrade
// ---------------------------------------------------------------------------

describe("upgradeTier", () => {
  it("increases tier, deducts cost, resets upgrade cost for next tier", () => {
    const state = makeTestState({ gold: 10, tier: 1, upgradeCost: 5 });
    const after = upgradeTier(state, 0);
    const p = after.players[0]!;
    expect(p.tier).toBe(2);
    expect(p.gold).toBe(5); // 10 - 5
    expect(p.upgradeCost).toBe(7); // base cost for tier 3
    expect(p.upgradedThisTurn).toBe(true);
  });

  it("throws when not enough gold", () => {
    const state = makeTestState({ gold: 2, upgradeCost: 5 });
    expect(() => upgradeTier(state, 0)).toThrow("Not enough gold to upgrade");
  });

  it("throws when already at max tier", () => {
    const state = makeTestState({ gold: 99, tier: 6 });
    expect(() => upgradeTier(state, 0)).toThrow("Already at max tier");
  });
});

// ---------------------------------------------------------------------------
// Tier upgrade discount (via beginRecruitTurn)
// ---------------------------------------------------------------------------

describe("upgrade discount clock", () => {
  it("decrements upgradeCost by 1 each turn the player does not upgrade", () => {
    let state = makeTestState({ upgradeCost: 5, upgradedThisTurn: false });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(4);
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(3);
  });

  it("does not go below 0", () => {
    let state = makeTestState({ upgradeCost: 0, upgradedThisTurn: false });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradeCost).toBe(0);
  });

  it("resets upgradedThisTurn to false at turn start", () => {
    let state = makeTestState({ upgradedThisTurn: true });
    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.upgradedThisTurn).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Collateral damage keyword
// ---------------------------------------------------------------------------

describe("collateralDamage keyword", () => {
  it("deals damage to player's own hero when played to board", () => {
    const collateralCard = defineMinion({
      id: "test_collateral",
      name: "Test Collateral",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 1,
      baseHp: 2,
      baseKeywords: ["collateralDamage2"],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[collateralCard.id] = collateralCard;

    const inst = instantiate(collateralCard);
    const state = makeTestState({
      hand: [inst],
      board: [],
      hp: 30,
      armor: 0,
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    // 2 collateral damage dealt to player's hero
    expect(after.players[0]!.hp).toBe(28);
    expect(after.players[0]!.board).toHaveLength(1);
    expect(after.players[0]!.board[0]!.cardId).toBe("test_collateral");
  });

  it("armor absorbs collateral damage before HP", () => {
    const collateralCard = defineMinion({
      id: "test_collateral_armor",
      name: "Test Collateral Armor",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 1,
      baseHp: 2,
      baseKeywords: ["collateralDamage3"],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[collateralCard.id] = collateralCard;

    const inst = instantiate(collateralCard);
    const state = makeTestState({
      hand: [inst],
      board: [],
      hp: 30,
      armor: 5,
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    // 3 damage absorbed by 5 armor → armor goes to 2, HP stays 30
    expect(after.players[0]!.armor).toBe(2);
    expect(after.players[0]!.hp).toBe(30);
  });

  it("eliminates player when collateral damage exceeds HP", () => {
    const collateralCard = defineMinion({
      id: "test_collateral_kill",
      name: "Test Collateral Kill",
      tier: 1,
      tribes: ["Pirate"],
      baseAtk: 1,
      baseHp: 2,
      baseKeywords: ["collateralDamage10"],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[collateralCard.id] = collateralCard;

    const inst = instantiate(collateralCard);
    const state = makeTestState({
      hand: [inst],
      board: [],
      hp: 5,
      armor: 0,
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    expect(after.players[0]!.eliminated).toBe(true);
    expect(after.players[0]!.hp).toBe(-5);
  });

  it("no collateral damage when keyword is not present", () => {
    const normalCard = defineMinion({
      id: "test_normal",
      name: "Test Normal",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[normalCard.id] = normalCard;

    const inst = instantiate(normalCard);
    const state = makeTestState({
      hand: [inst],
      board: [],
      hp: 30,
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    expect(after.players[0]!.hp).toBe(30);
  });

  it("bloodsail_pirate deals 1 collateral damage", () => {
    const bp = MINIONS["bloodsail_pirate"];
    expect(bp).toBeDefined();
    const inst = instantiate(bp!);
    const state = makeTestState({
      hand: [inst],
      board: [],
      hp: 30,
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    expect(after.players[0]!.hp).toBe(29);
    expect(after.players[0]!.board).toHaveLength(1);
  });
});
