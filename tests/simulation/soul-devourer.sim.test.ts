import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { playMinionToBoard } from "@/game/shop";
import { beginRecruitTurn, makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  return instantiate(getMinion(id));
}

function makeState(): GameState {
  const base = makeInitialState(42);
  return beginRecruitTurn(base, makeRng(0));
}

// ---------------------------------------------------------------------------
// Soul Devourer — battlecry consumes a friendly Demon's stats when played
// ---------------------------------------------------------------------------

describe("soul_devourer", () => {
  it("battlecry consumes a friendly Demon's stats when played to board", () => {
    const state = makeState();
    const devourer = m("soul_devourer"); // 3/3 Demon
    const imp = m("imp_gang_boss"); // 2/4 Demon

    // Put Soul Devourer in hand, Imp already on board
    const s = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [devourer], board: [imp], gold: 6 } : p,
      ),
    };

    // Play Soul Devourer (index 0 in hand)
    const afterPlay = playMinionToBoard(s, 0, 0, 0, makeRng(0));
    const player = afterPlay.players[0]!;

    // Soul Devourer should be on board with consumed stats: 3+2=5 ATK, 3+4=7 HP
    const devourerOnBoard = player.board.find((m) => m.instanceId === devourer.instanceId);
    expect(devourerOnBoard).toBeDefined();
    expect(devourerOnBoard!.atk).toBe(5);
    expect(devourerOnBoard!.maxHp).toBe(7);
  });

  it("battlecry consumes the first friendly Demon found on board", () => {
    const state = makeState();
    const devourer = m("soul_devourer"); // 3/3
    const imp1 = m("imp_gang_boss"); // 2/4
    const imp2 = m("imp_gang_boss"); // 2/4

    const s = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [devourer], board: [imp1, imp2], gold: 6 } : p,
      ),
    };

    const afterPlay = playMinionToBoard(s, 0, 0, 0, makeRng(0));
    const player = afterPlay.players[0]!;

    const devourerOnBoard = player.board.find((m) => m.instanceId === devourer.instanceId);
    expect(devourerOnBoard).toBeDefined();
    // Consumed first Imp: 3+2=5 ATK, 3+4=7 HP
    expect(devourerOnBoard!.atk).toBe(5);
    expect(devourerOnBoard!.maxHp).toBe(7);
  });

  it("does nothing when no friendly Demons on board", () => {
    const state = makeState();
    const devourer = m("soul_devourer"); // 3/3

    const s = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, hand: [devourer], gold: 6 } : p)),
    };

    const afterPlay = playMinionToBoard(s, 0, 0, 0, makeRng(0));
    const player = afterPlay.players[0]!;

    const devourerOnBoard = player.board.find((m) => m.instanceId === devourer.instanceId);
    expect(devourerOnBoard).toBeDefined();
    expect(devourerOnBoard!.atk).toBe(3);
    expect(devourerOnBoard!.maxHp).toBe(3);
  });

  it("does not consume non-Demon minions", () => {
    const state = makeState();
    const devourer = m("soul_devourer"); // 3/3
    const alleyCat = m("alley_cat"); // 1/1 Beast

    const s = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [devourer], board: [alleyCat], gold: 6 } : p,
      ),
    };

    const afterPlay = playMinionToBoard(s, 0, 0, 0, makeRng(0));
    const player = afterPlay.players[0]!;

    const devourerOnBoard = player.board.find((m) => m.instanceId === devourer.instanceId);
    expect(devourerOnBoard).toBeDefined();
    expect(devourerOnBoard!.atk).toBe(3);
    expect(devourerOnBoard!.maxHp).toBe(3);
  });

  it("golden Soul Devourer consumes stats (golden base 6/6, consumes 2/4 → 8/10)", () => {
    const state = makeState();
    const base = getMinion("soul_devourer");
    const golden = instantiate(base);
    const goldenDevourer = {
      ...golden,
      golden: true,
      atk: golden.atk * 2,
      hp: golden.hp * 2,
      maxHp: golden.hp * 2,
    };
    const imp = m("imp_gang_boss"); // 2/4

    const s = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [goldenDevourer], board: [imp], gold: 6 } : p,
      ),
    };

    const afterPlay = playMinionToBoard(s, 0, 0, 0, makeRng(0));
    const player = afterPlay.players[0]!;

    const devourerOnBoard = player.board.find((m) => m.instanceId === goldenDevourer.instanceId);
    expect(devourerOnBoard).toBeDefined();
    // Golden base 6/6, consumes 2/4 → 8/10
    expect(devourerOnBoard!.atk).toBe(8);
    expect(devourerOnBoard!.maxHp).toBe(10);
  });

  it("battlecry consumes the target and removes it from board", () => {
    const state = makeState();
    const devourer = m("soul_devourer"); // 3/3
    const imp = m("imp_gang_boss"); // 2/4

    const s = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [devourer], board: [imp], gold: 6 } : p,
      ),
    };

    const afterPlay = playMinionToBoard(s, 0, 0, 0, makeRng(0));
    const player = afterPlay.players[0]!;

    // Imp should be removed from board (consumed)
    const impOnBoard = player.board.find((m) => m.instanceId === imp.instanceId);
    expect(impOnBoard).toBeUndefined();
    // Only Soul Devourer should be on board
    expect(player.board).toHaveLength(1);
  });
});
