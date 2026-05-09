import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Crystalweaver — onBattlecry gives all friendly Demons +2/+2
// ---------------------------------------------------------------------------

describe("crystalweaver — onBattlecry", () => {
  it("gives all friendly Demons +2/+2 on battlecry", () => {
    const base = makeInitialState(42);
    const demon = instantiate(
      MINIONS["vulgar_homunculus"]!, // 3/4 Demon
    );
    const crystalweaver = instantiate(MINIONS["crystalweaver"]!); // 4/4 Dragon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { vulgar_homunculus: 10, crystalweaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [demon],
              shop: [crystalweaver],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Demon should be buffed: 3+2=5 atk, 4+2=6 hp
    const demonOnBoard = board.find((m) => m.instanceId === demon.instanceId);
    expect(demonOnBoard).toBeDefined();
    expect(demonOnBoard!.atk).toBe(5);
    expect(demonOnBoard!.hp).toBe(6);
  });

  it("does NOT buff non-Demon friendly minions", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const crystalweaver = instantiate(MINIONS["crystalweaver"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, crystalweaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [beast],
              shop: [crystalweaver],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const catOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(catOnBoard!.atk).toBe(1);
    expect(catOnBoard!.hp).toBe(1);
  });

  it("does nothing when there are no friendly Demons on board", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const nonDemon = instantiate(MINIONS["flame_imp"]!); // 1/2 Demon — wait, flame_imp IS a demon
    const crystalweaver = instantiate(MINIONS["crystalweaver"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, crystalweaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [beast],
              shop: [crystalweaver],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const catOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(catOnBoard!.atk).toBe(1);
    expect(catOnBoard!.hp).toBe(1);
  });

  it("buffs multiple Demons independently", () => {
    const base = makeInitialState(42);
    const demon1 = instantiate(
      MINIONS["vulgar_homunculus"]!, // 3/4 Demon
    );
    const demon2 = instantiate(
      MINIONS["flame_imp"]!, // 3/1 Demon
    );
    const crystalweaver = instantiate(MINIONS["crystalweaver"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { vulgar_homunculus: 10, flame_imp: 10, crystalweaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [demon1, demon2],
              shop: [crystalweaver],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const d1 = board.find((m) => m.instanceId === demon1.instanceId);
    const d2 = board.find((m) => m.instanceId === demon2.instanceId);
    expect(d1).toBeDefined();
    expect(d2).toBeDefined();
    expect(d1!.atk).toBe(5); // 3+2
    expect(d1!.hp).toBe(6); // 4+2
    expect(d2!.atk).toBe(5); // 3+2
    expect(d2!.hp).toBe(3); // 1+2
  });
});
