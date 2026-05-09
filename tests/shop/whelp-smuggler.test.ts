import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Whelp Smuggler — onShopSummon gives +2 HP to a random friendly Dragon
// ---------------------------------------------------------------------------

describe("whelp-smuggler — onShopSummon", () => {
  it("gives +2 HP to a random friendly Dragon when a Dragon is played to board", () => {
    const base = makeInitialState(42);
    const smuggler = instantiate(MINIONS["whelp_smuggler"]!); // 2/3 Dragon
    const dragon = instantiate(MINIONS["dragonspawn_lieutenant"]!); // 2/3 Dragon

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { whelp_smuggler: 10, dragonspawn_lieutenant: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [smuggler],
              shop: [dragon],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    const smugglerOnBoard = board.find((m) => m.instanceId === smuggler.instanceId);
    const whelpOnBoard = board.find((m) => m.instanceId === dragon.instanceId);

    expect(smugglerOnBoard).toBeDefined();
    expect(whelpOnBoard).toBeDefined();
    // The Whelp Smuggler (a Dragon on board) should get +2 HP
    expect(smugglerOnBoard!.hp).toBe(5);
    expect(smugglerOnBoard!.atk).toBe(2);
    // The summoned dragon should NOT be buffed
    expect(whelpOnBoard!.hp).toBe(3);
    expect(whelpOnBoard!.atk).toBe(2);
  });

  it("does NOT buff when a non-Dragon is played", () => {
    const base = makeInitialState(42);
    const smuggler = instantiate(MINIONS["whelp_smuggler"]!); // 2/3 Dragon
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { whelp_smuggler: 10, alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [smuggler],
              shop: [beast],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;
    const smugglerOnBoard = board.find((m) => m.instanceId === smuggler.instanceId);

    expect(smugglerOnBoard).toBeDefined();
    expect(smugglerOnBoard!.hp).toBe(3);
    expect(smugglerOnBoard!.atk).toBe(2);
  });

  it("does nothing when no friendly Dragons are on board", () => {
    const base = makeInitialState(42);
    const smuggler = instantiate(MINIONS["whelp_smuggler"]!); // 2/3 Dragon
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { whelp_smuggler: 10, alley_cat: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [],
              shop: [smuggler, beast],
            }
          : p,
      ),
    };

    // Play the beast first (shop index 1)
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Now play the smuggler (shop index 0)
    const afterBuy2 = buyMinion(afterPlay, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 0, RNG);

    const board = afterPlay2.players[0]!.board;
    const smugglerOnBoard = board.find((m) => m.instanceId === smuggler.instanceId);

    expect(smugglerOnBoard).toBeDefined();
    expect(smugglerOnBoard!.hp).toBe(3);
    expect(smugglerOnBoard!.atk).toBe(2);
  });
});
