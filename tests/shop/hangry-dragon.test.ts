import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { Tier } from "@/game/types";

// ---------------------------------------------------------------------------
// Hangry Dragon — onTurnStart: gains +2/+2 if player HP > opponent HP
// ---------------------------------------------------------------------------

describe("hangry_dragon — onTurnStart", () => {
  it("gains +2/+2 when player has more HP than opponent", () => {
    const base = makeInitialState(42);
    const hangry = instantiate(MINIONS["hangry_dragon"]!); // 2/3 Dragon

    const playerBoard = [hangry];
    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { hangry_dragon: 10 },
      players: base.players.map((p, i) => {
        if (i === 0) {
          return {
            ...p,
            gold: 10,
            hp: 30,
            tier: 2 as Tier,
            board: playerBoard,
            heroId: "stub_hero",
          };
        }
        // All opponents have 15 HP, so player 0 (30) > all opponents
        return { ...p, hp: 15, heroId: "stub_hero" };
      }),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Player HP (30) > opponent HP (15), so Hangry Dragon gains +2/+2
    const dragon = player.board.find((m) => m.cardId === "hangry_dragon");
    expect(dragon).toBeDefined();
    expect(dragon!.atk).toBe(4);
    expect(dragon!.hp).toBe(5);
  });

  it("does NOT gain +2/+2 when player has less HP than opponent", () => {
    const base = makeInitialState(42);
    const hangry = instantiate(MINIONS["hangry_dragon"]!); // 2/3 Dragon

    const playerBoard = [hangry];
    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { hangry_dragon: 10 },
      players: base.players.map((p, i) => {
        if (i === 0) {
          return {
            ...p,
            gold: 10,
            hp: 15,
            tier: 2 as Tier,
            board: playerBoard,
            heroId: "stub_hero",
          };
        }
        // All opponents have 30 HP, so player 0 (15) < all opponents
        return { ...p, hp: 30, heroId: "stub_hero" };
      }),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Player HP (15) < opponent HP (30), no buff
    const dragon = player.board.find((m) => m.cardId === "hangry_dragon");
    expect(dragon).toBeDefined();
    expect(dragon!.atk).toBe(2);
    expect(dragon!.hp).toBe(3);
  });

  it("does NOT gain +2/+2 when HP is equal to opponent", () => {
    const base = makeInitialState(42);
    const hangry = instantiate(MINIONS["hangry_dragon"]!); // 2/3 Dragon

    const playerBoard = [hangry];
    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { hangry_dragon: 10 },
      players: base.players.map((p, i) => {
        if (i === 0) {
          return {
            ...p,
            gold: 10,
            hp: 20,
            tier: 2 as Tier,
            board: playerBoard,
            heroId: "stub_hero",
          };
        }
        // All opponents have 20 HP, equal to player
        return { ...p, hp: 20, heroId: "stub_hero" };
      }),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Player HP (20) === opponent HP (20), no buff (strictly greater required)
    const dragon = player.board.find((m) => m.cardId === "hangry_dragon");
    expect(dragon).toBeDefined();
    expect(dragon!.atk).toBe(2);
    expect(dragon!.hp).toBe(3);
  });
});
