import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string) {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number) {
  return instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

function makeTestState(board: MinionInstance[]): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: base.players.map((p, i) =>
      i === 0 ? { ...p, gold: 10, tier: 4, shop: [], hand: [], board, spellDamage: 0 } : p,
    ),
  } as GameState;
}

// ---------------------------------------------------------------------------
// Blingtron 4000 — tier 4 mech, 3/3, battlecry summons a 1/1 Robot Pup
// for each friendly Mech on your board (including itself)
// ---------------------------------------------------------------------------

describe("blingtron_4000 battlecry", () => {
  it("summons Robot Pups equal to friendly Mech count on play", () => {
    const blingtron = minion("blingtron_4000"); // 3/3
    const annoy = minion("annoy_o_tron"); // 1/2

    const state = makeTestState([blingtron, annoy]);

    const afterBattlecry = blingtron.hooks!.onBattlecry!({
      self: blingtron,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    expect(finalBoard.length).toBe(4); // 2 original + 2 pups

    const pups = finalBoard.filter((m) => m.cardId === "robot_pup");
    expect(pups.length).toBe(2);
    for (const pup of pups) {
      expect(pup.atk).toBe(1);
      expect(pup.hp).toBe(1);
    }
  });

  it("summons 1 Robot Pup when only Blingtron is on board", () => {
    const blingtron = minion("blingtron_4000");

    const state = makeTestState([blingtron]);

    const afterBattlecry = blingtron.hooks!.onBattlecry!({
      self: blingtron,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    expect(finalBoard.length).toBe(2); // 1 blingtron + 1 pup
    const pups = finalBoard.filter((m) => m.cardId === "robot_pup");
    expect(pups.length).toBe(1);
  });

  it("respects board cap of 7", () => {
    const blingtron = minion("blingtron_4000");
    const otherMechs = [
      minion("annoy_o_tron"),
      minion("annoy_o_tron"),
      minion("annoy_o_tron"),
      minion("annoy_o_tron"),
      minion("annoy_o_tron"),
    ];

    const state = makeTestState([blingtron, ...otherMechs]); // 6 minions, 6 Mechs

    const afterBattlecry = blingtron.hooks!.onBattlecry!({
      self: blingtron,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    expect(finalBoard.length).toBe(7); // 6 existing + 1 pup (cap)
    const pups = finalBoard.filter((m) => m.cardId === "robot_pup");
    expect(pups.length).toBe(1);
  });

  it("summons 1 pup for Blingtron alone (counts itself)", () => {
    const blingtron = minion("blingtron_4000");

    const state = makeTestState([blingtron]);

    const afterBattlecry = blingtron.hooks!.onBattlecry!({
      self: blingtron,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    expect(finalBoard.length).toBe(2);
    const pups = finalBoard.filter((m) => m.cardId === "robot_pup");
    expect(pups.length).toBe(1);
  });
});
