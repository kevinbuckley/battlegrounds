import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  const packLeader = instantiate(MINIONS["pack_leader"]!); // 3/3 Beast
  const alleyCat1 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
  const alleyCat2 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast (second copy)
  const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1 non-Beast
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: { pack_leader: 10, alley_cat: 10, murloc_scout: 10 },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            board: [packLeader],
            shop: [alleyCat1, alleyCat2, murlocScout],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Pack Leader — onShopSummon buffs the summoned Beast +3 ATK
// ---------------------------------------------------------------------------

describe("pack leader — onShopSummon", () => {
  it("buffs a friendly Beast +3 ATK when a Beast is played to board", () => {
    const state = makeTestState();
    const alleyCat = state.players[0]!.shop[0]!;

    // Buy Alley Cat (a Beast) from shop → goes to hand
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Alley Cat to board at index 1 (after Pack Leader)
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Alley Cat
      1, // board index 1 = after Pack Leader
      RNG,
    );

    // The summoned Alley Cat should be buffed +3 ATK (1 → 4)
    const alleyCatOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === alleyCat.instanceId,
    );
    expect(alleyCatOnBoard).toBeDefined();
    expect(alleyCatOnBoard!.atk).toBe(4);
  });

  it("does NOT buff when a non-Beast is played", () => {
    const state = makeTestState();
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    // Put Murloc Scout in shop at index 0
    const stateWithScout = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [murlocScout] } : p)),
    };

    // Buy Murloc Scout (non-Beast)
    const afterBuy = buyMinion(stateWithScout, 0, 0);

    // Play it to board
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Murloc Scout should NOT be buffed (stays 1/1)
    const murlocOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "murloc_scout");
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.atk).toBe(1);
  });

  it("buffs the summoned Beast when Pack Leader is already on board", () => {
    const state = makeTestState();

    // Buy and play Alley Cat
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Alley Cat should be buffed to 4/1 (1 + 3 from Pack Leader)
    const alleyCatOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "alley_cat");
    expect(alleyCatOnBoard!.atk).toBe(4);
    expect(alleyCatOnBoard!.hp).toBe(1); // HP unchanged
  });

  it("stacks when multiple Beasts are played", () => {
    const state = makeTestState();

    // Buy and play first Alley Cat (Beast)
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Buy and play second Alley Cat (Beast)
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 2, RNG);

    // Both Alley Cats should be buffed to 4/1 (1 + 3 from Pack Leader)
    const alleyCats = afterPlay2.players[0]!.board.filter((m) => m.cardId === "alley_cat");
    expect(alleyCats.length).toBe(2);
    expect(alleyCats[0]!.atk).toBe(4);
    expect(alleyCats[1]!.atk).toBe(4);
  });
});
