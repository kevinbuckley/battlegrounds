/**
 * Simulation tests for Lil' Exorcist battlecry (T3 Taunt).
 *
 * Lil' Exorcist: battlecry gives itself +1/+1 for each Deathrattle
 * minion on both boards (excluding itself).
 */
import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  return instantiate(getMinion(id));
}

function plain(atk: number, hp: number) {
  return instantiate({
    id: `plain_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {} as never,
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

// ------------------------------------
// Lil' Exorcist
// ------------------------------------

describe("lil-exorcist", () => {
  it("gives itself +1/+1 for each Deathrattle minion on both boards", () => {
    const exorcist = m("lil_exorcist"); // 2/2 taunt
    const infestedWolf = m("infested_wolf"); // 3/3 deathrattle (friendly)
    const kaboomBot = m("kaboom_bot"); // 3/2 deathrattle (enemy)

    // Board: [Lil' Exorcist, Infested Wolf] vs [Kaboom Bot, 3/3 vanilla]
    // Lil' Exorcist counts 2 deathrattle minions (Infested Wolf + Kaboom Bot)
    // → gains +2/+2 → 4/4
    const state = makeTestState([exorcist, infestedWolf, kaboomBot, plain(3, 3)]);

    const afterBattlecry = exorcist.hooks!.onBattlecry!({
      self: exorcist,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const updatedExorcist = afterBattlecry.players[0]!.board.find(
      (m) => m.instanceId === exorcist.instanceId,
    );
    expect(updatedExorcist).toBeDefined();
    expect(updatedExorcist!.atk).toBe(4); // 2 + 2
    expect(updatedExorcist!.hp).toBe(4); // 2 + 2
  });

  it("does NOT buff itself when there are 0 Deathrattle minions", () => {
    const exorcist = m("lil_exorcist");
    const vanilla = plain(3, 3);

    // Board: [Lil' Exorcist, 3/3 vanilla]
    // No deathrattle minions → no buff → stays 2/2
    const state = makeTestState([exorcist, vanilla]);

    const afterBattlecry = exorcist.hooks!.onBattlecry!({
      self: exorcist,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const updatedExorcist = afterBattlecry.players[0]!.board.find(
      (m) => m.instanceId === exorcist.instanceId,
    );
    expect(updatedExorcist).toBeDefined();
    expect(updatedExorcist!.atk).toBe(2); // unchanged
    expect(updatedExorcist!.hp).toBe(2); // unchanged
  });

  it("counts Deathrattle minions on enemy board too", () => {
    const exorcist = m("lil_exorcist");
    const kaboomBot = m("kaboom_bot"); // 3/2 deathrattle (enemy only)

    // Board: [Lil' Exorcist, Kaboom Bot, 3/3 vanilla]
    // Lil' Exorcist counts 1 deathrattle (Kaboom Bot) → +1/+1 → 3/3
    const state = makeTestState([exorcist, kaboomBot, plain(3, 3)]);

    const afterBattlecry = exorcist.hooks!.onBattlecry!({
      self: exorcist,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const updatedExorcist = afterBattlecry.players[0]!.board.find(
      (m) => m.instanceId === exorcist.instanceId,
    );
    expect(updatedExorcist).toBeDefined();
    expect(updatedExorcist!.atk).toBe(3); // 2 + 1
    expect(updatedExorcist!.hp).toBe(3); // 2 + 1
  });

  it("gives itself +3/+3 when there are 3 Deathrattle minions", () => {
    const exorcist = m("lil_exorcist");
    const infestedWolf = m("infested_wolf"); // deathrattle (friendly)
    const kaboomBot = m("kaboom_bot"); // deathrattle (enemy)
    const unstableGhoul = m("unstable_ghoul"); // deathrattle (enemy)

    // Board: [Lil' Exorcist, Infested Wolf, Kaboom Bot, Unstable Ghoul]
    // Lil' Exorcist counts 3 deathrattles → +3/+3 → 5/5
    const state = makeTestState([exorcist, infestedWolf, kaboomBot, unstableGhoul]);

    const afterBattlecry = exorcist.hooks!.onBattlecry!({
      self: exorcist,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const updatedExorcist = afterBattlecry.players[0]!.board.find(
      (m) => m.instanceId === exorcist.instanceId,
    );
    expect(updatedExorcist).toBeDefined();
    expect(updatedExorcist!.atk).toBe(5); // 2 + 3
    expect(updatedExorcist!.hp).toBe(5); // 2 + 3
  });
});
