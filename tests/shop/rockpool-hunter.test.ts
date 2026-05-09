import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Rockpool Hunter — battlecry gives a random friendly Murloc +1/+1
// ---------------------------------------------------------------------------

describe("rockpool-hunter — onBattlecry", () => {
  it("gives a random friendly Murloc +1/+1 when played to board", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const hunter = instantiate(MINIONS["rockpool_hunter"]!); // 1/2 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, rockpool_hunter: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [murloc],
              shop: [hunter],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Rockpool Hunter itself should remain 1/2 (battlecry does not buff self)
    const hunterOnBoard = board.find((m) => m.cardId === "rockpool_hunter");
    expect(hunterOnBoard).toBeDefined();
    expect(hunterOnBoard!.atk).toBe(1);
    expect(hunterOnBoard!.hp).toBe(2);

    // Murloc Scout should gain +1/+1 → 2/2
    const murlocOnBoard = board.find((m) => m.instanceId === murloc.instanceId);
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.atk).toBe(2);
    expect(murlocOnBoard!.hp).toBe(2);
  });

  it("does nothing when there are no friendly Murlocs on board", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const hunter = instantiate(MINIONS["rockpool_hunter"]!); // 1/2 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, rockpool_hunter: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [hunter],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should remain 1/1 (not buffed)
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard!.atk).toBe(1);
    expect(beastOnBoard!.hp).toBe(1);

    // Rockpool Hunter should remain 1/2
    const hunterOnBoard = board.find((m) => m.cardId === "rockpool_hunter");
    expect(hunterOnBoard!.atk).toBe(1);
    expect(hunterOnBoard!.hp).toBe(2);
  });

  it("gives +1/+1 to one of multiple friendly Murlocs", () => {
    const base = makeInitialState(42);
    const murloc1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const murloc2 = instantiate(MINIONS["murloc_tidehunter"]!); // 2/1 Murloc
    const hunter = instantiate(MINIONS["rockpool_hunter"]!); // 1/2 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        murloc_scout: 10,
        murloc_tidehunter: 10,
        rockpool_hunter: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [murloc1, murloc2],
              shop: [hunter],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 2, RNG);

    const board = afterPlay.players[0]!.board;

    // Rockpool Hunter should remain 1/2
    const hunterOnBoard = board.find((m) => m.cardId === "rockpool_hunter");
    expect(hunterOnBoard!.atk).toBe(1);
    expect(hunterOnBoard!.hp).toBe(2);

    // Exactly one Murloc should be buffed (random selection)
    const murlocs = board.filter(
      (m) => m.tribes.includes("Murloc") && m.cardId !== "rockpool_hunter",
    );
    expect(murlocs.length).toBe(2);

    // One murloc should have been buffed (+1/+1), the other unchanged
    // Murloc Scout: 1/1 → 2/2 if buffed, stays 1/1 if not
    // Murloc Tidehunter: 2/1 → 3/2 if buffed, stays 2/1 if not
    const buffedScout = murlocs.find(
      (m) => m.cardId === "murloc_scout" && m.atk === 2 && m.hp === 2,
    );
    const buffedTidehunter = murlocs.find(
      (m) => m.cardId === "murloc_tidehunter" && m.atk === 3 && m.hp === 2,
    );
    const unbuffedScout = murlocs.find(
      (m) => m.cardId === "murloc_scout" && m.atk === 1 && m.hp === 1,
    );
    const unbuffedTidehunter = murlocs.find(
      (m) => m.cardId === "murloc_tidehunter" && m.atk === 2 && m.hp === 1,
    );

    // Exactly one murloc is buffed, one is not
    const isBuffed = buffedScout || buffedTidehunter;
    const isUnbuffed = unbuffedScout || unbuffedTidehunter;
    expect(isBuffed).toBeDefined();
    expect(isUnbuffed).toBeDefined();
  });

  it("does NOT buff non-Murloc friendly minions", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const hunter = instantiate(MINIONS["rockpool_hunter"]!); // 1/2 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, rockpool_hunter: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [hunter],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should remain 1/1 (not buffed)
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard!.atk).toBe(1);
    expect(beastOnBoard!.hp).toBe(1);
  });
});
