import { describe, expect, it } from "vitest";
import { applyDamageToPlayer, calcDamage } from "./damage";
import { defineMinion, instantiate } from "./minions/define";
import { getMinion, MINIONS } from "./minions/index";
import { makeInitialState } from "./state";
import type { GameState } from "./types";

function makeTestState(overrides?: Partial<GameState["players"][number]>): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: {},
    players: base.players.map((p, i) =>
      i === 0 ? { ...p, gold: 10, tier: 1, shop: [], hand: [], board: [], ...overrides } : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// calcDamage — damage formula
// ---------------------------------------------------------------------------

describe("calcDamage", () => {
  it("base formula: losingPlayerTier + sum of winning survivor tiers", () => {
    const survivor1 = instantiate(getMinion("murloc_tidehunter")); // tier 1
    const survivor2 = instantiate(getMinion("murloc_tidehunter")); // tier 1
    const result = calcDamage(3, [survivor1, survivor2]);
    // 3 (loser tier) + 1 + 1 (two tier-1 survivors) = 5
    expect(result).toBe(5);
  });

  it("higher tier survivors deal more damage", () => {
    const survivor = instantiate(getMinion("murloc_warleader")); // tier 2
    const result = calcDamage(3, [survivor]);
    // 3 (loser tier) + 2 (tier-2 survivor) = 5
    expect(result).toBe(5);
  });

  it("no survivors means no damage", () => {
    expect(calcDamage(3, [])).toBe(3); // just the loser's tier, no survivors
  });

  it("no damage cap — stacked board can one-shot", () => {
    const survivors = Array.from({ length: 7 }, () => instantiate(getMinion("murloc_warleader"))); // tier 2
    const result = calcDamage(1, survivors);
    // 1 (loser tier) + 7 * 2 (seven tier-2 survivors) = 15
    expect(result).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// applyDamageToPlayer — armor absorption and elimination
// ---------------------------------------------------------------------------

describe("applyDamageToPlayer", () => {
  it("armor absorbs damage before HP", () => {
    const state = makeTestState({ hp: 30, armor: 5 });
    const after = applyDamageToPlayer(state, 0, 3);
    // 3 damage absorbed entirely by 5 armor → armor becomes 2, HP unchanged
    expect(after.players[0]!.armor).toBe(2);
    expect(after.players[0]!.hp).toBe(30);
    expect(after.players[0]!.eliminated).toBe(false);
  });

  it("damage exceeding armor reduces HP", () => {
    const state = makeTestState({ hp: 30, armor: 3 });
    const after = applyDamageToPlayer(state, 0, 7);
    // 7 damage: 3 absorbed by armor, 4 hits HP → armor 0, HP 26
    expect(after.players[0]!.armor).toBe(0);
    expect(after.players[0]!.hp).toBe(26);
    expect(after.players[0]!.eliminated).toBe(false);
  });

  it("eliminates player when HP drops to 0", () => {
    const state = makeTestState({ hp: 5, armor: 0 });
    const after = applyDamageToPlayer(state, 0, 5);
    expect(after.players[0]!.hp).toBe(0);
    expect(after.players[0]!.eliminated).toBe(true);
  });

  it("eliminates player when HP drops below 0", () => {
    const state = makeTestState({ hp: 3, armor: 0 });
    const after = applyDamageToPlayer(state, 0, 7);
    expect(after.players[0]!.hp).toBe(-4);
    expect(after.players[0]!.eliminated).toBe(true);
  });

  it("armor absorbs then HP takes overflow, then elimination", () => {
    const state = makeTestState({ hp: 3, armor: 5 });
    const after = applyDamageToPlayer(state, 0, 8);
    // 8 damage: 5 absorbed by armor, 3 hits HP → armor 0, HP 0
    expect(after.players[0]!.armor).toBe(0);
    expect(after.players[0]!.hp).toBe(0);
    expect(after.players[0]!.eliminated).toBe(true);
  });

  it("tracks totalDamageTaken on Annihilan Battlemaster including armor", () => {
    const annihilan = instantiate(getMinion("annihilan_battlemaster"));
    const state = makeTestState({
      hp: 25,
      armor: 5,
      board: [annihilan],
    });
    const after = applyDamageToPlayer(state, 0, 8);
    // 8 damage total (5 armor + 3 HP) should be tracked by Annihilan
    const boardMinion = after.players[0]!.board[0]!;
    expect((boardMinion.attachments as { totalDamageTaken?: number }).totalDamageTaken).toBe(8);
  });

  it("does not track damage on non-Annihilan minions", () => {
    const murloc = instantiate(getMinion("murloc_tidehunter"));
    const state = makeTestState({
      hp: 25,
      armor: 0,
      board: [murloc],
    });
    const after = applyDamageToPlayer(state, 0, 5);
    const boardMinion = after.players[0]!.board[0]!;
    expect(
      (boardMinion.attachments as { totalDamageTaken?: number }).totalDamageTaken,
    ).toBeUndefined();
  });
});
