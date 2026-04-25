import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { makeInitialState, step } from "./state";

const RNG = makeRng(1);

function selectAllHeroes(state: ReturnType<typeof makeInitialState>) {
  let s = state;
  for (const p of s.players) {
    s = step(s, { kind: "SelectHero", player: p.id, heroId: "stub_hero" }, RNG);
  }
  return s;
}

describe("makeInitialState", () => {
  it("creates 8 players in HeroSelection phase", () => {
    const state = makeInitialState(1);
    expect(state.players).toHaveLength(8);
    expect(state.phase.kind).toBe("HeroSelection");
  });

  it("selects exactly 5 tribes", () => {
    const state = makeInitialState(1);
    expect(state.tribesInLobby).toHaveLength(5);
  });

  it("produces different tribe sets for different seeds", () => {
    const a = makeInitialState(1).tribesInLobby;
    const b = makeInitialState(2).tribesInLobby;
    expect(a).not.toEqual(b);
  });

  it("same seed always produces the same state", () => {
    const a = makeInitialState(99);
    const b = makeInitialState(99);
    expect(a.tribesInLobby).toEqual(b.tribesInLobby);
    expect(a.players.map((p) => p.name)).toEqual(b.players.map((p) => p.name));
  });
});

describe("hero selection → recruit transition", () => {
  it("stays in HeroSelection until all 8 players pick", () => {
    let state = makeInitialState(1);
    state = step(state, { kind: "SelectHero", player: 0, heroId: "stub_hero" }, RNG);
    expect(state.phase.kind).toBe("HeroSelection");
  });

  it("transitions to Recruit once all heroes selected", () => {
    const state = selectAllHeroes(makeInitialState(1));
    expect(state.phase.kind).toBe("Recruit");
  });

  it("sets hero HP and armor from the hero definition", () => {
    const state = selectAllHeroes(makeInitialState(1));
    for (const p of state.players) {
      expect(p.hp).toBe(40); // stub_hero has 40 HP, 0 armor
      expect(p.armor).toBe(0);
    }
  });

  it("throws for unknown hero id", () => {
    const state = makeInitialState(1);
    expect(() =>
      step(state, { kind: "SelectHero", player: 0, heroId: "nonexistent" }, RNG),
    ).toThrow("Unknown hero");
  });
});

describe("recruit phase — gold", () => {
  it("players start with 3 gold on turn 1", () => {
    const state = selectAllHeroes(makeInitialState(1));
    expect(state.phase.kind).toBe("Recruit");
    for (const p of state.players) {
      expect(p.gold).toBe(3);
    }
  });

  it("gold increases by 1 per turn up to 10", () => {
    let state = selectAllHeroes(makeInitialState(1));
    // EndTurn increments the turn counter and starts the next recruit
    for (let turn = 1; turn <= 8; turn++) {
      const expected = Math.min(3 + turn - 1, 10);
      expect(state.players[0]!.gold).toBe(expected);
      state = step(state, { kind: "EndTurn", player: 0 }, RNG);
    }
    expect(state.players[0]!.gold).toBe(10);
  });
});

describe("recruit phase — all action types dispatch without throwing", () => {
  it("FreezeShop succeeds", () => {
    const state = selectAllHeroes(makeInitialState(1));
    expect(() => step(state, { kind: "FreezeShop", player: 0 }, RNG)).not.toThrow();
  });

  it("RefreshShop deducts gold (if affordable)", () => {
    const state = selectAllHeroes(makeInitialState(1));
    // Turn 1 = 3 gold. Refresh costs 1g.
    const after = step(state, { kind: "RefreshShop", player: 0 }, RNG);
    expect(after.players[0]!.gold).toBe(2);
  });

  it("UpgradeTier fails gracefully when insufficient gold", () => {
    const state = selectAllHeroes(makeInitialState(1));
    // Turn 1 = 3 gold, upgrade costs 5 — should throw
    expect(() => step(state, { kind: "UpgradeTier", player: 0 }, RNG)).toThrow(
      "Not enough gold",
    );
  });
});
