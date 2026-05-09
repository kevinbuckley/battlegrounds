import { describe, expect, it } from "vitest";
import {
  deserializeReplay,
  makeInitialState,
  rngForTurn,
  serializeReplay,
  step,
} from "@/game/state";

function seeded(seed: number): ReturnType<typeof makeInitialState> {
  return makeInitialState(seed);
}

function p(
  state: ReturnType<typeof makeInitialState>,
): ReturnType<typeof makeInitialState>["players"][number] {
  return state.players[0]!;
}

function allHeroesSelected(
  state: ReturnType<typeof makeInitialState>,
): ReturnType<typeof makeInitialState> {
  const withHeroes = state.players.map((pl) =>
    pl.heroId === "" ? { ...pl, heroId: "stub_hero" } : pl,
  );
  return { ...state, players: withHeroes };
}

function startGame(seed: number): ReturnType<typeof makeInitialState> {
  let state = seeded(seed);
  state = step(
    state,
    { kind: "SelectHero", player: 0, heroId: "patchwerk" },
    rngForTurn(state, "sel"),
  );
  state = allHeroesSelected(state);
  state = step(
    state,
    { kind: "SelectHero", player: 0, heroId: "patchwerk" },
    rngForTurn(state, "sel"),
  );
  return state;
}

function next(state: ReturnType<typeof makeInitialState>): ReturnType<typeof makeInitialState> {
  return step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
}

describe("serializeReplay + deserializeReplay", () => {
  it("round-trips through makeInitialState", () => {
    const original = makeInitialState(42);
    const json = serializeReplay(original);
    const restored = deserializeReplay(json);

    expect(restored.seed).toBe(original.seed);
    expect(restored.turn).toBe(original.turn);
    expect(restored.tribesInLobby).toEqual(original.tribesInLobby);
    expect(restored.modifiers).toEqual(original.modifiers);
    expect(restored.players.length).toBe(original.players.length);
  });

  it("preserves board state across round-trip", () => {
    const state = startGame(99);
    // Find a minion in hand and play it to board
    const handMinion = p(state).hand[0];
    if (!handMinion) {
      // Skip if no hand minion (shouldn't happen but be safe)
      return;
    }
    const withBoard = step(
      state,
      { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 0 },
      rngForTurn(state, "play"),
    );
    const json = serializeReplay(withBoard);
    const restored = deserializeReplay(json);

    expect(restored.players[0]!.board.length).toBe(1);
    expect(restored.players[0]!.board[0]!.cardId).toBe(withBoard.players[0]!.board[0]!.cardId);
    expect(restored.players[0]!.board[0]!.atk).toBe(withBoard.players[0]!.board[0]!.atk);
    expect(restored.players[0]!.board[0]!.hp).toBe(withBoard.players[0]!.board[0]!.hp);
  });

  it("preserves gold and tier across round-trip", () => {
    const state = startGame(77);
    // Advance a few turns to accumulate gold
    let s = state;
    for (let i = 0; i < 3; i++) {
      s = next(s);
    }
    const json = serializeReplay(s);
    const restored = deserializeReplay(json);

    expect(restored.players[0]!.gold).toBe(s.players[0]!.gold);
    expect(restored.players[0]!.tier).toBe(s.players[0]!.tier);
    expect(restored.players[0]!.hp).toBe(s.players[0]!.hp);
    expect(restored.players[0]!.armor).toBe(s.players[0]!.armor);
  });
});
