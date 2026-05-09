import { describe, expect, it } from "vitest";
import mogorTheCurseGolem from "@/game/minions/tier5/mogor-the-curse-golem";
import { makeInitialState } from "@/game/state";
import type { GameState, MinionHooks, Tribe } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pairingsHistory: [[0, 1]],
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            shop: [],
            hand: [],
            board: [],
            heroId: "jaraxxus",
            ...overrides,
          }
        : p,
    ),
  };
}

function baseMinion(
  cardId: string,
  instanceId: string,
  tribes?: Tribe[],
): GameState["players"][number]["board"][number] {
  return {
    cardId,
    instanceId,
    baseAtk: 1,
    baseHp: 1,
    atk: 1,
    hp: 1,
    maxHp: 1,
    tribes: tribes || [],
    keywords: new Set(),
    golden: false,
    spellDamage: 0,
    attachments: {},
    hooks: {} as MinionHooks,
  };
}

// ---------------------------------------------------------------------------
// Mogor the Curse-Golem — battlecry: all friendly Mechs +2/+2
// ---------------------------------------------------------------------------

describe("Mogor the Curse-Golem — battlecry", () => {
  it("buffs all friendly Mechs +2/+2", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("mechano_egg", "m0", ["Mech"]),
          atk: 1,
          hp: 2,
          maxHp: 2,
        },
        {
          ...baseMinion("vulgar_homunculus", "m1"),
          atk: 2,
          hp: 2,
          maxHp: 2,
        },
      ],
    });

    const rng = makeRng(0);
    const after = mogorTheCurseGolem.hooks!.onBattlecry!({
      state,
      playerId: 0,
      self: state.players[0]!.board[0]!,
      rng,
      spellDamage: 0,
    });
    const board = after.players[0]!.board;

    expect(board).toHaveLength(2);
    expect(board[0]!.atk).toBe(3);
    expect(board[0]!.hp).toBe(4);
    expect(board[0]!.maxHp).toBe(4);
    // Non-Mech should be unchanged
    expect(board[1]!.atk).toBe(2);
    expect(board[1]!.hp).toBe(2);
    expect(board[1]!.maxHp).toBe(2);
  });

  it("does nothing when no Mechs on board", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("vulgar_homunculus", "m0"),
          atk: 2,
          hp: 2,
          maxHp: 2,
        },
      ],
    });

    const rng = makeRng(0);
    const after = mogorTheCurseGolem.hooks!.onBattlecry!({
      state,
      playerId: 0,
      self: state.players[0]!.board[0]!,
      rng,
      spellDamage: 0,
    });
    const board = after.players[0]!.board;

    expect(board[0]!.atk).toBe(2);
    expect(board[0]!.hp).toBe(2);
  });

  it("buffs multiple Mechs", () => {
    const state = makeTestState({
      board: [
        {
          ...baseMinion("mechano_egg", "m0", ["Mech"]),
          atk: 1,
          hp: 1,
          maxHp: 1,
        },
        {
          ...baseMinion("deflect_o_bot", "m1", ["Mech"]),
          atk: 2,
          hp: 3,
          maxHp: 3,
        },
        {
          ...baseMinion("vulgar_homunculus", "m2"),
          atk: 3,
          hp: 3,
          maxHp: 3,
        },
      ],
    });

    const rng = makeRng(0);
    const after = mogorTheCurseGolem.hooks!.onBattlecry!({
      state,
      playerId: 0,
      self: state.players[0]!.board[0]!,
      rng,
      spellDamage: 0,
    });
    const board = after.players[0]!.board;

    expect(board[0]!.atk).toBe(3);
    expect(board[0]!.hp).toBe(3);
    expect(board[1]!.atk).toBe(4);
    expect(board[1]!.hp).toBe(5);
    // Non-Mech unchanged
    expect(board[2]!.atk).toBe(3);
    expect(board[2]!.hp).toBe(3);
  });
});
