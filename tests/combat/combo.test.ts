import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { applyComboToBoard, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(0);

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

function minion(id: string) {
  return instantiate(getMinion(id));
}

describe("combo keyword", () => {
  it("gives +2/+2 to all friendly minions with combo when a card is played", () => {
    const state = makeTestState();

    // Put a combo minion on the board (1/1 base)
    const comboMinion = minion("combo_minion");
    const stateWithCombo = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [comboMinion],
      })),
    };

    // Apply combo — the combo minion should gain +2/+2
    const after = applyComboToBoard(stateWithCombo, 0);
    const player = after.players[0]!;
    expect(player.board[0]!.atk).toBe(3); // 1 + 2
    expect(player.board[0]!.hp).toBe(3); // 1 + 2
  });

  it("does not affect minions without combo keyword", () => {
    const state = makeTestState();

    // Put a non-combo minion on the board
    const tinyfin = instantiate(getMinion("murloc_tinyfin"));
    const stateWithTinyfin = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [tinyfin],
      })),
    };

    const after = applyComboToBoard(stateWithTinyfin, 0);
    const player = after.players[0]!;
    expect(player.board[0]!.atk).toBe(1); // unchanged
    expect(player.board[0]!.hp).toBe(1); // unchanged
  });

  it("buffs all combo minions on board", () => {
    const state = makeTestState();

    // Put two combo minions on the board
    const combo1 = minion("combo_minion");
    const combo2 = minion("combo_minion");
    const stateWithCombo = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [combo1, combo2],
      })),
    };

    const after = applyComboToBoard(stateWithCombo, 0);
    const player = after.players[0]!;
    expect(player.board[0]!.atk).toBe(3);
    expect(player.board[0]!.hp).toBe(3);
    expect(player.board[1]!.atk).toBe(3);
    expect(player.board[1]!.hp).toBe(3);
  });

  it("combo minion played to board triggers combo on existing board minions", () => {
    const state = makeTestState();

    // Put a combo minion on the board first
    const existingCombo = minion("combo_minion");
    const stateWithCombo = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [existingCombo],
      })),
    };

    // Play another minion — combo should fire, buffing the existing combo minion
    const newMinion = minion("murloc_tidehunter");
    const after = playMinionToBoard(
      {
        ...stateWithCombo,
        players: stateWithCombo.players.map((p) => ({
          ...p,
          hand: [newMinion],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    // The existing combo minion should have been buffed by +2/+2
    const buffedCombo = player.board.find((m) => m.cardId === "combo_minion");
    expect(buffedCombo).toBeDefined();
    expect(buffedCombo!.atk).toBe(3); // 1 + 2
    expect(buffedCombo!.hp).toBe(3); // 1 + 2
  });

  it("stacks — playing multiple cards compounds combo buffs", () => {
    const state = makeTestState();

    // Put a combo minion on the board
    const comboMinion = minion("combo_minion");
    const stateWithCombo = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [comboMinion],
      })),
    };

    // First play: combo fires, buffing to 3/3
    const minion1 = minion("murloc_tidehunter");
    const after1 = playMinionToBoard(
      {
        ...stateWithCombo,
        players: stateWithCombo.players.map((p) => ({
          ...p,
          hand: [minion1],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    // Second play: combo fires again, buffing combo minion to 5/5
    const minion2 = minion("murloc_tidehunter");
    const after2 = playMinionToBoard(
      {
        ...after1,
        players: after1.players.map((p) => ({
          ...p,
          hand: [minion2],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after2.players[0]!;
    const buffedCombo = player.board.find((m) => m.cardId === "combo_minion");
    expect(buffedCombo).toBeDefined();
    expect(buffedCombo!.atk).toBe(5); // 1 + 2 + 2
    expect(buffedCombo!.hp).toBe(5); // 1 + 2 + 2
  });
});
