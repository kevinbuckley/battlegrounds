import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string) {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number, tribes: import("@/game/types").Tribe[] = []) {
  return instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes,
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

function makeTestState(board: MinionInstance[]): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: base.players.map((p, i) =>
      i === 0 ? { ...p, gold: 10, tier: 5, shop: [], hand: [], board, spellDamage: 0 } : p,
    ),
  } as GameState;
}

// ---------------------------------------------------------------------------
// Baelgun, Equipment Maker — tier 5, 4/5, battlecry: give a friendly Mech +2/+2 and Magnetic
// ---------------------------------------------------------------------------

describe("baelgun battlecry", () => {
  it("gives a friendly Mech +2/+2 and Magnetic when played", () => {
    const baelgun = minion("baelgun"); // 4/5
    const annoy = minion("annoy_o_tron"); // 1/2 mech

    const state = makeTestState([baelgun, annoy]);

    const afterBattlecry = baelgun.hooks!.onBattlecry!({
      self: baelgun,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    const updatedAnnoy = finalBoard.find((m) => m.instanceId === annoy.instanceId);
    expect(updatedAnnoy).toBeDefined();
    expect(updatedAnnoy!.atk).toBe(3); // 1 + 2
    expect(updatedAnnoy!.hp).toBe(4); // 2 + 2
    expect(updatedAnnoy!.keywords.has("magnetic" as import("@/game/types").Keyword)).toBe(true);
  });

  it("does nothing when no friendly Mechs exist on board", () => {
    const baelgun = minion("baelgun"); // 4/5
    const cat = minion("alley_cat"); // 1/1 beast

    const state = makeTestState([baelgun, cat]);

    const afterBattlecry = baelgun.hooks!.onBattlecry!({
      self: baelgun,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    expect(finalBoard.length).toBe(2); // no new minions summoned
    const updatedCat = finalBoard.find((m) => m.instanceId === cat.instanceId);
    expect(updatedCat!.atk).toBe(1); // unchanged
    expect(updatedCat!.hp).toBe(1); // unchanged
  });

  it("stacks Magnetic on a Mech that already has Magnetic", () => {
    const baelgun = minion("baelgun"); // 4/5
    const annoy = minion("annoy_o_tron"); // 1/2 mech with divineShield

    const state = makeTestState([baelgun, annoy]);

    // First battlecry: give +2/+2 and Magnetic
    const afterFirst = baelgun.hooks!.onBattlecry!({
      self: baelgun,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    // Second baelgun: give another +2/+2 and Magnetic (stacks)
    const baelgun2 = minion("baelgun"); // 4/5
    const finalBoard = afterFirst.players[0]!.board;
    const updatedAnnoy = finalBoard.find((m) => m.instanceId === annoy.instanceId);
    expect(updatedAnnoy).toBeDefined();

    // Put baelgun2 on the board alongside the existing board
    const state2 = makeTestState([...afterFirst.players[0]!.board, baelgun2]);

    const afterSecond = baelgun2.hooks!.onBattlecry!({
      self: baelgun2,
      playerId: 0,
      state: state2,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard2 = afterSecond.players[0]!.board;
    const updatedAnnoy2 = finalBoard2.find((m) => m.instanceId === annoy.instanceId);
    expect(updatedAnnoy2).toBeDefined();
    expect(updatedAnnoy2!.atk).toBe(5); // 1 + 2 + 2
    expect(updatedAnnoy2!.hp).toBe(6); // 2 + 2 + 2
    expect(updatedAnnoy2!.keywords.has("magnetic" as import("@/game/types").Keyword)).toBe(true);
  });

  it("does not buff non-Mech minions", () => {
    const baelgun = minion("baelgun"); // 4/5
    const cat = minion("alley_cat"); // 1/1 beast

    const state = makeTestState([baelgun, cat]);

    const afterBattlecry = baelgun.hooks!.onBattlecry!({
      self: baelgun,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const finalBoard = afterBattlecry.players[0]!.board;
    const updatedCat = finalBoard.find((m) => m.instanceId === cat.instanceId);
    expect(updatedCat!.atk).toBe(1); // unchanged
    expect(updatedCat!.hp).toBe(1); // unchanged
  });
});
