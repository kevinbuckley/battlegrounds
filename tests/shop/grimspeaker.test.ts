import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

describe("Grimspeaker (tier 3 Demon) onBattlecry", () => {
  it("gives first friendly Demon on board +2/+2 and taunt", () => {
    const base = makeInitialState(42);
    const grimspeaker = instantiate(MINIONS["grimspeaker"]!);
    const homunculus = instantiate(MINIONS["vulgar_homunculus"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { grimspeaker: 10, vulgar_homunculus: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [homunculus],
              hand: [],
              shop: [grimspeaker],
            }
          : p,
      ),
    };

    // Vulgar Homunculus is 3/4, Grimspeaker gives +2/+2 → 5/6

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const gs = board[0]!;
    const hc = board[1]!;

    expect(gs.cardId).toBe("grimspeaker");
    expect(hc.atk).toBe(5);
    expect(hc.hp).toBe(6);
    expect(hc.keywords.has("taunt" as never)).toBe(true);
  });

  it("does not buff non-Demons", () => {
    const base = makeInitialState(42);
    const grimspeaker = instantiate(MINIONS["grimspeaker"]!);
    const alleyCat = instantiate(MINIONS["alley_cat"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { grimspeaker: 10, alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [alleyCat],
              hand: [],
              shop: [grimspeaker],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const cat = board[1]!;
    expect(cat.atk).toBe(1);
    expect(cat.hp).toBe(1);
    expect(cat.keywords.has("taunt" as never)).toBe(false);
  });

  it("does not buff itself when no other Demons on board", () => {
    const base = makeInitialState(42);
    const grimspeaker = instantiate(MINIONS["grimspeaker"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { grimspeaker: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              hand: [],
              shop: [grimspeaker],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const gs = board[0]!;
    expect(gs.atk).toBe(3);
    expect(gs.hp).toBe(3);
    expect(gs.keywords.has("taunt" as never)).toBe(false);
  });

  it("buffs only the first Demon, not others", () => {
    const base = makeInitialState(42);
    const grimspeaker = instantiate(MINIONS["grimspeaker"]!);
    const homunculus = instantiate(MINIONS["vulgar_homunculus"]!);
    const flameImp = instantiate(MINIONS["flame_imp"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { grimspeaker: 10, vulgar_homunculus: 10, flame_imp: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [homunculus, flameImp],
              hand: [],
              shop: [grimspeaker],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);
    const board = afterPlay.players[0]!.board;

    const hc = board[1]!;
    const imp = board[2]!;

    expect(hc.atk).toBe(5);
    expect(hc.hp).toBe(6);
    expect(hc.keywords.has("taunt" as never)).toBe(true);

    expect(imp.atk).toBe(3);
    expect(imp.hp).toBe(1);
    expect(imp.keywords.has("taunt" as never)).toBe(false);
  });
});
