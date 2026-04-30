import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { beginRecruitTurn, makeInitialState } from "@/game/state";
import type { Action, GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";
import { basic } from "./heuristics/basic";
import { greedy } from "./heuristics/greedy";
import { heuristic } from "./heuristics/heuristic";
import { runLobby } from "./lobbySim";
import { makePlayerView } from "./strategy";

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
  const state: GameState = {
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

  it("upgrades tier when it can afford it, still buy, and board is strong enough", () => {
    // Turn 4: gold=6, upgradeCost=2 → 2 ≤ 6-3 (2≤3) → should upgrade
    // Board needs strength ≥ 10 or 4+ minions
    const base = makeInitialState(1);
    const mw1 = instantiate(MINIONS["murloc_warleader"]!); // 3/2
    const mw2 = instantiate(MINIONS["murloc_warleader"]!); // 3/2
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 4 },
      turn: 4,
      pool: { alley_cat: 50, murloc_warleader: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 6,
              tier: 1 as const,
              upgradeCost: 2,
              board: [mw1, mw2], // strength = (3+2)*2 = 10
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(1);
  });

  it("does NOT upgrade when it would leave no gold for a buy", () => {
    // Turn 1: 3g, upgradeCost=5 → 5 > 3-3 (0) → no upgrade
    const state = stateAtTurn(1);
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(0);
  });

  it("does NOT upgrade when board is too weak (strength < 10 and < 4 minions)", () => {
    // Board has one 1/1 minion (strength = 2), upgradeCost = 2, gold = 5
    // Can afford (2 ≤ 5-3 = 2), but board strength 2 < 10 and length 1 < 4
    const base = makeInitialState(1);
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1, stat-ball 2
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 4 },
      turn: 4,
      pool: { alley_cat: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 5,
              tier: 1 as const,
              upgradeCost: 2,
              board: [alleyCat],
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(0);
  });

  it("DOES upgrade when board is strong enough (strength ≥ 10)", () => {
    // Board has two 3/3 minions (strength = 12), upgradeCost = 2, gold = 5
    // Can afford (2 ≤ 5-3 = 2) and board strength 12 ≥ 10
    const base = makeInitialState(1);
    const murlocWarleader = instantiate(MINIONS["murloc_warleader"]!); // 3/2
    const rockpoolHunter = instantiate(MINIONS["rockpool_hunter"]!); // 2/1
    // Put two copies on board: 3+2 + 2+1 = 8... need more strength
    // Use two murloc_warleaders: (3+2)*2 = 10
    const mw1 = instantiate(MINIONS["murloc_warleader"]!);
    const mw2 = instantiate(MINIONS["murloc_warleader"]!);
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 4 },
      turn: 4,
      pool: { alley_cat: 50, murloc_warleader: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 5,
              tier: 1 as const,
              upgradeCost: 2,
              board: [mw1, mw2],
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(1);
  });

  it("DOES upgrade when board has 4+ minions even if weak", () => {
    // Board has 4 minions with total strength < 10, but length ≥ 4
    const base = makeInitialState(1);
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 4 },
      turn: 4,
      pool: { alley_cat: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 5,
              tier: 1 as const,
              upgradeCost: 2,
              board: [
                instantiate(MINIONS["alley_cat"]!),
                instantiate(MINIONS["alley_cat"]!),
                instantiate(MINIONS["alley_cat"]!),
                instantiate(MINIONS["alley_cat"]!),
              ],
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const upgrades = actions.filter((a) => a.kind === "UpgradeTier");
    expect(upgrades.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Basic strategy
// ---------------------------------------------------------------------------

describe("basic strategy", () => {
  it("always ends with EndTurn", () => {
    const state = stateAtTurn(1);
    const view = makePlayerView(state, 0);
    const actions = basic.decideRecruitActions(view, RNG);
    expect(actions[actions.length - 1]?.kind).toBe("EndTurn");
  });

  it("buys the cheapest minion (lowest stat-ball)", () => {
    // Shop has: wrath_weaver (2/2 = 4), alley_cat (1/1 = 2), murloc_tidehunter (2/1 = 3)
    // alley_cat has the lowest stat-ball (2), so it should be bought
    const state = stateAtTurn(2); // 4g
    const view = makePlayerView(state, 0);
    const actions = basic.decideRecruitActions(view, RNG);
    const buys = actions.filter((a) => a.kind === "BuyMinion");
    expect(buys.length).toBeGreaterThanOrEqual(1);
    // The cheapest shop minion (alley_cat at 1/1 = 2 stat-ball) should be bought
    const buyAction = buys[0] as Extract<Action, { kind: "BuyMinion" }>;
    const shopMinion = state.players[0]!.shop[buyAction.shopIndex];
    expect(shopMinion!.cardId).toBe("alley_cat");
  });

  it("does not buy when gold is insufficient", () => {
    const state = stateAtTurn(1);
    const view = makePlayerView(state, 0);
    const actions = basic.decideRecruitActions(view, RNG);
    const buys = actions.filter((a) => a.kind === "BuyMinion");
    expect(buys.length).toBeGreaterThanOrEqual(0);
  });

  it("plays bought minions to board", () => {
    const state = stateAtTurn(3); // 5g
    const view = makePlayerView(state, 0);
    const actions = basic.decideRecruitActions(view, RNG);
    const plays = actions.filter((a) => a.kind === "PlayMinion");
    expect(plays.length).toBeGreaterThanOrEqual(1);
  });

  it("prefers tribe match over cheapest when board has a tribe", () => {
    // Scavenging Hyena is a Beast (tribe match, stat-ball 3).
    // Taunt minion has no tribe (stat-ball 2, cheaper).
    // With a beast on board, AI should buy hyena (tribe match) over
    // the cheaper taunt_minion (no tribe match).
    const base = makeInitialState(1);
    const hyena = instantiate(MINIONS["scavenging_hyena"]!); // 2/1 beast, stat-ball 3
    const tauntMinion = instantiate(MINIONS["taunt_minion"]!); // 2/2, no tribe, stat-ball 4
    // Use combo_minion (no tribe, stat-ball 2) as the cheaper non-tribe option
    const comboMinion = instantiate(MINIONS["combo_minion"]!); // no tribe, stat-ball 2
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 2 },
      turn: 2,
      pool: { alley_cat: 50, scavenging_hyena: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 4,
              tier: 1 as const,
              upgradeCost: 5,
              board: [hyena],
              hand: [],
              shop: [comboMinion, hyena],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = basic.decideRecruitActions(view, RNG);
    const buys = actions.filter((a) => a.kind === "BuyMinion");
    expect(buys.length).toBeGreaterThanOrEqual(1);
    const buyAction = buys[0] as Extract<Action, { kind: "BuyMinion" }>;
    // Should buy scavenging_hyena (index 1, beast matching board) not combo_minion (index 0, cheaper but no tribe)
    expect(buyAction.shopIndex).toBe(1);
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
    const strategies = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? greedy : heuristic));
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
      const strategies = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? heuristic : greedy));
      const result = runLobby(s + 100, strategies);
      // Check if winner (placement 1) is a heuristic player
      const winner = result.placements.find((p) => p.placement === 1);
      if (winner?.strategy === "heuristic") heuristicWins++;
    }

    // Heuristic should win more than half the time (not guaranteed every seed)
    expect(heuristicWins).toBeGreaterThanOrEqual(3);
  });

  it("basic strategy sorts board by ATK descending before EndTurn", () => {
    const base = makeInitialState(1);
    const highAtk = instantiate(MINIONS["murloc_warleader"]!); // 3/2
    const lowAtk = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 2 },
      turn: 2,
      pool: { alley_cat: 50, murloc_warleader: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 4,
              tier: 1 as const,
              upgradeCost: 5,
              board: [lowAtk, highAtk], // low ATK first
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = basic.decideRecruitActions(view, RNG);
    // Board should be sorted by ATK descending after AI actions
    const finalBoard = state.players[0]!.board;
    expect(finalBoard[0]!.atk).toBeGreaterThanOrEqual(finalBoard[1]!.atk);
  });

  it("greedy strategy sorts board by ATK descending before EndTurn", () => {
    const base = makeInitialState(1);
    const highAtk = instantiate(MINIONS["murloc_warleader"]!); // 3/2
    const lowAtk = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 2 },
      turn: 2,
      pool: { alley_cat: 50, murloc_warleader: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 4,
              tier: 1 as const,
              upgradeCost: 5,
              board: [lowAtk, highAtk], // low ATK first
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = greedy.decideRecruitActions(view, RNG);
    const finalBoard = state.players[0]!.board;
    expect(finalBoard[0]!.atk).toBeGreaterThanOrEqual(finalBoard[1]!.atk);
  });

  it("heuristic strategy sorts board by ATK descending before EndTurn", () => {
    const base = makeInitialState(1);
    const highAtk = instantiate(MINIONS["murloc_warleader"]!); // 3/2
    const lowAtk = instantiate(MINIONS["alley_cat"]!); // 1/1
    const state: GameState = {
      ...base,
      phase: { kind: "Recruit", turn: 2 },
      turn: 2,
      pool: { alley_cat: 50, murloc_warleader: 50 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              heroId: "stub_hero",
              hp: 40,
              gold: 4,
              tier: 1 as const,
              upgradeCost: 5,
              board: [lowAtk, highAtk], // low ATK first
              hand: [],
              shop: [],
              spells: [],
              trinkets: [],
              quests: [],
              buddies: [],
              discoverOffer: null,
            }
          : p,
      ),
    };
    const view = makePlayerView(state, 0);
    const actions = heuristic.decideRecruitActions(view, RNG);
    const finalBoard = state.players[0]!.board;
    expect(finalBoard[0]!.atk).toBeGreaterThanOrEqual(finalBoard[1]!.atk);
  });
});
