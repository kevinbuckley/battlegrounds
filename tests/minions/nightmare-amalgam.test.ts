import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(0);

function makeTestState() {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 } as GameState["phase"],
    turn: 1,
    players: base.players.map((p) => ({
      ...p,
      gold: 10,
      tier: 1 as GameState["players"][number]["tier"],
      shop: [],
      hand: [],
      board: [],
    })),
  };
}

function makeMinion(cardId: string) {
  return instantiate(getMinion(cardId));
}

describe("nightmare_amalgam", () => {
  it("counts as all tribes for tribe-buff effects", () => {
    const amalgam = instantiate(getMinion("nightmare_amalgam"));

    // Verify that the instantiated amalgam has all tribes expanded
    expect(amalgam.tribes).toContain("Murloc");
    expect(amalgam.tribes).toContain("Beast");
    expect(amalgam.tribes).toContain("Demon");
    expect(amalgam.tribes).toContain("Mech");
    expect(amalgam.tribes).toContain("Elemental");
    expect(amalgam.tribes).toContain("Pirate");
    expect(amalgam.tribes).toContain("Dragon");
    expect(amalgam.tribes).toContain("Naga");
    expect(amalgam.tribes).toContain("Quilboar");
    expect(amalgam.tribes).toContain("Undead");
    expect(amalgam.tribes).not.toContain("All");
    expect(amalgam.tribes).toHaveLength(10);
  });

  it("gets buffed by Murloc Warleader during combat", () => {
    const warleader = instantiate(getMinion("murloc_warleader"));
    const amalgam = instantiate(getMinion("nightmare_amalgam"));
    // Need an enemy so simulateCombat does not return early
    const enemy = instantiate({
      id: "dummy_enemy",
      name: "Dummy",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const result = simulateCombat([warleader, amalgam], [enemy], RNG);

    // Warleader is 3/3, amalgam should be 4/4 (2/4 + 2 ATK from warleader)
    const w = result.survivorsLeft.find((m) => m.cardId === "murloc_warleader");
    const a = result.survivorsLeft.find((m) => m.cardId === "nightmare_amalgam");
    expect(w).toBeDefined();
    expect(a).toBeDefined();
    expect(w!.atk).toBe(3);
    expect(a!.atk).toBe(4);
    expect(a!.hp).toBe(4);
  });

  it("base stats are 2/4", () => {
    const amalgam = instantiate(getMinion("nightmare_amalgam"));
    expect(amalgam.atk).toBe(2);
    expect(amalgam.hp).toBe(4);
    expect(amalgam.maxHp).toBe(4);
  });

  it("golden version is 4/8", () => {
    const amalgam = instantiate(getMinion("nightmare_amalgam"), true);
    expect(amalgam.atk).toBe(4);
    expect(amalgam.hp).toBe(8);
    expect(amalgam.maxHp).toBe(8);
    expect(amalgam.golden).toBe(true);
  });

  it("counts as all tribes when played to board", () => {
    const state = makeTestState();

    // Put a minion with battlecry on the board
    const rockpool = makeMinion("rockpool_hunter");
    const stateWithRockpool = {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        board: [rockpool],
      })),
    };

    const amalgam = instantiate(getMinion("nightmare_amalgam"));
    const after = playMinionToBoard(
      {
        ...stateWithRockpool,
        players: stateWithRockpool.players.map((p) => ({
          ...p,
          hand: [amalgam],
        })),
      },
      0,
      0,
      1,
      RNG,
    );

    const player = after.players[0]!;
    const amalgamOnBoard = player.board.find((m) => m.cardId === "nightmare_amalgam");
    expect(amalgamOnBoard).toBeDefined();
    // Verify it has all tribes after being played to board
    expect(amalgamOnBoard!.tribes).toContain("Murloc");
    expect(amalgamOnBoard!.tribes).toContain("Dragon");
    expect(amalgamOnBoard!.tribes).toContain("Demon");
  });
});
