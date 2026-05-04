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

function makeMinion(cardId: string) {
  return instantiate(getMinion(cardId));
}

describe("buccaneer", () => {
  it("base stats are 3/2", () => {
    const minion = instantiate(getMinion("buccaneer"));
    expect(minion.atk).toBe(3);
    expect(minion.hp).toBe(2);
    expect(minion.maxHp).toBe(2);
    expect(minion.tribes).toContain("Pirate");
  });

  it("golden version is 6/4", () => {
    const minion = instantiate(getMinion("buccaneer"), true);
    expect(minion.atk).toBe(6);
    expect(minion.hp).toBe(4);
    expect(minion.maxHp).toBe(4);
    expect(minion.golden).toBe(true);
  });

  it("battlecry gives a friendly Pirate +2/+2", () => {
    const state = makeTestState();
    const pirate = makeMinion("bloodsail_pirate");
    const newState = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [pirate],
      })),
    };
    const buccaneer = makeMinion("buccaneer");
    const buccaneerOnBoard = { ...buccaneer };
    const stateWithBoth = {
      ...newState,
      players: newState.players.map((p) => ({
        ...p,
        board: [pirate, buccaneerOnBoard],
      })),
    };
    const buccaneerInstance = stateWithBoth.players[0]!.board.find(
      (m) => m.cardId === "buccaneer",
    )!;
    const result = buccaneerInstance.hooks.onBattlecry!({
      self: buccaneerInstance,
      playerId: 0,
      state: stateWithBoth,
      rng: makeRng(0),
      spellDamage: 0,
    });
    const board = getPlayer(result, 0).board;
    const buffedPirate = board.find((m) => m.cardId === "bloodsail_pirate")!;
    expect(buffedPirate.atk).toBe(3); // 1 + 2
    expect(buffedPirate.hp).toBe(4); // 2 + 2
  });

  it("does nothing when no friendly Pirates exist", () => {
    const state = makeTestState();
    const buccaneer = makeMinion("buccaneer");
    const buccaneerInstance = { ...buccaneer };
    const result = buccaneerInstance.hooks.onBattlecry!({
      self: buccaneerInstance,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });
    expect(getPlayer(result, 0).board.length).toBe(0);
  });

  it("only buffs the first friendly Pirate found", () => {
    const state = makeTestState();
    const pirate1 = makeMinion("bloodsail_pirate");
    const pirate2 = makeMinion("bloodsail_pirate");
    const buccaneer = makeMinion("buccaneer");
    const buccaneerInstance = { ...buccaneer };
    const stateWithBoard = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [pirate1, pirate2, buccaneerInstance],
      })),
    };
    const result = buccaneerInstance.hooks.onBattlecry!({
      self: buccaneerInstance,
      playerId: 0,
      state: stateWithBoard,
      rng: makeRng(0),
      spellDamage: 0,
    });
    const board = getPlayer(result, 0).board;
    const firstPirate = board.find((m) => m.cardId === "bloodsail_pirate");
    expect(firstPirate!.atk).toBe(3); // 1 + 2
    expect(firstPirate!.hp).toBe(4); // 2 + 2
    // Second pirate should remain unbuffed
    const secondPirate = board[1];
    expect(secondPirate!.atk).toBe(1);
    expect(secondPirate!.hp).toBe(2);
  });
});

function getPlayer(state: GameState, id: number) {
  return state.players[id]!;
}
