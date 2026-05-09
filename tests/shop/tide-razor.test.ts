import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Tide-Razor (tier 3) — battlecry gives a random friendly Murloc +1/+1 and Rush
// ---------------------------------------------------------------------------

describe("tide-razor — onBattlecry", () => {
  it("gives a random friendly Murloc +1/+1 and Rush when played to board", () => {
    const base = makeInitialState(42);
    const scout = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const nonMurloc = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const tideRazor = instantiate(MINIONS["tide_razor_t3"]!); // 3/4 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, alley_cat: 10, tide_razor_t3: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [scout, nonMurloc],
              shop: [tideRazor],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Tide-Razor itself should be 3/4 (base stats)
    const razorOnBoard = board.find((m) => m.cardId === "tide_razor_t3");
    expect(razorOnBoard).toBeDefined();
    expect(razorOnBoard!.atk).toBe(3);
    expect(razorOnBoard!.hp).toBe(4);

    // The Murloc Scout should be buffed to 2/2 with Rush
    const scoutOnBoard = board.find((m) => m.instanceId === scout.instanceId);
    expect(scoutOnBoard).toBeDefined();
    expect(scoutOnBoard!.atk).toBe(2); // 1 + 1
    expect(scoutOnBoard!.hp).toBe(2); // 1 + 1
    expect(scoutOnBoard!.keywords.has("rush")).toBe(true);
  });

  it("does NOT buff non-Murloc friendly minions", () => {
    const base = makeInitialState(42);
    const nonMurloc = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const tideRazor = instantiate(MINIONS["tide_razor_t3"]!); // 3/4 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, tide_razor_t3: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [nonMurloc],
              shop: [tideRazor],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should NOT be buffed
    const catOnBoard = board.find((m) => m.instanceId === nonMurloc.instanceId);
    expect(catOnBoard!.atk).toBe(1);
    expect(catOnBoard!.hp).toBe(1);
  });

  it("does nothing when there are no other Murlocs on board", () => {
    const base = makeInitialState(42);
    const nonMurloc = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const tideRazor = instantiate(MINIONS["tide_razor_t3"]!); // 3/4 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, tide_razor_t3: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [nonMurloc],
              shop: [tideRazor],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Tide-Razor should not buff itself
    const razorOnBoard = board.find((m) => m.cardId === "tide_razor_t3");
    expect(razorOnBoard!.atk).toBe(3);
    expect(razorOnBoard!.hp).toBe(4);
  });

  it("buffs exactly one Murloc when multiple exist", () => {
    const base = makeInitialState(42);
    const scout1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const scout2 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const tideRazor = instantiate(MINIONS["tide_razor_t3"]!); // 3/4 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 20, tide_razor_t3: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [scout1, scout2],
              shop: [tideRazor],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    // Exactly one Murloc should be buffed to 2/2 with Rush
    const buffed = board.filter(
      (m) => m.instanceId === scout1.instanceId || m.instanceId === scout2.instanceId,
    );
    const buffedCount = buffed.filter((m) => m.atk === 2 && m.hp === 2).length;
    expect(buffedCount).toBe(1);
    // The other should remain at 1/1
    const unbuffed = buffed.find((m) => m.atk === 1 && m.hp === 1);
    expect(unbuffed).toBeDefined();
  });
});
