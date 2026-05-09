import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  const virmenSensei = instantiate(MINIONS["virmen_sensei"]!); // 3/4 Dragon
  const drakonidEnforcer = instantiate(MINIONS["drakonid_enforcer"]!); // 3/6 Dragon
  const boulderfogOgre = instantiate(MINIONS["boulderfog_ogre"]!); // 10/2 non-Dragon
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: {
      virmen_sensei: 10,
      drakonid_enforcer: 10,
      boulderfog_ogre: 10,
    },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 4 as Tier,
            board: [drakonidEnforcer],
            shop: [virmenSensei, boulderfogOgre],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Virmen Sensei — battlecry gives a friendly Dragon +2/+2
// ---------------------------------------------------------------------------

describe("virmen sensei — onBattlecry", () => {
  it("gives a friendly Dragon +2/+2 when played to board", () => {
    const state = makeTestState();
    const virmenSenseiCard = state.players[0]!.shop[0]!;
    const drakonidOnBoard0 = state.players[0]!.board[0]!;

    // Buy Virmen Sensei from shop
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Virmen Sensei to board at index 1 (after the Drakonid Enforcer)
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Virmen Sensei
      1, // board index 1
      RNG,
    );

    // The Drakonid Enforcer (Dragon) should be buffed from 3/6 to 5/8
    const drakonidOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === drakonidOnBoard0.instanceId,
    );
    expect(drakonidOnBoard).toBeDefined();
    expect(drakonidOnBoard!.atk).toBe(5); // 3 + 2
    expect(drakonidOnBoard!.hp).toBe(8); // 6 + 2

    // Virmen Sensei itself should be 3/4 (base stats, no self-buff)
    const vsOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === virmenSenseiCard.instanceId,
    );
    expect(vsOnBoard).toBeDefined();
    expect(vsOnBoard!.atk).toBe(3);
    expect(vsOnBoard!.hp).toBe(4);
  });

  it("does NOT buff non-Dragon minions", () => {
    const base = makeInitialState(42);
    const virmenSensei = instantiate(MINIONS["virmen_sensei"]!);
    const boulderfogOgre = instantiate(MINIONS["boulderfog_ogre"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { virmen_sensei: 10, boulderfog_ogre: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [boulderfogOgre],
              shop: [virmenSensei, boulderfogOgre],
            }
          : p,
      ),
    };

    // Buy and play Virmen Sensei
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // The Boulderfog Ogre should NOT be buffed (stays 10/2)
    const ogreOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "boulderfog_ogre");
    expect(ogreOnBoard).toBeDefined();
    expect(ogreOnBoard!.atk).toBe(10);
    expect(ogreOnBoard!.hp).toBe(2);
  });

  it("does nothing when there are no friendly Dragons on board", () => {
    const base = makeInitialState(42);
    const virmenSensei = instantiate(MINIONS["virmen_sensei"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { virmen_sensei: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [murlocScout],
              shop: [virmenSensei, murlocScout],
            }
          : p,
      ),
    };

    // Buy and play Virmen Sensei
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // The Murloc Scout should be unchanged (no Dragon to buff)
    const murlocOnBoard = afterPlay.players[0]!.board.find((m) => m.cardId === "murloc_scout");
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(1);
  });

  it("stacks when multiple Virmen Senseis are played", () => {
    const base = makeInitialState(42);
    const drakonidEnforcer = instantiate(MINIONS["drakonid_enforcer"]!); // 3/6 Dragon
    const virmenSensei1 = instantiate(MINIONS["virmen_sensei"]!);
    const virmenSensei2 = instantiate(MINIONS["virmen_sensei"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        virmen_sensei: 10,
        drakonid_enforcer: 10,
        murloc_scout: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [drakonidEnforcer],
              shop: [virmenSensei1, virmenSensei2, murlocScout],
            }
          : p,
      ),
    };

    // Buy and play first Virmen Sensei
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Buy and play second Virmen Sensei
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 2, RNG);

    // Drakonid Enforcer should be buffed +4/+4 total (2 Virmen Senseis × +2/+2) → 7/10
    const drakonidOnBoard = afterPlay2.players[0]!.board.find(
      (m) => m.cardId === "drakonid_enforcer",
    );
    expect(drakonidOnBoard!.atk).toBe(7); // 3 + 2 + 2
    expect(drakonidOnBoard!.hp).toBe(10); // 6 + 2 + 2
  });
});
