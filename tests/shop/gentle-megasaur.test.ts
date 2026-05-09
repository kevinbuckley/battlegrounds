import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Gentle Megasaur — battlecry gives a random keyword to each friendly Murloc
// ---------------------------------------------------------------------------

describe("gentle-megasaur — onBattlecry", () => {
  it("gives a random keyword to each friendly Murloc on board", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const megasaur = instantiate(MINIONS["gentle_megasaur"]!); // 5/4 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, alley_cat: 10, gentle_megasaur: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 6 as Tier,
              board: [murloc, beast],
              shop: [megasaur],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Gentle Megasaur should be 5/4 (base stats, no keywords)
    const megasaurOnBoard = board.find((m) => m.cardId === "gentle_megasaur");
    expect(megasaurOnBoard).toBeDefined();
    expect(megasaurOnBoard!.atk).toBe(5);
    expect(megasaurOnBoard!.hp).toBe(4);
    expect(megasaurOnBoard!.keywords.size).toBe(0);

    // The Murloc should have exactly 1 new keyword from the adapt list
    const murlocOnBoard = board.find((m) => m.instanceId === murloc.instanceId);
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.keywords.size).toBe(1);
    // The keyword should be one of the adapt keywords
    const adaptKeywords = [
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
    ];
    const keyword = [...murlocOnBoard!.keywords][0];
    expect(adaptKeywords).toContain(keyword);

    // The Beast should NOT be buffed (no keyword added)
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard).toBeDefined();
    expect(beastOnBoard!.keywords.size).toBe(0);
  });

  it("does nothing when there are no friendly Murlocs on board", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const megasaur = instantiate(MINIONS["gentle_megasaur"]!); // 5/4 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, gentle_megasaur: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 6 as Tier,
              board: [beast],
              shop: [megasaur],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Gentle Megasaur should have no keywords (no Murlocs to buff)
    const megasaurOnBoard = board.find((m) => m.cardId === "gentle_megasaur");
    expect(megasaurOnBoard).toBeDefined();
    expect(megasaurOnBoard!.keywords.size).toBe(0);
  });

  it("gives a keyword to each Murloc, not just one", () => {
    const base = makeInitialState(42);
    const murloc1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const murloc2 = instantiate(MINIONS["murloc_tidehunter"]!); // 2/3 Murloc
    const megasaur = instantiate(MINIONS["gentle_megasaur"]!); // 5/4 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        murloc_scout: 10,
        murloc_tidehunter: 10,
        gentle_megasaur: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 6 as Tier,
              board: [murloc1, murloc2],
              shop: [megasaur],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Both Murlocs should have exactly 1 keyword each
    const murloc1OnBoard = board.find((m) => m.instanceId === murloc1.instanceId);
    const murloc2OnBoard = board.find((m) => m.instanceId === murloc2.instanceId);
    expect(murloc1OnBoard).toBeDefined();
    expect(murloc2OnBoard).toBeDefined();
    expect(murloc1OnBoard!.keywords.size).toBe(1);
    expect(murloc2OnBoard!.keywords.size).toBe(1);
  });

  it("does not give a keyword to the Gentle Megasaur itself", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const megasaur = instantiate(MINIONS["gentle_megasaur"]!); // 5/4 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, gentle_megasaur: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 6 as Tier,
              board: [murloc],
              shop: [megasaur],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Gentle Megasaur is a Beast, not a Murloc, so it should not get a keyword
    const megasaurOnBoard = board.find((m) => m.cardId === "gentle_megasaur");
    expect(megasaurOnBoard).toBeDefined();
    expect(megasaurOnBoard!.keywords.size).toBe(0);
  });
});
