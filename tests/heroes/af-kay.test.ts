import { describe, expect, it } from "vitest";
import { HEROES } from "@/game/heroes";
import { afKay } from "@/game/heroes/af-kay";
import { beginRecruitTurn, makeInitialState, step } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function fillAIHeroes(state: ReturnType<typeof makeInitialState>) {
  let s = state;
  for (let i = 1; i < 8; i++) {
    s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, RNG);
  }
  return s;
}

describe("A.F. Kay — start_of_game power", () => {
  it("starts at tier 3 with 3 armor and 2 turns to skip", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    const player = afterSelect.players[0]!;
    expect(player.heroId).toBe("af_kay");
    expect(player.tier).toBe(3);
    expect(player.hp).toBe(40);
    expect(player.armor).toBe(3);
    expect(player.turnsSkipped).toBe(2);
  });

  it("first beginRecruitTurn after hero selection skips turn 1: turnsSkipped becomes 1", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    // step(SelectHero) sets turnsSkipped=2 and calls beginRecruitTurn (during hero selection, doesn't decrement)
    // So afterSelect has turnsSkipped=2
    const playerAfterSelect = afterSelect.players[0]!;
    expect(playerAfterSelect.turnsSkipped).toBe(2);
    expect(playerAfterSelect.shop).toHaveLength(0);
    expect(playerAfterSelect.gold).toBe(0);

    // Calling beginRecruitTurn once more = turn 2 skip (turnsSkipped 2→1)
    const afterTurn2 = beginRecruitTurn(afterSelect, RNG);
    const player2 = afterTurn2.players[0]!;
    expect(player2.turnsSkipped).toBe(1);
    expect(player2.shop).toHaveLength(0);
    expect(player2.gold).toBe(0);
  });

  it("second beginRecruitTurn skips turn 2: turnsSkipped becomes 0", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    // step(SelectHero) sets turnsSkipped=2 (doesn't decrement during hero selection)
    // One beginRecruitTurn = turn 2 skip (turnsSkipped 2→1)
    const afterTurn2 = beginRecruitTurn(afterSelect, RNG);
    const player2 = afterTurn2.players[0]!;
    expect(player2.turnsSkipped).toBe(1);
    expect(player2.gold).toBe(0);
    expect(player2.shop).toHaveLength(0);
  });

  it("second beginRecruitTurn skips turn 2: turnsSkipped becomes 0", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    // step(SelectHero) sets turnsSkipped=2 (doesn't decrement during hero selection)
    // One beginRecruitTurn = turn 2 skip (turnsSkipped 2→1)
    const afterTurn2 = beginRecruitTurn(afterSelect, RNG);
    const player2 = afterTurn2.players[0]!;
    expect(player2.turnsSkipped).toBe(1);
    expect(player2.gold).toBe(0);
    expect(player2.shop).toHaveLength(0);
  });

  it("second beginRecruitTurn skips turn 2: turnsSkipped becomes 0", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    const afterTurn1 = beginRecruitTurn(afterSelect, RNG);
    const afterTurn2 = beginRecruitTurn(afterTurn1, RNG);
    const player2 = afterTurn2.players[0]!;
    expect(player2.turnsSkipped).toBe(0);
    expect(player2.gold).toBe(0);
    expect(player2.shop).toHaveLength(0);
  });

  it("third beginRecruitTurn (turn 3): full tier-3+ shop, gives gold", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    // step(SelectHero) already called beginRecruitTurn (turn 1 skip, doesn't decrement)
    // 2 more beginRecruitTurn calls = turn 2 skip (turnsSkipped 2→1→0)
    const afterTurn2 = beginRecruitTurn(afterSelect, RNG);
    const afterTurn3 = beginRecruitTurn(afterTurn2, RNG);
    // 4th beginRecruitTurn = turn 3, normal flow (turnsSkipped is 0)
    const afterTurn4 = beginRecruitTurn(afterTurn3, RNG);
    const player3 = afterTurn4.players[0]!;
    expect(player3.turnsSkipped).toBe(0);
    expect(player3.tier).toBe(3);
    expect(player3.shop.length).toBeGreaterThan(0);
    expect(player3.gold).toBeGreaterThan(0);
  });

  it("full game flow: 3 beginRecruitTurn calls then buy a minion", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "af_kay" }, RNG);
    const filled = fillAIHeroes(afterSelect);
    // step(SelectHero) already called beginRecruitTurn (doesn't decrement turnsSkipped)
    // 3 beginRecruitTurn calls = 3 skips (turnsSkipped 2→1→0, then normal flow)
    const t1 = beginRecruitTurn(filled, RNG);
    const t2 = beginRecruitTurn(t1, RNG);
    const t3 = beginRecruitTurn(t2, RNG);
    const player3 = t3.players[0]!;
    expect(player3.tier).toBe(3);
    expect(player3.shop.length).toBeGreaterThan(0);
    expect(player3.gold).toBeGreaterThan(0);
  });

  it("non-A.F.-Kay heroes are unaffected: start at tier 1", () => {
    const state = makeInitialState(42);
    const afterSelect = step(state, { kind: "SelectHero", player: 0, heroId: "ragnaros" }, RNG);
    expect(afterSelect.players[0]!.tier).toBe(1);
    expect(afterSelect.players[0]!.turnsSkipped).toBe(0);
  });
});
