import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Toxfin — battlecry gives ALL friendly Murlocs poisonous
// ---------------------------------------------------------------------------

describe("toxfin — onBattlecry", () => {
  it("gives ALL friendly Murlocs poisonous when played to board", () => {
    const base = makeInitialState(42);
    const murloc1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const murloc2 = instantiate(MINIONS["murloc_tidehunter"]!); // 2/1 Murloc
    const nonMurloc = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const toxfin = instantiate(MINIONS["toxfin"]!); // 1/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        murloc_scout: 10,
        murloc_tidehunter: 10,
        alley_cat: 10,
        toxfin: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [murloc1, murloc2, nonMurloc],
              shop: [toxfin],
            }
          : p,
      ),
    };

    // Buy and play Toxfin at index 3
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 3, RNG);

    const board = afterPlay.players[0]!.board;

    // Toxfin itself should NOT get poisonous (battlecry only affects OTHER Murlocs)
    const toxfinOnBoard = board.find((m) => m.cardId === "toxfin");
    expect(toxfinOnBoard).toBeDefined();
    expect(toxfinOnBoard!.keywords.has("poisonous")).toBe(false);

    // Murloc Scout should gain poisonous
    const murloc1OnBoard = board.find((m) => m.instanceId === murloc1.instanceId);
    expect(murloc1OnBoard).toBeDefined();
    expect(murloc1OnBoard!.keywords.has("poisonous")).toBe(true);

    // Murloc Tidehunter should gain poisonous
    const murloc2OnBoard = board.find((m) => m.instanceId === murloc2.instanceId);
    expect(murloc2OnBoard).toBeDefined();
    expect(murloc2OnBoard!.keywords.has("poisonous")).toBe(true);

    // Alley Cat (non-Murloc) should NOT get poisonous
    const nonMurlocOnBoard = board.find((m) => m.instanceId === nonMurloc.instanceId);
    expect(nonMurlocOnBoard).toBeDefined();
    expect(nonMurlocOnBoard!.keywords.has("poisonous")).toBe(false);
  });

  it("does NOT give itself poisonous", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const toxfin = instantiate(MINIONS["toxfin"]!); // 1/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, toxfin: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [murloc],
              shop: [toxfin],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Toxfin should NOT have poisonous
    const toxfinOnBoard = board.find((m) => m.cardId === "toxfin");
    expect(toxfinOnBoard).toBeDefined();
    expect(toxfinOnBoard!.keywords.has("poisonous")).toBe(false);

    // Other Murloc should have poisonous
    const murlocOnBoard = board.find((m) => m.instanceId === murloc.instanceId);
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.keywords.has("poisonous")).toBe(true);
  });

  it("does nothing when there are no friendly Murlocs on board", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const toxfin = instantiate(MINIONS["toxfin"]!); // 1/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, toxfin: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [beast],
              shop: [toxfin],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should NOT get poisonous
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard!.keywords.has("poisonous")).toBe(false);

    // Toxfin should NOT get poisonous
    const toxfinOnBoard = board.find((m) => m.cardId === "toxfin");
    expect(toxfinOnBoard!.keywords.has("poisonous")).toBe(false);
  });

  it("stacks across multiple Toxfins on board", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const toxfin1 = instantiate(MINIONS["toxfin"]!); // 1/3 Murloc
    const toxfin2 = instantiate(MINIONS["toxfin"]!); // 1/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, toxfin: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [murloc],
              shop: [toxfin1, toxfin2],
            }
          : p,
      ),
    };

    // Play first Toxfin
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Play second Toxfin (shop index 0 after first was bought)
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 1, RNG);

    const board = afterPlay2.players[0]!.board;

    // Murloc Scout should have poisonous (from both Toxfins)
    const murlocOnBoard = board.find((m) => m.instanceId === murloc.instanceId);
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.keywords.has("poisonous")).toBe(true);

    // First Toxfin gets poisonous from the second's battlecry (it's a friendly Murloc on board)
    // Second Toxfin does NOT get poisonous (no other Toxfin is played after it)
    const toxfins = board.filter((m) => m.cardId === "toxfin");
    expect(toxfins.length).toBe(2);
    const firstToxfin = toxfins.find((t) => t.instanceId === toxfin1.instanceId);
    const secondToxfin = toxfins.find((t) => t.instanceId === toxfin2.instanceId);
    // First Toxfin gets poisonous from the second's battlecry
    expect(firstToxfin!.keywords.has("poisonous")).toBe(true);
    // Second Toxfin does NOT get poisonous (nothing is played after it)
    expect(secondToxfin!.keywords.has("poisonous")).toBe(false);
  });
});
