import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Wrath Weaver — onTurnEnd: deal 1 damage to hero, give friendly Demons +2/+2
// ---------------------------------------------------------------------------

describe("wrath-weaver — onTurnEnd", () => {
  it("deals 1 damage to hero and buffs friendly Demons +2/+2", () => {
    const base = makeInitialState(42);
    const vulgarHomunculus = instantiate(MINIONS["vulgar_homunculus"]!); // 3/4 Demon
    const wrathWeaver = instantiate(MINIONS["wrath_weaver"]!); // 1/3 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { vulgar_homunculus: 10, wrath_weaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [vulgarHomunculus, wrathWeaver],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Hero should have 24 HP (25 - 1)
    expect(player.hp).toBe(24);

    // Vulgar Homunculus should be buffed to 5/6 (3+2, 4+2)
    const hom = player.board.find((m) => m.cardId === "vulgar_homunculus");
    expect(hom).toBeDefined();
    expect(hom!.atk).toBe(5);
    expect(hom!.hp).toBe(6);
  });

  it("deals 1 damage to hero even with no friendly Demons", () => {
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const wrathWeaver = instantiate(MINIONS["wrath_weaver"]!); // 1/3 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, wrath_weaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [alleyCat, wrathWeaver],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Hero should have 24 HP (25 - 1) even with no Demons
    expect(player.hp).toBe(24);

    // Alley Cat should NOT be buffed
    const cat = player.board.find((m) => m.cardId === "alley_cat");
    expect(cat!.atk).toBe(1);
    expect(cat!.hp).toBe(1);
  });

  it("does NOT buff non-Demon friendly minions", () => {
    const base = makeInitialState(42);
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const vulgarHomunculus = instantiate(MINIONS["vulgar_homunculus"]!); // 1/2 Demon
    const wrathWeaver = instantiate(MINIONS["wrath_weaver"]!); // 1/3 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, vulgar_homunculus: 10, wrath_weaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [alleyCat, vulgarHomunculus, wrathWeaver],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Alley Cat should NOT be buffed
    const cat = player.board.find((m) => m.cardId === "alley_cat");
    expect(cat!.atk).toBe(1);
    expect(cat!.hp).toBe(1);

    // Vulgar Homunculus should be buffed to 5/6 (3+2, 4+2)
    const hom = player.board.find((m) => m.cardId === "vulgar_homunculus");
    expect(hom!.atk).toBe(5);
    expect(hom!.hp).toBe(6);
  });

  it("does nothing when there are no Demons on board (only Wrath Weaver itself)", () => {
    const base = makeInitialState(42);
    const wrathWeaver = instantiate(MINIONS["wrath_weaver"]!); // 1/3 Demon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { wrath_weaver: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [wrathWeaver],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    // Hero should have 24 HP (25 - 1)
    expect(player.hp).toBe(24);

    // Wrath Weaver itself should NOT buff itself (it's excluded)
    const ww = player.board.find((m) => m.cardId === "wrath_weaver");
    expect(ww!.atk).toBe(1);
    expect(ww!.hp).toBe(3);
  });
});
