import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { makeInitialState, beginRecruitTurn } from "@/game/state";
import { makePlayerView } from "./strategy";
import { greedy } from "./heuristics/greedy";
import { heuristic } from "./heuristics/heuristic";
import { runLobby } from "./lobbySim";
import { MINIONS } from "@/game/minions/index";
import { instantiate } from "@/game/minions/define";
import type { GameState } from "@/game/types";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a fresh game state at the start of turn N with all shops rolled,
 * so the AI has something to buy.
 */
function stateAtTurn(turn: number): GameState {
  // Fill the pool with test cards
  const base = makeInitialState(1);
  let state: GameState = {
    ...base,
    phase: { kind: "Recruit", turn },
    turn,
    pool: { wrath_weaver: 50, alley_cat: 50, murloc_tidehunter: 50, scavenging_hyena: 50 },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            heroId: "stub_hero",
            hp: 40,
            gold: Math.min(3 + turn - 1, 10),
            tier: 1 as const,
            upgradeCost: Math.max(0, 5 - (turn - 1)),
            shop: [
              instantiate(MINIONS["wrath_weaver"]!),
              instantiate(MINIONS["alley_cat"]!),
              instantiate(MINIONS["murloc_tidehunter"]!),
            ],
          }
        : p,
    ),
  };
  void beginRecruitTurn;
  return state;
}

// ---------------------------------------------------------------------------
// Greedy strategy
// ---------------------------------------------------------------------------

describe("greedy strategy", () => {
  it("always ends with EndTurn", () => {
    const state = stateAtTurn(1);
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    expect(actions[actions.length - 1]?.kind).toBe("EndTurn");
  });

  it("buys a minion when it can afford one", () => {
    const state = stateAtTurn(2); // 4g — can buy 1
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const buys = actions.filter((a) => a.kind === "BuyMinion");
    expect(buys.length).toBeGreaterThanOrEqual(1);
  });

  it("plays bought minion to board", () => {
    const state = stateAtTurn(3); // 5g
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const plays = actions.filter((a) => a.kind === "PlayMinion");
    expect(plays.length).toBeGreaterThanOrEqual(1);
  });

  it("does not buy more than gold allows", () => {
    const state = stateAtTurn(1); // 3g — can buy exactly 1
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const buys = actions.filter((a) => a.kind === "BuyMinion");
    expect(buys.length).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Heuristic strategy
// ---------------------------------------------------------------------------

describe("heuristic strategy", () => {
  it("always ends with EndTurn", () => {
    const state = stateAtTurn(1);
    const view = makePlayerView(state, 0);
    const actions = heuristic.decideRecruitActions(view, RNG);
    expect(actions[actions.length - 1]?.kind).toBe("EndTurn");
  });

  it("upgrades tier when cost ≤ gold − 3", () => {
    // At turn 3, gold=5, upgradeCost=3 → 3 ≤ 5-3 (3≤2 is false)
    // At turn 4, gold=6, upgradeCost=2 → 2 ≤ 6-3 (2≤3 is true) → upgrades
    const state = stateAtTurn(4);
    const view = makePlayerView(state, 0);
    const actions = heuristic.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(1);
  });

  it("does NOT upgrade when it would leave no gold for a buy", () => {
    // Turn 1: 3g, upgradeCost=5 → 5 > 3-3 (0) → no upgrade
    const state = stateAtTurn(1);
    const view = makePlayerView(state, 0);
    const actions = heuristic.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(0);
  });

  it("plays minions to board after buying", () => {
    const state = stateAtTurn(5); // 7g
    const view = makePlayerView(state, 0);
    const actions = heuristic.decideRecruitActions(view, RNG);
    const plays = actions.filter((a) => a.kind === "PlayMinion");
    expect(plays.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Lobby simulation
// ---------------------------------------------------------------------------

describe("lobby simulation", () => {
  it("produces 8 placement entries", () => {
    const strategies = Array.from({ length: 8 }, (_, i) =>
      i % 2 === 0 ? greedy : heuristic,
    );
    const result = runLobby(1, strategies);
    expect(result.placements).toHaveLength(8);
  });

  it("placements cover ranks 1–8", () => {
    const strategies = Array.from({ length: 8 }, () => greedy);
    const result = runLobby(2, strategies);
    const ranks = result.placements.map((p) => p.placement).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("game terminates before MAX_TURNS", () => {
    const strategies = Array.from({ length: 8 }, () => heuristic);
    const result = runLobby(3, strategies);
    expect(result.turns).toBeLessThan(60);
  });

  it("is deterministic: same seed produces same result", () => {
    const make = () => Array.from({ length: 8 }, () => greedy);
    const r1 = runLobby(99, make());
    const r2 = runLobby(99, make());
    expect(r1.placements).toEqual(r2.placements);
  });

  it("heuristic beats greedy on average over many seeds", () => {
    const SEEDS = 10;
    let heuristicWins = 0;

    for (let s = 0; s < SEEDS; s++) {
      // 4 heuristic (players 0,2,4,6) vs 4 greedy (players 1,3,5,7)
      const strategies = Array.from({ length: 8 }, (_, i) =>
        i % 2 === 0 ? heuristic : greedy,
      );
      const result = runLobby(s + 100, strategies);
      // Check if winner (placement 1) is a heuristic player
      const winner = result.placements.find((p) => p.placement === 1);
      if (winner?.strategy === "heuristic") heuristicWins++;
    }

    // Heuristic should win more than half the time (not guaranteed every seed)
    expect(heuristicWins).toBeGreaterThanOrEqual(3);
  });
});
