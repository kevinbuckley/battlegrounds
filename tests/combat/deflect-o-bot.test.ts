import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(id: string, tribes: string[], atk: number, hp: number): MinionInstance {
  return instantiate({
    id,
    name: id,
    tier: 2 as const,
    tribes: tribes as ["Mech" | "Beast"],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

function getDeflecto(state: GameState): MinionInstance | undefined {
  return state.players[0]!.board.find((m) => m.cardId === "deflect_o_bot");
}

// ---------------------------------------------------------------------------
// Deflect-o-Bot — divine shield restoration on Mech play
// ---------------------------------------------------------------------------

describe("Deflect-o-Bot divine shield restoration", () => {
  it("restores divine shield when a Mech is bought from shop", () => {
    const state = makeInitialState(42);
    const player = state.players[0]!;
    const deflecto = minion("deflect_o_bot");
    // Remove divine shield to simulate it being popped
    deflecto.keywords.delete("divineShield");

    player.board = [deflecto];
    player.hand = [];

    // Buy a mech from shop — this triggers onPlay on Deflect-o-Bot
    const mech = makeMinion("test_mech", ["Mech"], 2, 2);

    // Simulate buying: add to hand, then play to board (triggers onPlay)
    player.hand = [mech];

    // Call onPlay manually to test the hook
    const updatedState = deflecto.hooks.onPlay!({
      self: deflecto,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    // Deflect-o-Bot should regain divine shield in the returned state
    const updatedDeflecto = getDeflecto(updatedState);
    expect(updatedDeflecto).toBeDefined();
    expect(updatedDeflecto!.keywords.has("divineShield")).toBe(true);
  });

  it("does NOT restore shield when a non-Mech is played", () => {
    const state = makeInitialState(42);
    const player = state.players[0]!;
    const deflecto = minion("deflect_o_bot");
    deflecto.keywords.delete("divineShield");

    player.board = [deflecto];

    const beast = makeMinion("test_beast", ["Beast"], 2, 2);
    player.hand = [beast];

    deflecto.hooks.onPlay!({
      self: deflecto,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    // Should NOT regain divine shield
    const updatedDeflecto = getDeflecto(state);
    expect(updatedDeflecto).toBeDefined();
    expect(updatedDeflecto!.keywords.has("divineShield")).toBe(false);
  });

  it("restores shield when a Mech is played from hand to board", () => {
    const state = makeInitialState(42);
    const player = state.players[0]!;
    const deflecto = minion("deflect_o_bot");
    deflecto.keywords.delete("divineShield");

    const mech = makeMinion("test_mech", ["Mech"], 3, 3);

    player.board = [deflecto];
    player.hand = [mech];

    const updatedState = deflecto.hooks.onPlay!({
      self: deflecto,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const updatedDeflecto = getDeflecto(updatedState);
    expect(updatedDeflecto).toBeDefined();
    expect(updatedDeflecto!.keywords.has("divineShield")).toBe(true);
  });

  it("golden Deflect-o-Bot also restores shield", () => {
    const state = makeInitialState(42);
    const player = state.players[0]!;
    const deflecto = minion("deflect_o_bot");
    deflecto.golden = true;
    deflecto.keywords.delete("divineShield");

    player.board = [deflecto];

    const mech = makeMinion("test_mech", ["Mech"], 2, 2);
    player.hand = [mech];

    const updatedState = deflecto.hooks.onPlay!({
      self: deflecto,
      playerId: 0,
      state,
      rng: makeRng(0),
      spellDamage: 0,
    });

    const updatedDeflecto = getDeflecto(updatedState);
    expect(updatedDeflecto).toBeDefined();
    expect(updatedDeflecto!.keywords.has("divineShield")).toBe(true);
  });
});
