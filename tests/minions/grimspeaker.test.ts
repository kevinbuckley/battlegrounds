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

describe("grimspeaker", () => {
  it("base stats are 3/3", () => {
    const minion = instantiate(getMinion("grimspeaker"));
    expect(minion.atk).toBe(3);
    expect(minion.hp).toBe(3);
    expect(minion.maxHp).toBe(3);
    expect(minion.tribes).toContain("Demon");
  });

  it("golden version is 6/6", () => {
    const minion = instantiate(getMinion("grimspeaker"), true);
    expect(minion.atk).toBe(6);
    expect(minion.hp).toBe(6);
    expect(minion.maxHp).toBe(6);
    expect(minion.golden).toBe(true);
  });

  it("battlecry gives a friendly Demon +2/+2 and Taunt", () => {
    const state = makeTestState();
    const demon = makeMinion("imp_gang_boss");
    const newState = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [demon],
      })),
    };
    const grimspeaker = makeMinion("grimspeaker");
    const grimspeakerOnBoard = { ...grimspeaker };
    const stateWithBoth = {
      ...newState,
      players: newState.players.map((p) => ({
        ...p,
        board: [demon, grimspeakerOnBoard],
      })),
    };
    const grimspeakerInstance = stateWithBoth.players[0]!.board.find(
      (m) => m.cardId === "grimspeaker",
    )!;
    const result = grimspeakerInstance.hooks.onBattlecry!({
      self: grimspeakerInstance,
      playerId: 0,
      state: stateWithBoth,
      rng: makeRng(0),
      spellDamage: 0,
    });
    const board = getPlayer(result, 0).board;
    const buffedDemon = board.find((m) => m.cardId === "imp_gang_boss")!;
    expect(buffedDemon.atk).toBe(4); // 2 + 2
    expect(buffedDemon.hp).toBe(6); // 4 + 2
    expect(buffedDemon.keywords).toContain("taunt");
  });

  it("does nothing when no friendly Demons exist", () => {
    const state = makeTestState();
    const grimspeaker = makeMinion("grimspeaker");
    const grimspeakerInstance = { ...grimspeaker };
    const result = grimspeakerInstance.hooks.onBattlecry!({
      self: grimspeakerInstance,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });
    expect(getPlayer(result, 0).board.length).toBe(0);
  });

  it("only buffs the first friendly Demon found", () => {
    const state = makeTestState();
    const demon1 = makeMinion("imp_gang_boss");
    const demon2 = makeMinion("vulgar_homunculus");
    const grimspeaker = makeMinion("grimspeaker");
    const grimspeakerInstance = { ...grimspeaker };
    const stateWithBoard = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [demon1, demon2, grimspeakerInstance],
      })),
    };
    const result = grimspeakerInstance.hooks.onBattlecry!({
      self: grimspeakerInstance,
      playerId: 0,
      state: stateWithBoard,
      rng: makeRng(0),
      spellDamage: 0,
    });
    const board = getPlayer(result, 0).board;
    const firstDemon = board.find((m) => m.cardId === "imp_gang_boss")!;
    expect(firstDemon.atk).toBe(4); // 2 + 2
    expect(firstDemon.hp).toBe(6); // 4 + 2
    expect(firstDemon.keywords).toContain("taunt");
    // Second demon should remain unbuffed
    const secondDemon = board.find((m) => m.cardId === "vulgar_homunculus")!;
    expect(secondDemon.atk).toBe(3);
    expect(secondDemon.hp).toBe(4);
  });
});
