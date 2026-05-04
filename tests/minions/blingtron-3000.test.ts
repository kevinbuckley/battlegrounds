import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeTestState() {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 } as GameState["phase"],
    turn: 1,
    players: base.players.map((p) => ({
      ...p,
      gold: 10,
      tier: 1 as GameState["players"][number]["tier"],
      shop: [],
      hand: [],
      board: [],
    })),
  };
}

function getPlayer(state: GameState, id: number) {
  return state.players[id]!;
}

function makeMinion(cardId: string) {
  return instantiate(getMinion(cardId));
}

describe("blingtron 3000", () => {
  it("base stats are 3/8", () => {
    const minion = instantiate(getMinion("blingtron_3000"));
    expect(minion.atk).toBe(3);
    expect(minion.hp).toBe(8);
    expect(minion.maxHp).toBe(8);
    expect(minion.tribes).toContain("Mech");
  });

  it("golden version is 6/16", () => {
    const minion = instantiate(getMinion("blingtron_3000"), true);
    expect(minion.atk).toBe(6);
    expect(minion.hp).toBe(16);
    expect(minion.maxHp).toBe(16);
    expect(minion.golden).toBe(true);
  });

  it("battlecry summons two 1/1 Robot Pups with Rush", () => {
    const state = makeTestState();
    const blingtron = makeMinion("blingtron_3000");
    const blingtronOnBoard = { ...blingtron };
    const stateWithBoard = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [blingtronOnBoard],
      })),
    };
    const blingtronInstance = stateWithBoard.players[0]!.board.find(
      (m) => m.cardId === "blingtron_3000",
    )!;
    const result = blingtronInstance.hooks.onBattlecry!({
      self: blingtronInstance,
      playerId: 0,
      state: stateWithBoard,
      rng: makeRng(0),
      spellDamage: 0,
    });
    const board = getPlayer(result, 0).board;
    expect(board.length).toBe(3); // blingtron + 2 robot pups
    const pups = board.filter((m) => m.cardId === "robot_pup");
    expect(pups.length).toBe(2);
    for (const pup of pups) {
      expect(pup.baseAtk).toBe(1);
      expect(pup.baseHp).toBe(1);
      expect(pup.atk).toBe(1);
      expect(pup.hp).toBe(1);
      expect(pup.keywords.has("rush")).toBe(true);
      expect(pup.tribes).toContain("Mech");
    }
  });

  it("does nothing when board is full (7 minions)", () => {
    const state = makeTestState();
    const blingtron = makeMinion("blingtron_3000");
    const existingMinions = Array.from({ length: 6 }, () => instantiate(getMinion("annoy_o_tron")));
    const blingtronOnBoard = { ...blingtron };
    const stateWithBoard = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [blingtronOnBoard, ...existingMinions],
      })),
    };
    const blingtronInstance = stateWithBoard.players[0]!.board.find(
      (m) => m.cardId === "blingtron_3000",
    )!;
    const result = blingtronInstance.hooks.onBattlecry!({
      self: blingtronInstance,
      playerId: 0,
      state: stateWithBoard,
      rng: makeRng(0),
      spellDamage: 0,
    });
    const board = getPlayer(result, 0).board;
    expect(board.length).toBe(7);
    const pups = board.filter((m) => m.cardId === "robot_pup");
    expect(pups.length).toBe(0); // board was already full
  });
});
