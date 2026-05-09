import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Menagerie Magician — onBattlecry gives +2/+2 to one Beast, one Dragon,
// and one Murloc on board (excluding self).
// ---------------------------------------------------------------------------

describe("menagerie-magician — onBattlecry", () => {
  it("gives +2/+2 to one Beast, one Dragon, and one Murloc on board", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const dragon = instantiate(MINIONS["hangry_dragon"]!); // 2/3 Dragon
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const demon = instantiate(MINIONS["vulgar_homunculus"]!); // 3/4 Demon
    const magician = instantiate(MINIONS["menagerie_magician"]!); // 4/4

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        alley_cat: 10,
        dredgrot_whelp: 10,
        murloc_scout: 10,
        vulgar_homunculus: 10,
        menagerie_magician: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [beast, dragon, murloc, demon],
              shop: [magician],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const magicianOnBoard = board.find((m) => m.cardId === "menagerie_magician");
    expect(magicianOnBoard).toBeDefined();
    expect(magicianOnBoard!.atk).toBe(4);
    expect(magicianOnBoard!.hp).toBe(4);

    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard).toBeDefined();
    expect(beastOnBoard!.atk).toBe(3); // 1 + 2
    expect(beastOnBoard!.hp).toBe(3); // 1 + 2

    const dragonOnBoard = board.find((m) => m.instanceId === dragon.instanceId);
    expect(dragonOnBoard).toBeDefined();
    expect(dragonOnBoard!.atk).toBe(4); // 2 + 2
    expect(dragonOnBoard!.hp).toBe(5); // 3 + 2

    const murlocOnBoard = board.find((m) => m.instanceId === murloc.instanceId);
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.atk).toBe(3); // 1 + 2
    expect(murlocOnBoard!.hp).toBe(3); // 1 + 2

    const demonOnBoard = board.find((m) => m.instanceId === demon.instanceId);
    expect(demonOnBoard).toBeDefined();
    expect(demonOnBoard!.atk).toBe(3); // base, not buffed
    expect(demonOnBoard!.hp).toBe(4); // base, not buffed
  });

  it("does NOT buff non-tribe minions (Demon stays unchanged)", () => {
    const base = makeInitialState(42);
    const demon = instantiate(MINIONS["vulgar_homunculus"]!); // 3/4 Demon
    const magician = instantiate(MINIONS["menagerie_magician"]!); // 4/4

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { vulgar_homunculus: 10, menagerie_magician: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [demon],
              shop: [magician],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const demonOnBoard = board.find((m) => m.instanceId === demon.instanceId);
    expect(demonOnBoard).toBeDefined();
    expect(demonOnBoard!.atk).toBe(3); // base, not buffed
    expect(demonOnBoard!.hp).toBe(4); // base, not buffed
  });

  it("skips gracefully when board is missing a tribe", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const demon = instantiate(MINIONS["vulgar_homunculus"]!); // 3/4 Demon
    const magician = instantiate(MINIONS["menagerie_magician"]!); // 4/4

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, vulgar_homunculus: 10, menagerie_magician: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [beast, demon],
              shop: [magician],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard).toBeDefined();
    expect(beastOnBoard!.atk).toBe(3); // 1 + 2
    expect(beastOnBoard!.hp).toBe(3); // 1 + 2
  });

  it("does NOT buff itself", () => {
    const base = makeInitialState(42);
    const magician = instantiate(MINIONS["menagerie_magician"]!); // 4/4

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { menagerie_magician: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 4 as Tier,
              board: [],
              shop: [magician],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 0, RNG);

    const board = afterPlay.players[0]!.board;

    const magicianOnBoard = board.find((m) => m.cardId === "menagerie_magician");
    expect(magicianOnBoard).toBeDefined();
    expect(magicianOnBoard!.atk).toBe(4);
    expect(magicianOnBoard!.hp).toBe(4);
  });
});
