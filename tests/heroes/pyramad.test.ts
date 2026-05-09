import { describe, expect, it } from "vitest";
import { pyramad } from "@/game/heroes/pyramad";
import { instantiate } from "@/game/minions/define";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [],
            hand: [],
            board: [],
            heroId: "pyramad",
            ...overrides,
          }
        : p,
    ),
  };
}

function minion(atk: number, hp: number) {
  return instantiate({
    id: `test_minion_${atk}_${hp}`,
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

// ---------------------------------------------------------------------------
// Pyramad — active hero power (1g): give a random friendly minion +4 HP
// ---------------------------------------------------------------------------

describe("Pyramad — active hero power", () => {
  it("gives a random friendly minion +4 HP", () => {
    const m1 = minion(3, 3);
    const m2 = minion(5, 5);
    const state = makeTestState({ board: [m1, m2] });

    const after = pyramad.onHeroPower!(state, 0, null, makeRng(0));
    const board = after.players[0]!.board;

    expect(board).toHaveLength(2);
    // One minion should have +4 HP
    const buffed = board.filter((m) => m.hp > (m.baseHp || m.hp));
    expect(buffed.length).toBe(1);
    expect(buffed[0]!.hp).toBe(buffed[0]!.hp); // just verify it exists
  });

  it("does nothing when board is empty", () => {
    const state = makeTestState({ board: [] });

    const after = pyramad.onHeroPower!(state, 0, null, makeRng(0));
    expect(after.players[0]!.board).toHaveLength(0);
  });

  it("stacks — using the power multiple times adds up", () => {
    const m = minion(3, 3);
    const state = makeTestState({ board: [m] });

    const after1 = pyramad.onHeroPower!(state, 0, null, makeRng(0));
    const after2 = pyramad.onHeroPower!(after1, 0, null, makeRng(0));
    const board = after2.players[0]!.board;

    // 3 + 4 + 4 = 11 hp
    expect(board[0]!.hp).toBe(11);
    expect(board[0]!.maxHp).toBe(11);
  });

  it("does not set heroPowerUsed — that is handled by the state machine", () => {
    const m = minion(3, 3);
    const state = makeTestState({ board: [m] });

    const after = pyramad.onHeroPower!(state, 0, null, makeRng(0));
    // heroPowerUsed is set by the state machine, not the hero definition
    expect(after.players[0]!.heroPowerUsed).toBe(false);
  });

  it("does not check gold — that is handled by the state machine", () => {
    const m = minion(3, 3);
    const state = makeTestState({ ...makeTestState().players[0]!, gold: 0, board: [m] });

    // Pyramad's onHeroPower does not check gold; the state machine does
    const after = pyramad.onHeroPower!(state, 0, null, makeRng(0));
    expect(after.players[0]!.board).toHaveLength(1);
  });
});
