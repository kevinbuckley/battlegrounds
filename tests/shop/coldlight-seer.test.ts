import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

// ---------------------------------------------------------------------------
// Coldlight Seer — battlecry gives all friendly Murlocs +2 HP
// ---------------------------------------------------------------------------

describe("coldlight-seer — onBattlecry", () => {
  it("gives all friendly Murlocs +2 HP when played to board", () => {
    const base = makeInitialState(42);
    const murloc1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const murloc2 = instantiate(MINIONS["murloc_tidehunter"]!); // 2/1 Murloc
    const nonMurloc = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const seer = instantiate(MINIONS["coldlight_seer"]!); // 2/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        murloc_scout: 10,
        murloc_tidehunter: 10,
        alley_cat: 10,
        coldlight_seer: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [murloc1, murloc2, nonMurloc],
              shop: [seer],
            }
          : p,
      ),
    };

    // Buy and play Coldlight Seer at index 2
    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 2, RNG);

    const board = afterPlay.players[0]!.board;

    // Coldlight Seer itself should remain 2/3 (battlecry does not buff self)
    const seerOnBoard = board.find((m) => m.cardId === "coldlight_seer");
    expect(seerOnBoard).toBeDefined();
    expect(seerOnBoard!.atk).toBe(2);
    expect(seerOnBoard!.hp).toBe(3);

    // Murloc Scout (index 0) should gain +2 HP → 1/3
    const murloc1OnBoard = board.find((m) => m.instanceId === murloc1.instanceId);
    expect(murloc1OnBoard).toBeDefined();
    expect(murloc1OnBoard!.atk).toBe(1);
    expect(murloc1OnBoard!.hp).toBe(3); // 1 + 2

    // Murloc Tidehunter (index 1) should gain +2 HP → 2/3
    const murloc2OnBoard = board.find((m) => m.instanceId === murloc2.instanceId);
    expect(murloc2OnBoard).toBeDefined();
    expect(murloc2OnBoard!.atk).toBe(2);
    expect(murloc2OnBoard!.hp).toBe(3); // 1 + 2

    // Alley Cat (non-Murloc) should NOT be buffed
    const nonMurlocOnBoard = board.find((m) => m.instanceId === nonMurloc.instanceId);
    expect(nonMurlocOnBoard).toBeDefined();
    expect(nonMurlocOnBoard!.atk).toBe(1);
    expect(nonMurlocOnBoard!.hp).toBe(1);
  });

  it("does NOT buff non-Murloc friendly minions", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const seer = instantiate(MINIONS["coldlight_seer"]!); // 2/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, coldlight_seer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [seer],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should remain 1/1 (not buffed)
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard!.atk).toBe(1);
    expect(beastOnBoard!.hp).toBe(1);
  });

  it("does nothing when there are no friendly Murlocs on board", () => {
    const base = makeInitialState(42);
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const seer = instantiate(MINIONS["coldlight_seer"]!); // 2/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { alley_cat: 10, coldlight_seer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [beast],
              shop: [seer],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const board = afterPlay.players[0]!.board;

    // Alley Cat should remain 1/1
    const beastOnBoard = board.find((m) => m.instanceId === beast.instanceId);
    expect(beastOnBoard!.atk).toBe(1);
    expect(beastOnBoard!.hp).toBe(1);

    // Coldlight Seer should remain 2/3
    const seerOnBoard = board.find((m) => m.cardId === "coldlight_seer");
    expect(seerOnBoard!.atk).toBe(2);
    expect(seerOnBoard!.hp).toBe(3);
  });

  it("stacks across multiple Coldlight Seers on board", () => {
    const base = makeInitialState(42);
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const seer1 = instantiate(MINIONS["coldlight_seer"]!); // 2/3 Murloc
    const seer2 = instantiate(MINIONS["coldlight_seer"]!); // 2/3 Murloc

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { murloc_scout: 10, coldlight_seer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 3 as Tier,
              board: [murloc],
              shop: [seer1, seer2],
            }
          : p,
      ),
    };

    // Play first Coldlight Seer
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Play second Coldlight Seer (shop index 0 after first was bought and removed)
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 2, RNG);

    const board = afterPlay2.players[0]!.board;

    // Murloc Scout should gain +4 HP total (2 from each seer) → 1/5
    const murlocOnBoard = board.find((m) => m.instanceId === murloc.instanceId);
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(5); // 1 + 2 + 2

    // Both Coldlight Seers: the first seer gets +2 HP from the second's battlecry
    // (battlecry buffs OTHER friendly Murlocs, not itself)
    const seers = board.filter((m) => m.cardId === "coldlight_seer");
    expect(seers.length).toBe(2);
    // First seer was buffed by the second seer's battlecry → 2/5
    const firstSeer = seers.find((s) => s.instanceId === seer1.instanceId);
    expect(firstSeer!.atk).toBe(2);
    expect(firstSeer!.hp).toBe(5); // 3 + 2 (from second seer's battlecry)
    // Second seer is itself → remains 2/3
    const secondSeer = seers.find((s) => s.instanceId === seer2.instanceId);
    expect(secondSeer!.atk).toBe(2);
    expect(secondSeer!.hp).toBe(3);
  });
});
