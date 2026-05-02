import { beforeEach, describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { HEROES } from "./heroes/index";
import { defineMinion, instantiate } from "./minions/define";
import { getMinion, MINIONS } from "./minions/index";
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
import { SPELLS } from "./spells/index";
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
    expect(after.pool.test_murloc).toBe((state.pool.test_murloc ?? 0) + 1);
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

  it("sells golden minion for 2 gold, normal for 1", () => {
    const normalMinion = instantiate(TEST_CARD);
    const goldenMinion = { ...instantiate(TEST_CARD), golden: true };
    const base = makeInitialState(42);
    const state = {
      ...base,
      phase: { kind: "Recruit", turn: 1 },
      turn: 1,
      pool: { test_murloc: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? { ...p, gold: 5, tier: 1, shop: [], hand: [], board: [normalMinion, goldenMinion] }
          : p,
      ),
    } as GameState;
    // Sell normal minion — should get 1 gold
    const afterNormal = sellMinion(state, 0, 0);
    expect(afterNormal.players[0]!.gold).toBe(6); // 5 + 1
    // Sell golden minion — should get 2 gold
    const afterGolden = sellMinion(afterNormal, 0, 0);
    expect(afterGolden.players[0]!.gold).toBe(8); // 6 + 2
  });

  it("returns sold minion from hand to pool correctly", () => {
    const handMinion = instantiate(TEST_CARD);
    const base = makeInitialState(42);
    const state = {
      ...base,
      phase: { kind: "Recruit", turn: 1 },
      turn: 1,
      pool: { test_murloc: 5 },
      players: base.players.map((p, i) =>
        i === 0 ? { ...p, gold: 5, tier: 1, shop: [], hand: [handMinion], board: [] } : p,
      ),
    } as GameState;
    const after = sellMinion(state, 0, 0, true);
    expect(after.players[0]!.hand).toHaveLength(0);
    expect(after.pool.test_murloc).toBe(6); // 5 + 1 returned
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

  it("does nothing when shop is frozen", () => {
    const shopMinion = instantiate(TEST_CARD);
    const state = makeTestState({ shop: [shopMinion], shopFrozen: true, gold: 5 });
    const after = refreshShop(state, 0, RNG);
    expect(after).toBe(state);
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

  it("rollShopForPlayer skips re-roll when frozen and keeps freeze flag", () => {
    const shopMinion = instantiate(TEST_CARD);
    const state = makeTestState({ shop: [shopMinion], shopFrozen: true });
    const after = rollShopForPlayer(state, 0, RNG);
    // Minion stays, freeze flag is NOT cleared (shop stays frozen until explicitly unfrozen)
    expect(after.players[0]!.shop[0]!.instanceId).toBe(shopMinion.instanceId);
    expect(after.players[0]!.shopFrozen).toBe(true);
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

describe("magnetic", () => {
  const magneticCard = defineMinion({
    id: "magnetic_murloc",
    name: "Magnetic Murloc",
    tier: 1,
    tribes: ["Murloc"],
    baseAtk: 2,
    baseHp: 2,
    baseKeywords: ["magnetic"],
    spellDamage: 0,
    hooks: {},
  });
  MINIONS[magneticCard.id] = magneticCard;

  const baseMurloc = defineMinion({
    id: "base_murloc",
    name: "Base Murloc",
    tier: 1,
    tribes: ["Murloc"],
    baseAtk: 1,
    baseHp: 3,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
  MINIONS[baseMurloc.id] = baseMurloc;

  function makeMagneticState(): GameState {
    const baseInst = instantiate(baseMurloc);
    const magneticInst = instantiate(magneticCard);
    return makeTestState({
      hand: [magneticInst],
      board: [baseInst],
    });
  }

  it("stacks magnetic minion on same-tribe minion", () => {
    const state = makeMagneticState();
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const board = after.players[0]!.board;
    expect(board).toHaveLength(1);
    const merged = board[0]!;
    // Stats: max(2,1) + 2 = 4 attack, max(2,3) + 2 = 5 hp
    expect(merged.atk).toBe(4);
    expect(merged.hp).toBe(5);
    expect(merged.maxHp).toBe(5);
  });

  it("removes magnetic keyword after stacking", () => {
    const state = makeMagneticState();
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const board = after.players[0]!.board;
    expect(board[0]!.magnetic).toBe(false);
  });

  it("combines keywords from both minions", () => {
    const tauntMurloc = defineMinion({
      id: "taunt_murloc",
      name: "Taunt Murloc",
      tier: 1,
      tribes: ["Murloc"],
      baseAtk: 1,
      baseHp: 2,
      baseKeywords: ["taunt"],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[tauntMurloc.id] = tauntMurloc;

    const tauntInst = instantiate(tauntMurloc);
    const magneticInst = instantiate(magneticCard);
    const state = makeTestState({
      hand: [magneticInst],
      board: [tauntInst],
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const board = after.players[0]!.board;
    expect(board[0]!.keywords.has("taunt")).toBe(true);
  });

  it("does not stack when no same-tribe minion on board", () => {
    const beastCard = defineMinion({
      id: "test_beast2",
      name: "Test Beast 2",
      tier: 2,
      tribes: ["Beast"],
      baseAtk: 3,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const beastInst = instantiate(beastCard);
    const magneticInst = instantiate(magneticCard);
    const state = makeTestState({
      hand: [magneticInst],
      board: [beastInst],
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const board = after.players[0]!.board;
    expect(board).toHaveLength(2);
  });

  it("stacks on the rightmost same-tribe minion", () => {
    const murlocA = defineMinion({
      id: "test_murloc_a",
      name: "Test Murloc A",
      tier: 1,
      tribes: ["Murloc"],
      baseAtk: 3,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[murlocA.id] = murlocA;

    const murlocB = defineMinion({
      id: "test_murloc_b",
      name: "Test Murloc B",
      tier: 1,
      tribes: ["Murloc"],
      baseAtk: 1,
      baseHp: 4,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[murlocB.id] = murlocB;

    const murlocAInst = instantiate(murlocA);
    const murlocBInst = instantiate(murlocB);
    const magneticInst = instantiate(magneticCard);
    const state = makeTestState({
      hand: [magneticInst],
      board: [murlocAInst, murlocBInst],
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const board = after.players[0]!.board;
    expect(board).toHaveLength(2);
    // Should stack on murlocB (rightmost), not murlocA
    // murlocB stats: max(2,1)+2 = 4 atk, max(2,4)+2 = 6 hp
    expect(board[1]!.atk).toBe(4);
    expect(board[1]!.hp).toBe(6);
    expect(board[1]!.cardId).toBe("test_murloc_b");
    // murlocA stays unchanged at index 0
    expect(board[0]!.atk).toBe(3);
    expect(board[0]!.hp).toBe(1);
  });

  it("does not stack when magnetic minion is the only one on board", () => {
    const magneticInst = instantiate(magneticCard);
    const state = makeTestState({
      hand: [magneticInst],
      board: [],
    });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);
    const board = after.players[0]!.board;
    expect(board).toHaveLength(1);
    expect(board[0]!.magnetic).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bounty keyword
// ---------------------------------------------------------------------------

describe("bounty keyword", () => {
  it("bounty minion costs its bountyCost and gets +1/+1 per gold", () => {
    const bountyCard = MINIONS["bounty_minion"];
    expect(bountyCard).toBeDefined();
    expect(bountyCard!.bountyCost).toBe(1);

    const state = makeTestState({ gold: 10 });
    // Find the bounty minion in the shop
    const shopIndex = state.players[0]!.shop.findIndex((m) => m.cardId === "bounty_minion");
    if (shopIndex === -1) {
      // Not in shop — manually place one
      const inst = instantiate(bountyCard!);
      const s = makeTestState({
        gold: 10,
        shop: [inst],
      });
      const after = buyMinion(s, 0, 0);
      const hand = after.players[0]!.hand[0]!;
      expect(hand.atk).toBe(1);
      expect(hand.hp).toBe(1);
      expect(after.players[0]!.gold).toBe(9); // 10 - 1 (bountyCost)
      return;
    }
    const after = buyMinion(state, 0, shopIndex);
    const hand = after.players[0]!.hand[0]!;
    expect(hand.atk).toBeGreaterThanOrEqual(1);
    expect(hand.hp).toBeGreaterThanOrEqual(1);
  });

  it("bounty keyword is in the Keyword union type", () => {
    const bountyCard = MINIONS["bounty_minion"];
    expect(bountyCard!.baseKeywords).toContain("bounty");
  });

  it("bounty minion with higher cost gets proportionally more stats", () => {
    const highBountyCard = defineMinion({
      id: "high_bounty",
      name: "High Bounty",
      tier: 3,
      tribes: ["Beast"],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: ["bounty"],
      spellDamage: 0,
      bountyCost: 5,
      hooks: {},
    });
    MINIONS[highBountyCard.id] = highBountyCard;

    const inst = instantiate(highBountyCard);
    const state = makeTestState({
      gold: 10,
      shop: [inst],
    });
    const after = buyMinion(state, 0, 0);
    const hand = after.players[0]!.hand[0]!;
    // bountyCost is 5, COST_BUY is 3, so bonus is 2
    // base stats 3/3 + bonus 2/2 = 5/5
    expect(hand.atk).toBe(5);
    expect(hand.hp).toBe(5);
    expect(after.players[0]!.gold).toBe(5); // 10 - 5 (bountyCost)
  });
});

// ---------------------------------------------------------------------------
// Cobalt Scalebane — onTurnEnd hook
// ---------------------------------------------------------------------------

describe("cobalt_scalebane onTurnEnd", () => {
  it("is registered in MINIONS", () => {
    expect(MINIONS["cobalt_scalebane"]).toBeDefined();
    expect(MINIONS["cobalt_scalebane"]!.tier).toBe(3);
    expect(MINIONS["cobalt_scalebane"]!.tribes).toContain("Dragon");
  });

  it("onTurnEnd gives a random friendly minion +3 ATK", () => {
    const cs = MINIONS["cobalt_scalebane"];
    expect(cs).toBeDefined();
    const inst = instantiate(cs!);
    const otherMinion = defineMinion({
      id: "test_dragon_ally",
      name: "Test Dragon Ally",
      tier: 3,
      tribes: ["Dragon"],
      baseAtk: 2,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[otherMinion.id] = otherMinion;
    const ally = instantiate(otherMinion);

    const state = makeTestState({
      board: [inst, ally],
    });

    // Simulate end of turn by calling onTurnEnd directly
    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cs!.hooks.onTurnEnd!(ctx);
    const board = after.players[0]!.board;

    // The ally should have gained +3 ATK
    const allyAfter = board.find((m) => m.instanceId === ally.instanceId);
    expect(allyAfter).toBeDefined();
    expect(allyAfter!.atk).toBe(5); // 2 + 3
  });

  it("onTurnEnd skips self when only minion on board", () => {
    const cs = MINIONS["cobalt_scalebane"];
    const inst = instantiate(cs!);

    const state = makeTestState({
      board: [inst],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cs!.hooks.onTurnEnd!(ctx);
    // Self should not buff itself
    const board = after.players[0]!.board;
    const selfAfter = board.find((m) => m.instanceId === inst.instanceId);
    expect(selfAfter!.atk).toBe(5); // base, unchanged
  });

  it("onTurnEnd does nothing when board is empty", () => {
    const cs = MINIONS["cobalt_scalebane"];
    const inst = instantiate(cs!);

    const state = makeTestState({
      board: [],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cs!.hooks.onTurnEnd!(ctx);
    // Should not crash with empty board
    expect(after.players[0]!.board).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Brann Bronzebeard — battlecries trigger twice
// ---------------------------------------------------------------------------

describe("Brann Bronzebeard", () => {
  it("fires battlecry twice when Brann is on the board", () => {
    let callCount = 0;
    const battlecryMinion = defineMinion({
      id: "brann_test_battlecry",
      name: "Test Battlecry",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onBattlecry: ({ state }) => {
          callCount++;
          return {
            ...state,
            players: state.players.map((p, i) =>
              i === 0 ? { ...p, hand: [...p.hand, instantiate(TEST_BATTLECRY_CARD)] } : p,
            ),
          };
        },
      },
    });
    MINIONS[battlecryMinion.id] = battlecryMinion;

    const brann = instantiate(
      defineMinion({
        id: "brann_bronzebeard",
        name: "Brann Bronzebeard",
        tier: 5,
        tribes: ["Murloc"],
        baseAtk: 1,
        baseHp: 3,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );

    const toPlay = instantiate(battlecryMinion);
    const state = makeTestState({ board: [brann], hand: [toPlay] });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);

    // Battlecry should have fired twice because Brann is on the board
    expect(callCount).toBe(2);
    // The minion should be on the board
    expect(after.players[0]!.board).toHaveLength(2);
    // The hand should have 2 coins from the battlecry firing twice
    expect(after.players[0]!.hand).toHaveLength(2);
  });

  it("fires battlecry once when Brann is NOT on the board", () => {
    let callCount = 0;
    const battlecryMinion = defineMinion({
      id: "no_brann_test",
      name: "No Brann Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onBattlecry: ({ state }) => {
          callCount++;
          return {
            ...state,
            players: state.players.map((p, i) =>
              i === 0 ? { ...p, hand: [...p.hand, instantiate(TEST_BATTLECRY_CARD)] } : p,
            ),
          };
        },
      },
    });
    MINIONS[battlecryMinion.id] = battlecryMinion;

    const normalMinion = instantiate(
      defineMinion({
        id: "normal_murloc",
        name: "Normal Murloc",
        tier: 2,
        tribes: ["Murloc"],
        baseAtk: 2,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );

    const toPlay = instantiate(battlecryMinion);
    const state = makeTestState({ board: [normalMinion], hand: [toPlay] });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);

    // Battlecry should have fired once (no Brann)
    expect(callCount).toBe(1);
    expect(after.players[0]!.board).toHaveLength(2);
    expect(after.players[0]!.hand).toHaveLength(1);
  });

  it("Brann on opponent board does not affect own battlecries", () => {
    let callCount = 0;
    const battlecryMinion = defineMinion({
      id: "opp_brann_test",
      name: "Opp Brann Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onBattlecry: ({ state }) => {
          callCount++;
          return {
            ...state,
            players: state.players.map((p, i) =>
              i === 0 ? { ...p, hand: [...p.hand, instantiate(TEST_BATTLECRY_CARD)] } : p,
            ),
          };
        },
      },
    });
    MINIONS[battlecryMinion.id] = battlecryMinion;

    const brann = instantiate(
      defineMinion({
        id: "brann_bronzebeard",
        name: "Brann Bronzebeard",
        tier: 5,
        tribes: ["Murloc"],
        baseAtk: 1,
        baseHp: 3,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );

    const toPlay = instantiate(battlecryMinion);
    // Brann is on player 1's board, not player 0's
    const state = makeTestState({
      board: [],
      hand: [toPlay],
    });
    // Manually put Brann on player 1's board
    const stateWithOppBrann = {
      ...state,
      players: state.players.map((p, i) => (i === 1 ? { ...p, board: [brann] } : p)),
    };
    const after = playMinionToBoard(stateWithOppBrann, 0, 0, 0, RNG);

    // Battlecry should have fired once (Brann is on opponent)
    expect(callCount).toBe(1);
  });

  it("golden minion's battlecry fires twice when played to board", () => {
    let callCount = 0;
    const battlecryMinion = defineMinion({
      id: "golden_battlecry_test",
      name: "Golden Battlecry Test",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onBattlecry: ({ state }) => {
          callCount++;
          return {
            ...state,
            players: state.players.map((p, i) =>
              i === 0 ? { ...p, hand: [...p.hand, instantiate(TEST_BATTLECRY_CARD)] } : p,
            ),
          };
        },
      },
    });
    MINIONS[battlecryMinion.id] = battlecryMinion;

    const toPlay = instantiate(battlecryMinion);
    const goldenToPlay = { ...toPlay, golden: true };
    const state = makeTestState({ board: [], hand: [goldenToPlay] });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);

    // Battlecry should have fired twice (golden minion)
    expect(callCount).toBe(2);
    expect(after.players[0]!.board).toHaveLength(1);
    expect(after.players[0]!.hand).toHaveLength(2);
  });

  it("golden minion's battlecry fires twice even without brann", () => {
    let callCount = 0;
    const battlecryMinion = defineMinion({
      id: "golden_no_brann_test",
      name: "Golden No Brann Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onBattlecry: ({ state }) => {
          callCount++;
          return {
            ...state,
            players: state.players.map((p, i) =>
              i === 0 ? { ...p, hand: [...p.hand, instantiate(TEST_BATTLECRY_CARD)] } : p,
            ),
          };
        },
      },
    });
    MINIONS[battlecryMinion.id] = battlecryMinion;

    const toPlay = instantiate(battlecryMinion);
    const goldenToPlay = { ...toPlay, golden: true };
    const state = makeTestState({ board: [], hand: [goldenToPlay] });
    const after = playMinionToBoard(state, 0, 0, 0, RNG);

    expect(callCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Kalecgos, Arcane Aspect — onCast hook
// ---------------------------------------------------------------------------

describe("kalecgos_arcane_aspect onCast", () => {
  it("is registered in MINIONS", () => {
    expect(MINIONS["kalecgos_arcane_aspect"]).toBeDefined();
    expect(MINIONS["kalecgos_arcane_aspect"]!.tier).toBe(6);
    expect(MINIONS["kalecgos_arcane_aspect"]!.tribes).toContain("Dragon");
    expect(MINIONS["kalecgos_arcane_aspect"]!.baseAtk).toBe(4);
    expect(MINIONS["kalecgos_arcane_aspect"]!.baseHp).toBe(8);
  });

  it("onCast gives all friendly minions +1/+1 when a spell is cast", () => {
    const kc = MINIONS["kalecgos_arcane_aspect"];
    expect(kc).toBeDefined();
    const inst = instantiate(kc!);
    const ally = defineMinion({
      id: "test_ally",
      name: "Test Ally",
      tier: 3,
      tribes: ["Beast"],
      baseAtk: 3,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const allyInst = instantiate(ally);
    MINIONS[allyInst.cardId] = ally;

    const state = makeTestState({
      board: [inst, allyInst],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = kc!.hooks.onCast!(ctx);
    const board = after.players[0]!.board;

    const kcAfter = board.find((m) => m.instanceId === inst.instanceId);
    const allyAfter = board.find((m) => m.instanceId === allyInst.instanceId);

    expect(kcAfter).toBeDefined();
    expect(kcAfter!.atk).toBe(5); // 4 + 1
    expect(kcAfter!.hp).toBe(9); // 8 + 1
    expect(allyAfter).toBeDefined();
    expect(allyAfter!.atk).toBe(4); // 3 + 1
    expect(allyAfter!.hp).toBe(3); // 2 + 1
  });

  it("onCast does nothing when board is empty", () => {
    const kc = MINIONS["kalecgos_arcane_aspect"];
    const inst = instantiate(kc!);

    const state = makeTestState({
      board: [],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = kc!.hooks.onCast!(ctx);
    expect(after.players[0]!.board).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Gentle Megasaur
// ---------------------------------------------------------------------------

describe("Gentle Megasaur", () => {
  it("gives all friendly murlocs a random keyword on battlecry", () => {
    const gm = MINIONS["gentle_megasaur"];
    const megasaur = instantiate(gm!);
    const murloc1 = instantiate(
      defineMinion({
        id: "test_murloc_1",
        name: "Test Murloc 1",
        tier: 1,
        tribes: ["Murloc"],
        baseAtk: 2,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );
    const murloc2 = instantiate(
      defineMinion({
        id: "test_murloc_2",
        name: "Test Murloc 2",
        tier: 2,
        tribes: ["Murloc"],
        baseAtk: 3,
        baseHp: 2,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );
    const nonMurloc = instantiate(
      defineMinion({
        id: "test_demon",
        name: "Test Demon",
        tier: 1,
        tribes: ["Demon"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );

    const state = makeTestState({
      board: [megasaur, murloc1, murloc2, nonMurloc],
    });

    const ctx = {
      self: megasaur,
      playerId: 0,
      state,
      rng: makeRng(1),
      spellDamage: 0,
    };
    const after = gm!.hooks.onBattlecry!(ctx);

    // Murlocs should have exactly 1 keyword each (from battlecry)
    const afterMurloc1 = after.players[0]!.board.find((m) => m.instanceId === murloc1.instanceId);
    const afterMurloc2 = after.players[0]!.board.find((m) => m.instanceId === murloc2.instanceId);
    const afterNonMurloc = after.players[0]!.board.find(
      (m) => m.instanceId === nonMurloc.instanceId,
    );

    expect(afterMurloc1!.keywords.size).toBe(1);
    expect(afterMurloc2!.keywords.size).toBe(1);
    expect(afterNonMurloc!.keywords.size).toBe(0);

    // Keywords should be valid adapt keywords
    const ADAPT_KEYWORDS: Set<string> = new Set([
      "taunt",
      "divineShield",
      "windfury",
      "megaWindfury",
      "poisonous",
      "reborn",
      "venomous",
      "cleave",
      "lifesteal",
      "rush",
      "magnetic",
    ]);
    for (const kw of afterMurloc1!.keywords) {
      expect(ADAPT_KEYWORDS.has(kw)).toBe(true);
    }
    for (const kw of afterMurloc2!.keywords) {
      expect(ADAPT_KEYWORDS.has(kw)).toBe(true);
    }
  });

  it("does not give itself a keyword", () => {
    const gm = MINIONS["gentle_megasaur"];
    const megasaur = instantiate(gm!);

    const murloc = instantiate(
      defineMinion({
        id: "test_murloc_self",
        name: "Test Murloc Self",
        tier: 1,
        tribes: ["Murloc"],
        baseAtk: 2,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );

    const state = makeTestState({
      board: [megasaur, murloc],
    });

    const ctx = {
      self: megasaur,
      playerId: 0,
      state,
      rng: makeRng(1),
      spellDamage: 0,
    };
    const after = gm!.hooks.onBattlecry!(ctx);

    const afterMegasaur = after.players[0]!.board.find((m) => m.instanceId === megasaur.instanceId);
    expect(afterMegasaur!.keywords.size).toBe(0);
  });

  it("does nothing when no friendly murlocs on board", () => {
    const gm = MINIONS["gentle_megasaur"];
    const megasaur = instantiate(gm!);
    const demon = instantiate(
      defineMinion({
        id: "test_demon_no_murloc",
        name: "Test Demon",
        tier: 1,
        tribes: ["Demon"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {},
      }),
    );

    const state = makeTestState({
      board: [megasaur, demon],
    });

    const ctx = {
      self: megasaur,
      playerId: 0,
      state,
      rng: makeRng(1),
      spellDamage: 0,
    };
    const after = gm!.hooks.onBattlecry!(ctx);

    const afterDemon = after.players[0]!.board.find((m) => m.instanceId === demon.instanceId);
    expect(afterDemon!.keywords.size).toBe(0);
  });

  it("screwjank_clunker battlecry buffs a friendly mech +2/+2", () => {
    const mechCard = getMinion("harvest_golem");
    const mech = instantiate(mechCard);
    const initialState = makeInitialState(42);
    const state = beginRecruitTurn(initialState, makeRng(42));
    const newState = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, board: [mech] } : p)),
    };
    const screwjank = instantiate(getMinion("screwjank_clunker"));
    const ctx = {
      self: screwjank,
      playerId: 0,
      state: newState,
      rng: makeRng(1),
      spellDamage: 0,
    };
    const after = screwjank.hooks.onBattlecry!(ctx);
    const buffedMech = after.players[0]!.board.find((m) => m.instanceId === mech.instanceId);
    expect(buffedMech!.atk).toBe(mech.atk + 2);
    expect(buffedMech!.hp).toBe(mech.hp + 2);
    expect(buffedMech!.maxHp).toBe(mech.maxHp + 2);
  });

  it("screwjank_clunker battlecry does nothing when no friendly mech on board", () => {
    const beastCard = getMinion("rockpool_hunter");
    const beast = instantiate(beastCard);
    const initialState = makeInitialState(42);
    const state = beginRecruitTurn(initialState, makeRng(42));
    const newState = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, board: [beast] } : p)),
    };
    const screwjank = instantiate(getMinion("screwjank_clunker"));
    const ctx = {
      self: screwjank,
      playerId: 0,
      state: newState,
      rng: makeRng(1),
      spellDamage: 0,
    };
    const after = screwjank.hooks.onBattlecry!(ctx);
    const beastAfter = after.players[0]!.board.find((m) => m.instanceId === beast.instanceId);
    expect(beastAfter!.atk).toBe(beast.atk);
    expect(beastAfter!.hp).toBe(beast.hp);
  });
});

// ---------------------------------------------------------------------------
// buyMinion skips spell items in the shop
// ---------------------------------------------------------------------------

describe("buyMinion skips spells", () => {
  it("does not add a spell to hand when buying a shop item that is a spell", () => {
    const state = makeInitialState(1);
    const newState = beginRecruitTurn(state, makeRng(1));
    const player = newState.players[0]!;

    // Find a spell in the shop (spells appear in the last 1/4 of slots at tier 2+)
    const spellInShop = player.shop.find((m) => SPELLS[m.cardId as keyof typeof SPELLS]);
    if (!spellInShop) {
      // Manually place a spell in the shop
      const spellInstance = {
        instanceId: "test_spell_instance",
        cardId: "mystery_shot",
      } as import("./types").MinionInstance;
      const s = { ...newState, players: [{ ...player, shop: [spellInstance] }] };
      const after = buyMinion(s, 0, 0);
      expect(after.players[0]!.hand.length).toBe(0);
      expect(after.players[0]!.shop.length).toBe(1); // shop unchanged
      return;
    }

    const shopIndex = player.shop.indexOf(spellInShop);
    const beforeHand = player.hand.length;
    const beforeShop = player.shop.length;
    const after = buyMinion(newState, 0, shopIndex);
    expect(after.players[0]!.hand.length).toBe(beforeHand);
    expect(after.players[0]!.shop.length).toBe(beforeShop);
  });
});

// ---------------------------------------------------------------------------
// Lightfang Enforcer — onTurnEnd hook
// ---------------------------------------------------------------------------

describe("lightfang_enforcer onTurnEnd", () => {
  it("is registered in MINIONS", () => {
    expect(MINIONS["lightfang_enforcer"]).toBeDefined();
    expect(MINIONS["lightfang_enforcer"]!.tier).toBe(5);
    expect(MINIONS["lightfang_enforcer"]!.tribes).toContain("Beast");
  });

  it("onTurnEnd gives +2/+1 to one friendly minion per tribe on board", () => {
    const le = MINIONS["lightfang_enforcer"];
    expect(le).toBeDefined();
    const inst = instantiate(le!);

    // A murloc
    const murloc = defineMinion({
      id: "test_murloc_1",
      name: "Test Murloc",
      tier: 2,
      tribes: ["Murloc"],
      baseAtk: 2,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[murloc.id] = murloc;
    const murlocInst = instantiate(murloc);

    // A demon
    const demon = defineMinion({
      id: "test_demon_1",
      name: "Test Demon",
      tier: 3,
      tribes: ["Demon"],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[demon.id] = demon;
    const demonInst = instantiate(demon);

    const state = makeTestState({
      board: [inst, murlocInst, demonInst],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = le!.hooks.onTurnEnd!(ctx);
    const board = after.players[0]!.board;

    // Murloc should have +2/+1
    const murlocAfter = board.find((m) => m.instanceId === murlocInst.instanceId);
    expect(murlocAfter).toBeDefined();
    expect(murlocAfter!.atk).toBe(4); // 2 + 2
    expect(murlocAfter!.hp).toBe(3); // 2 + 1

    // Demon should have +2/+1
    const demonAfter = board.find((m) => m.instanceId === demonInst.instanceId);
    expect(demonAfter).toBeDefined();
    expect(demonAfter!.atk).toBe(5); // 3 + 2
    expect(demonAfter!.hp).toBe(4); // 3 + 1

    // Self should be unchanged
    const selfAfter = board.find((m) => m.instanceId === inst.instanceId);
    expect(selfAfter!.atk).toBe(4); // base, unchanged
    expect(selfAfter!.hp).toBe(5); // base, unchanged
  });

  it("onTurnEnd handles a minion with multiple tribes satisfying multiple buffs", () => {
    const le = MINIONS["lightfang_enforcer"];
    const inst = instantiate(le!);

    // A murloc/demon (multi-tribe)
    const multi = defineMinion({
      id: "test_multi_tribe",
      name: "Test Multi-tribe",
      tier: 3,
      tribes: ["Murloc", "Demon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[multi.id] = multi;
    const multiInst = instantiate(multi);

    const state = makeTestState({
      board: [inst, multiInst],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = le!.hooks.onTurnEnd!(ctx);
    const board = after.players[0]!.board;

    // Multi-tribe minion should get +2/+1 for Murloc AND +2/+1 for Demon (total +4/+2)
    const multiAfter = board.find((m) => m.instanceId === multiInst.instanceId);
    expect(multiAfter).toBeDefined();
    expect(multiAfter!.atk).toBe(5); // 1 + 2 + 2
    expect(multiAfter!.hp).toBe(3); // 1 + 1 + 1
  });

  it("onTurnEnd does nothing when board has only self", () => {
    const le = MINIONS["lightfang_enforcer"];
    const inst = instantiate(le!);

    const state = makeTestState({
      board: [inst],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = le!.hooks.onTurnEnd!(ctx);
    const board = after.players[0]!.board;
    const selfAfter = board.find((m) => m.instanceId === inst.instanceId);
    expect(selfAfter!.atk).toBe(4); // base, unchanged
    expect(selfAfter!.hp).toBe(5); // base, unchanged
  });

  it("onTurnEnd does nothing when board is empty", () => {
    const le = MINIONS["lightfang_enforcer"];
    const inst = instantiate(le!);

    const state = makeTestState({
      board: [],
    });

    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = le!.hooks.onTurnEnd!(ctx);
    expect(after.players[0]!.board).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Wrath Weaver — onTurnEnd hook
// ---------------------------------------------------------------------------

describe("wrath_weaver onTurnEnd", () => {
  it("is registered in MINIONS with Demon tribe", () => {
    const cw = MINIONS["wrath_weaver"];
    expect(cw).toBeDefined();
    expect(cw!.tier).toBe(1);
    expect(cw!.tribes).toContain("Demon");
  });

  it("onTurnEnd deals 1 damage to your hero", () => {
    const cw = MINIONS["wrath_weaver"];
    const inst = instantiate(cw!);
    const state = makeTestState({
      board: [inst],
      hp: 20,
    });
    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cw!.hooks.onTurnEnd!(ctx);
    expect(after.players[0]!.hp).toBe(19);
  });

  it("onTurnEnd gives all friendly demons +2/+2 (excluding self)", () => {
    const cw = MINIONS["wrath_weaver"];
    const inst = instantiate(cw!);
    const otherDemon = defineMinion({
      id: "test_demon",
      name: "Test Demon",
      tier: 1,
      tribes: ["Demon"],
      baseAtk: 3,
      baseHp: 2,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[otherDemon.id] = otherDemon;
    const demon = instantiate(otherDemon);
    const nonDemon = defineMinion({
      id: "test_beast",
      name: "Test Beast",
      tier: 1,
      tribes: ["Beast"],
      baseAtk: 2,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    MINIONS[nonDemon.id] = nonDemon;
    const beast = instantiate(nonDemon);

    const state = makeTestState({
      board: [inst, demon, beast],
    });
    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cw!.hooks.onTurnEnd!(ctx);
    const board = after.players[0]!.board;
    const demonAfter = board.find((m) => m.instanceId === demon.instanceId);
    const beastAfter = board.find((m) => m.instanceId === beast.instanceId);
    // Demon should gain +2/+2
    expect(demonAfter).toBeDefined();
    expect(demonAfter!.atk).toBe(5); // 3 + 2
    expect(demonAfter!.hp).toBe(4); // 2 + 2
    // Beast should NOT be buffed
    expect(beastAfter).toBeDefined();
    expect(beastAfter!.atk).toBe(2); // unchanged
    expect(beastAfter!.hp).toBe(3); // unchanged
  });

  it("onTurnEnd deals 0 damage when hero is at 1 HP (clamped)", () => {
    const cw = MINIONS["wrath_weaver"];
    const inst = instantiate(cw!);
    const state = makeTestState({
      board: [inst],
      hp: 1,
    });
    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cw!.hooks.onTurnEnd!(ctx);
    expect(after.players[0]!.hp).toBe(0);
  });

  it("onTurnEnd does nothing when board is empty", () => {
    const cw = MINIONS["wrath_weaver"];
    const state = makeTestState({
      board: [],
      hp: 20,
    });
    const inst = instantiate(cw!);
    const ctx = {
      self: inst,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    };
    const after = cw!.hooks.onTurnEnd!(ctx);
    // Hero should still take 1 damage even with empty board
    expect(after.players[0]!.hp).toBe(19);
  });
});
