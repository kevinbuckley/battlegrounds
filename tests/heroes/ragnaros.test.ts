import { describe, expect, it } from "vitest";
import { ragnaros } from "@/game/heroes/ragnaros";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, step } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeRagnarosState(
  board0: MinionInstance[] = [],
  board1: MinionInstance[] = [],
  board2: MinionInstance[] = [],
  board3: MinionInstance[] = [],
  board4: MinionInstance[] = [],
  board5: MinionInstance[] = [],
  board6: MinionInstance[] = [],
  board7: MinionInstance[] = [],
): GameState {
  const state = makeInitialState(42);
  const boards = [board0, board1, board2, board3, board4, board5, board6, board7];
  let s = step(state, { kind: "SelectHero", player: 0, heroId: "ragnaros" }, makeRng(42));
  for (let i = 1; i < 8; i++) {
    s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(42));
  }
  return {
    ...s,
    phase: { kind: "Recruit", turn: 5 },
    turn: 5,
    players: s.players.map((p, i) => ({
      ...p,
      board: boards[i]!,
      shop: [],
      hand: [],
      tier: 3,
    })),
  };
}

// ---------------------------------------------------------------------------
// Ragnaros — passive: start of combat, deal 8 damage to lowest-ATK enemy
// ---------------------------------------------------------------------------

describe("Ragnaros — hero definition", () => {
  it("has correct id", () => {
    expect(ragnaros.id).toBe("ragnaros");
  });

  it("has correct name", () => {
    expect(ragnaros.name).toBe("Ragnaros the Firelord");
  });

  it("has 40 start HP", () => {
    expect(ragnaros.startHp).toBe(40);
  });

  it("has passive power kind", () => {
    expect(ragnaros.power.kind).toBe("passive");
  });

  it("has description mentioning 8 damage", () => {
    expect(ragnaros.description).toContain("8 damage");
  });
});

describe("Ragnaros — start-of-combat passive", () => {
  it("deals 8 damage to lowest-ATK enemy minion", () => {
    const alley = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state = makeRagnarosState([alley], [alley], [], [], [], [], [], []);
    const result = step(state, { kind: "EndTurn", player: 0 }, makeRng(42));
    const opponent = result.players[1]!;
    expect(opponent.board.length).toBe(0); // 1 - 8 = -7, dead
  });

  it("targets lowest-ATK minion when multiple enemies exist", () => {
    const strong = instantiate(MINIONS["dragonspawn_lieutenant"]!); // 4/6
    const weak = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state = makeRagnarosState([], [weak, strong], [], [], [], [], [], []);
    const result = step(state, { kind: "EndTurn", player: 0 }, makeRng(42));
    const opponent = result.players[1]!;
    const dragonAlive = opponent.board.find((m) => m.cardId === "dragonspawn_lieutenant");
    expect(dragonAlive).toBeDefined();
    const alleyAlive = opponent.board.find((m) => m.cardId === "alley_cat");
    expect(alleyAlive).toBeUndefined();
  });

  it("kills a minion with ≤ 8 HP", () => {
    const alley = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state = makeRagnarosState([alley], [alley], [], [], [], [], [], []);
    const result = step(state, { kind: "EndTurn", player: 0 }, makeRng(42));
    expect(result.players[1]!.board.length).toBe(0);
  });

  it("does nothing when enemy has no minions", () => {
    const state = makeRagnarosState([], [], [], [], [], [], [], []);
    const result = step(state, { kind: "EndTurn", player: 0 }, makeRng(42));
    expect(result.players[0]!.heroId).toBe("ragnaros");
  });

  it("does not fire for non-Ragnaros heroes", () => {
    const state = makeInitialState(42);
    const alley = instantiate(MINIONS["alley_cat"]!);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "stub_hero" }, makeRng(42));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(42));
    }
    const stateWithBoard: GameState = {
      ...s,
      phase: { kind: "Recruit", turn: 5 },
      turn: 5,
      players: s.players.map((p, i) => ({
        ...p,
        board: i === 0 ? [alley] : [],
        shop: [],
        hand: [],
        tier: 3,
      })),
    };
    const result = step(stateWithBoard, { kind: "EndTurn", player: 0 }, makeRng(42));
    expect(result.players[0]!.heroId).not.toBe("ragnaros");
  });

  it("Ragnaros does not affect own board", () => {
    const alley = instantiate(MINIONS["alley_cat"]!);
    const state = makeRagnarosState([alley], [alley], [], [], [], [], [], []);
    const result = step(state, { kind: "EndTurn", player: 0 }, makeRng(42));
    // Player 0's minion should be untouched (Ragnaros only damages enemies)
    expect(result.players[0]!.board.length).toBe(1);
  });
});
