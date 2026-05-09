import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Murloc Tidecaller — onRecruitSummon gains +1 ATK when a Murloc is played
// ---------------------------------------------------------------------------

describe("murloc-tidecaller — onRecruitSummon", () => {
  it("gains +1 ATK when a Murloc is played to board during recruit phase", () => {
    const base = makeInitialState(42);
    const tidecaller = instantiate(MINIONS["murloc_tidecaller"]!); // 1/1
    const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_tidecaller: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [tidecaller],
              shop: [murlocScout],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    const tcOnBoard = board.find((m) => m.instanceId === tidecaller.instanceId);

    expect(tcOnBoard).toBeDefined();
    expect(tcOnBoard!.atk).toBe(2);
    expect(tcOnBoard!.hp).toBe(1);
  });

  it("does NOT gain ATK when a non-Murloc is played", () => {
    const base = makeInitialState(42);
    const tidecaller = instantiate(MINIONS["murloc_tidecaller"]!); // 1/1
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_tidecaller: 10, alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [tidecaller],
              shop: [alleyCat],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    const tcOnBoard = board.find((m) => m.instanceId === tidecaller.instanceId);

    expect(tcOnBoard).toBeDefined();
    expect(tcOnBoard!.atk).toBe(1);
  });

  it("gains +2 ATK when two Murlocs are played", () => {
    const base = makeInitialState(42);
    const tidecaller = instantiate(MINIONS["murloc_tidecaller"]!); // 1/1
    const murlocScout1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const murlocScout2 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_tidecaller: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [tidecaller],
              shop: [murlocScout1, murlocScout2],
            }
          : p,
      ),
    };

    // Play first Murloc Scout
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 0, RNG);

    // Play second Murloc Scout (shop index 0 after first was bought)
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 0, RNG);

    const board = afterPlay2.players[0]!.board;
    const tcOnBoard = board.find((m) => m.instanceId === tidecaller.instanceId);

    expect(tcOnBoard).toBeDefined();
    expect(tcOnBoard!.atk).toBe(3);
    expect(tcOnBoard!.hp).toBe(1);
  });
});
