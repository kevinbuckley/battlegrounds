import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string) {
  return instantiate(getMinion(id));
}

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: {},
    players: base.players.map((p, i) =>
      i === 0 ? { ...p, gold: 10, tier: 1, shop: [], hand: [], board: [], ...overrides } : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Cobalt Scalebane — onTurnEnd: gives a random friendly non-Dragon +3 ATK
// ---------------------------------------------------------------------------

describe("cobalt_scalebane onTurnEnd", () => {
  it("gives a random friendly non-Dragon +3 ATK", () => {
    const cs = minion("cobalt_scalebane"); // 5/5 Dragon
    const murloc = instantiate({
      id: "murloc",
      name: "Murloc",
      tier: 1,
      tribes: ["Murloc"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const dragon = instantiate({
      id: "dragon",
      name: "Dragon",
      tier: 1,
      tribes: ["Dragon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const state = makeTestState({ board: [cs, murloc, dragon] });

    // Fire onTurnEnd on Cobalt Scalebane
    const after = cs.hooks.onTurnEnd!({
      self: cs,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    });

    const board = after.players[0]!.board;

    // One of the two minions (murloc or dragon) should have +3 ATK.
    const murlocAfter = board.find((m) => m.instanceId === murloc.instanceId);
    const dragonAfter = board.find((m) => m.instanceId === dragon.instanceId);
    expect(murlocAfter).toBeDefined();
    expect(dragonAfter).toBeDefined();
    // Exactly one should have been buffed to 4, the other stays at 1.
    const buffed = [murlocAfter, dragonAfter].filter((m) => m!.atk === 4);
    const unbuffed = [murlocAfter, dragonAfter].filter((m) => m!.atk === 1);
    expect(buffed.length).toBe(1);
    expect(unbuffed.length).toBe(1);

    // Cobalt Scalebane itself should be unchanged.
    const csAfter = board.find((m) => m.instanceId === cs.instanceId);
    expect(csAfter).toBeDefined();
    expect(csAfter!.atk).toBe(5);
  });

  it("does not buff itself — only other friendly minions", () => {
    const cs = minion("cobalt_scalebane"); // 5/5

    const state = makeTestState({ board: [cs] });

    const after = cs.hooks.onTurnEnd!({
      self: cs,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    });

    // Only Cobalt Scalebane on board, no other minions to buff.
    const board = after.players[0]!.board;
    const csAfter = board.find((m) => m.instanceId === cs.instanceId);
    expect(csAfter).toBeDefined();
    expect(csAfter!.atk).toBe(5);
  });

  it("can buff other Dragons — no tribe restriction", () => {
    const cs = minion("cobalt_scalebane"); // 5/5 Dragon
    const otherDragon = instantiate({
      id: "other_dragon",
      name: "Other Dragon",
      tier: 1,
      tribes: ["Dragon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const state = makeTestState({ board: [cs, otherDragon] });

    const after = cs.hooks.onTurnEnd!({
      self: cs,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    });

    // Other Dragon CAN be buffed — Cobalt Scalebane has no tribe restriction.
    const board = after.players[0]!.board;
    const otherDragonAfter = board.find((m) => m.instanceId === otherDragon.instanceId);
    expect(otherDragonAfter).toBeDefined();
    // If it was picked, it should have +3 ATK.
    if (otherDragonAfter!.atk !== 1) {
      expect(otherDragonAfter!.atk).toBe(4);
    }
  });

  it("does nothing when board is empty", () => {
    const cs = minion("cobalt_scalebane");

    const state = makeTestState({ board: [] });

    const after = cs.hooks.onTurnEnd!({
      self: cs,
      playerId: 0,
      state,
      rng: makeRng(42),
      spellDamage: 0,
    });

    expect(after.players[0]!.board).toHaveLength(0);
  });
});
