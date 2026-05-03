import { describe, expect, it } from "vitest";
import { applyDamageToPlayer, calcDamage } from "@/game/damage";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeInitialState } from "@/game/state";
import type { MinionInstance } from "@/game/types";

function makeMinion(atk: number, hp: number, tier: number): MinionInstance {
  return instantiate({
    id: `custom_${atk}_${hp}_${tier}`,
    name: `${atk}/${hp} tier${tier}`,
    tier: tier as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// calcDamage — spec: damage = losingPlayerTier + sum(tiers of winning survivors)
// ---------------------------------------------------------------------------

describe("calcDamage", () => {
  it("base case: tier 1 loser, no survivors", () => {
    expect(calcDamage(1, [])).toBe(1);
  });

  it("tier 3 loser, one tier 2 survivor", () => {
    const survivor = makeMinion(3, 3, 2);
    // Custom minions not in registry default to tier 1
    expect(calcDamage(3, [survivor])).toBe(4); // 3 + 1 (default tier)
  });

  it("tier 6 loser, multiple survivors of different tiers", () => {
    const survivors = [makeMinion(1, 1, 1), makeMinion(2, 2, 3), makeMinion(3, 3, 5)];
    // Custom minions not in registry default to tier 1 each
    expect(calcDamage(6, survivors)).toBe(9); // 6 + 1 + 1 + 1
  });

  it("tier 6 loser, all tier 6 survivors (uncapped damage)", () => {
    const survivors = Array.from({ length: 7 }, () => makeMinion(5, 5, 6));
    // Custom minions not in registry default to tier 1 each
    expect(calcDamage(6, survivors)).toBe(13); // 6 + 7*1
  });
});

// ---------------------------------------------------------------------------
// applyDamageToPlayer — armor absorbs first, then HP
// ---------------------------------------------------------------------------

describe("applyDamageToPlayer", () => {
  it("armor absorbs all damage, HP unchanged", () => {
    const state = makeInitialState(0);
    state.players[0]!.hp = 10;
    state.players[0]!.armor = 5;
    const result = applyDamageToPlayer(state, 0, 3);
    expect(result.players[0]!.armor).toBe(2);
    expect(result.players[0]!.hp).toBe(10);
    expect(result.players[0]!.eliminated).toBe(false);
  });

  it("armor absorbs partially, remaining damage to HP", () => {
    const state = makeInitialState(0);
    state.players[0]!.hp = 10;
    state.players[0]!.armor = 3;
    const result = applyDamageToPlayer(state, 0, 7);
    expect(result.players[0]!.armor).toBe(0);
    expect(result.players[0]!.hp).toBe(6); // 10 - (7 - 3)
    expect(result.players[0]!.eliminated).toBe(false);
  });

  it("excess damage eliminates player", () => {
    const state = makeInitialState(0);
    state.players[0]!.hp = 5;
    state.players[0]!.armor = 0;
    const result = applyDamageToPlayer(state, 0, 10);
    expect(result.players[0]!.hp).toBe(-5);
    expect(result.players[0]!.eliminated).toBe(true);
  });

  it("excess damage with armor", () => {
    const state = makeInitialState(0);
    state.players[0]!.hp = 5;
    state.players[0]!.armor = 3;
    const result = applyDamageToPlayer(state, 0, 10);
    expect(result.players[0]!.armor).toBe(0);
    expect(result.players[0]!.hp).toBe(-2); // 5 - (10 - 3)
    expect(result.players[0]!.eliminated).toBe(true);
  });

  it("exactly kills at 0 HP", () => {
    const state = makeInitialState(0);
    state.players[0]!.hp = 5;
    state.players[0]!.armor = 0;
    const result = applyDamageToPlayer(state, 0, 5);
    expect(result.players[0]!.hp).toBe(0);
    expect(result.players[0]!.eliminated).toBe(true);
  });

  it("Annihilan Battlemaster tracks total damage taken", () => {
    const state = makeInitialState(0);
    const annihilan = instantiate(getMinion("annihilan_battlemaster"));
    state.players[0]!.board = [annihilan];
    state.players[0]!.hp = 20;

    // First hit: 10 damage
    const result1 = applyDamageToPlayer(state, 0, 10);
    const ab1 = result1.players[0]!.board[0];
    expect((ab1!.attachments as { totalDamageTaken?: number }).totalDamageTaken).toBe(10);

    // Second hit: 5 more damage (total 15)
    const result2 = applyDamageToPlayer(result1, 0, 5);
    const ab2 = result2.players[0]!.board[0];
    expect((ab2!.attachments as { totalDamageTaken?: number }).totalDamageTaken).toBe(15);
  });

  it("Annihilan Battlemaster with armor — tracks total damage including armor absorption", () => {
    const state = makeInitialState(0);
    const annihilan = instantiate(getMinion("annihilan_battlemaster"));
    state.players[0]!.board = [annihilan];
    state.players[0]!.hp = 20;
    state.players[0]!.armor = 8;

    // 12 damage: 8 absorbed by armor, 4 to HP
    const result = applyDamageToPlayer(state, 0, 12);
    expect(result.players[0]!.armor).toBe(0);
    expect(result.players[0]!.hp).toBe(16); // 20 - 4
    const ab = result.players[0]!.board[0];
    // Annihilan tracks TOTAL damage (including armor absorption), not just HP loss
    expect((ab!.attachments as { totalDamageTaken?: number }).totalDamageTaken).toBe(12);
  });
});
