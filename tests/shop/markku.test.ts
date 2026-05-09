import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Markku, the Murloc — battlecry copies a random friendly Murloc from board
// ---------------------------------------------------------------------------

describe("markku — onBattlecry", () => {
  it("copies a random friendly Murloc from board when played", () => {
    const base = makeInitialState(42);
    const murloc1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc (no battlecry)
    const murloc2 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc (no battlecry)
    const markku = instantiate(MINIONS["markku"]!); // 3/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, markku: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [murloc1, murloc2],
              shop: [markku],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 2, RNG);

    const board = afterPlay.players[0]!.board;
    // 2 original murlocs + markku + 1 copy = 4
    expect(board.length).toBe(4);

    // Markku should be on board
    const markkuOnBoard = board.find((m) => m.cardId === "markku");
    expect(markkuOnBoard).toBeDefined();

    // Both original murlocs should still be on board
    const murloc1OnBoard = board.find((m) => m.instanceId === murloc1.instanceId);
    const murloc2OnBoard = board.find((m) => m.instanceId === murloc2.instanceId);
    expect(murloc1OnBoard).toBeDefined();
    expect(murloc2OnBoard).toBeDefined();

    // There should be exactly 1 copy (a murloc_scout that is NOT murloc1 or murloc2)
    const copies = board.filter(
      (m) =>
        m.cardId === "murloc_scout" &&
        m.instanceId !== murloc1.instanceId &&
        m.instanceId !== murloc2.instanceId &&
        m.instanceId !== markku.instanceId,
    );
    expect(copies.length).toBe(1);
  });

  it("copies itself when it is the only Murloc on board", () => {
    const base = makeInitialState(42);
    const markku = instantiate(MINIONS["markku"]!); // 3/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { markku: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              shop: [markku],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    // Markku is a Murloc, so its battlecry finds itself and copies itself: 1 markku + 1 copy = 2
    expect(board.length).toBe(2);
    const markkus = board.filter((m) => m.cardId === "markku");
    expect(markkus.length).toBe(2);
  });

  it("copies the full stats of the target Murloc, not just base stats", () => {
    const base = makeInitialState(42);
    // Create a buffed murloc (simulating it being buffed by another effect)
    const buffedMurloc = instantiate(MINIONS["murloc_scout"]!);
    buffedMurloc.atk = 3; // Simulate it being buffed to 3/3
    buffedMurloc.hp = 3;
    buffedMurloc.maxHp = 3;

    const markku = instantiate(MINIONS["markku"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, markku: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [buffedMurloc],
              shop: [markku],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;
    // 1 original + markku + 1 copy = 3
    expect(board.length).toBe(3);

    // The copy should have the same stats as the buffed target
    const copy = board.find(
      (m) => m.instanceId !== buffedMurloc.instanceId && m.instanceId !== markku.instanceId,
    );
    expect(copy).toBeDefined();
    expect(copy!.atk).toBe(3);
    expect(copy!.hp).toBe(3);
  });

  it("copies keywords from the target Murloc", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc (no battlecry)

    const markku = instantiate(MINIONS["markku"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, markku: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [murloc],
              shop: [markku],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;
    // 1 original + markku + 1 copy = 3
    expect(board.length).toBe(3);

    // The copy should have the same keywords as the target
    const copy = board.find(
      (m) => m.instanceId !== murloc.instanceId && m.instanceId !== markku.instanceId,
    );
    expect(copy).toBeDefined();
    // Verify the copy has the same tribes
    expect(copy!.tribes).toEqual(murloc.tribes);
  });

  it("does NOT copy non-Murloc minions", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast (not a Murloc)
    const markku = instantiate(MINIONS["markku"]!); // 3/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, markku: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [markku],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;
    // Markku is a Murloc, so its battlecry finds itself and copies itself: 1 beast + 2 markkus = 3
    expect(board.length).toBe(3);
    const markkus = board.filter((m) => m.cardId === "markku");
    expect(markkus.length).toBe(2);
    // The beast should still be there unchanged
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard).toBeDefined();
    expect(beastOnBoard!.cardId).toBe("alley_cat");
  });
});
