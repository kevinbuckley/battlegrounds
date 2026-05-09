import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Defender of Argus — battlecry gives adjacent friendly minions +1/+1 and taunt
// ---------------------------------------------------------------------------

describe("defender-of-argus — onBattlecry", () => {
  it("gives adjacent friendly minions +1/+1 and taunt when played to board", () => {
    const base = makeInitialState(42);
    const minionA = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const minionB = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const defender = instantiate(MINIONS["defender_of_argus"]!); // 1/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, murloc_scout: 10, defender_of_argus: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [minionA, minionB],
              shop: [defender],
            }
          : p,
      ),
    };

    // Buy and play Defender of Argus at index 1 (between minionA and minionB)
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Defender itself should be 1/3 (base stats, no self-buff)
    const defenderOnBoard = board.find((m) => m.cardId === "defender_of_argus");
    expect(defenderOnBoard).toBeDefined();
    expect(defenderOnBoard!.atk).toBe(1);
    expect(defenderOnBoard!.hp).toBe(3);
    expect(defenderOnBoard!.keywords).not.toContain("taunt");

    // Left neighbor (minionA at index 0) should be buffed to 2/2 with taunt
    const minionAOnBoard = board.find((m) => m.instanceId === minionA.instanceId);
    expect(minionAOnBoard).toBeDefined();
    expect(minionAOnBoard!.atk).toBe(2); // 1 + 1
    expect(minionAOnBoard!.hp).toBe(2); // 1 + 1
    expect(minionAOnBoard!.keywords).toContain("taunt");

    // Right neighbor (minionB at index 2) should be buffed to 2/2 with taunt
    const minionBOnBoard = board.find((m) => m.instanceId === minionB.instanceId);
    expect(minionBOnBoard).toBeDefined();
    expect(minionBOnBoard!.atk).toBe(2); // 1 + 1
    expect(minionBOnBoard!.hp).toBe(2); // 1 + 1
    expect(minionBOnBoard!.keywords).toContain("taunt");
  });

  it("does NOT buff non-adjacent friendly minions", () => {
    const base = makeInitialState(42);
    const minionA = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const minionB = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const minionC = instantiate(MINIONS["flame_imp"]!); // 1/2 Demon
    const defender = instantiate(MINIONS["defender_of_argus"]!); // 1/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        alley_cat: 10,
        murloc_scout: 10,
        flame_imp: 10,
        defender_of_argus: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [minionA, minionB],
              shop: [defender, minionC],
            }
          : p,
      ),
    };

    // Buy and play Defender of Argus at index 2 (after minionA and minionB)
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 2, RNG);

    const board = afterPlay.players[0]!.board;

    // minionA at index 0 is NOT adjacent to defender at index 2 (minionB is between them)
    const minionAOnBoard = board.find((m) => m.instanceId === minionA.instanceId);
    expect(minionAOnBoard!.atk).toBe(1);
    expect(minionAOnBoard!.hp).toBe(1);
    expect(minionAOnBoard!.keywords).not.toContain("taunt");

    // minionB at index 1 IS adjacent to defender at index 2
    const minionBOnBoard = board.find((m) => m.instanceId === minionB.instanceId);
    expect(minionBOnBoard!.atk).toBe(2);
    expect(minionBOnBoard!.hp).toBe(2);
    expect(minionBOnBoard!.keywords).toContain("taunt");
  });

  it("works when Defender is at board edge (index 0) — only right neighbor gets buffed", () => {
    const base = makeInitialState(42);
    const minionA = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const minionB = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const defender = instantiate(MINIONS["defender_of_argus"]!); // 1/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, murloc_scout: 10, defender_of_argus: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [minionA, minionB],
              shop: [defender],
            }
          : p,
      ),
    };

    // Buy and play Defender of Argus at index 0 (leftmost edge)
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Defender at index 0 — no left neighbor, only right neighbor (index 1) gets buffed
    const defenderOnBoard = board.find((m) => m.cardId === "defender_of_argus");
    expect(defenderOnBoard).toBeDefined();
    expect(defenderOnBoard!.atk).toBe(1);
    expect(defenderOnBoard!.hp).toBe(3);

    // minionA at index 1 (right neighbor) should be buffed
    const minionAOnBoard = board.find((m) => m.instanceId === minionA.instanceId);
    expect(minionAOnBoard!.atk).toBe(2);
    expect(minionAOnBoard!.hp).toBe(2);
    expect(minionAOnBoard!.keywords).toContain("taunt");

    // minionB at index 2 (NOT adjacent) should NOT be buffed
    const minionBOnBoard = board.find((m) => m.instanceId === minionB.instanceId);
    expect(minionBOnBoard!.atk).toBe(1);
    expect(minionBOnBoard!.hp).toBe(1);
    expect(minionBOnBoard!.keywords).not.toContain("taunt");
  });

  it("does nothing when there are no other friendly minions on board", () => {
    const base = makeInitialState(42);
    const defender = instantiate(MINIONS["defender_of_argus"]!); // 1/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { defender_of_argus: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [],
              shop: [defender],
            }
          : p,
      ),
    };

    // Buy and play Defender of Argus alone
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    expect(board.length).toBe(1);

    const defenderOnBoard = board.find((m) => m.cardId === "defender_of_argus");
    expect(defenderOnBoard!.atk).toBe(1);
    expect(defenderOnBoard!.hp).toBe(3);
    expect(defenderOnBoard!.keywords).not.toContain("taunt");
  });

  it("does NOT add duplicate taunt if minion already has it, but still buffs stats", () => {
    const base = makeInitialState(42);
    const tauntMinion = instantiate(MINIONS["righteous_protector"]!); // 1/1, divineShield + taunt
    const defender = instantiate(MINIONS["defender_of_argus"]!); // 1/3 Mech

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        righteous_protector: 10,
        defender_of_argus: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [tauntMinion],
              shop: [defender],
            }
          : p,
      ),
    };

    // Buy and play Defender of Argus at index 1 (adjacent to tauntMinion)
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Taunt minion should be buffed to 2/2 (stats always buffed) and keep taunt (no duplicate)
    const tauntOnBoard = board.find((m) => m.instanceId === tauntMinion.instanceId);
    expect(tauntOnBoard!.atk).toBe(2); // 1 + 1
    expect(tauntOnBoard!.hp).toBe(2); // 1 + 1
    expect(tauntOnBoard!.keywords).toContain("taunt");
    // Verify taunt appears only once in the set (no duplicate)
    let tauntCount = 0;
    for (const k of tauntOnBoard!.keywords) {
      if (k === "taunt") tauntCount++;
    }
    expect(tauntCount).toBe(1);
  });
});
