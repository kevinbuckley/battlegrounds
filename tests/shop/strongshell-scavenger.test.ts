import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { Tier } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  const strongshell = instantiate(MINIONS["strongshell_scavenger"]!); // 2/3
  const tauntMinion = instantiate(MINIONS["taunt_minion"]!); // 1/1
  const righteousProtector = instantiate(MINIONS["righteous_protector"]!); // 1/1 divineShield+taunt
  const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1 non-taunt
  return {
    ...base,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    pool: {
      strongshell_scavenger: 10,
      taunt_minion: 10,
      righteous_protector: 10,
      murloc_scout: 10,
    },
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1 as Tier,
            board: [tauntMinion, murlocScout],
            shop: [strongshell, murlocScout],
            ...overrides,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Strongshell Scavenger — battlecry gives all friendly minions with taunt +2/+2
// ---------------------------------------------------------------------------

describe("strongshell_scavenger — onBattlecry", () => {
  it("gives all friendly minions with taunt +2/+2", () => {
    const state = makeTestState();
    const strongshellCard = state.players[0]!.shop[0]!;
    const tauntMinionOnBoard0 = state.players[0]!.board[0]!;
    const murlocScoutOnBoard1 = state.players[0]!.board[1]!;

    // Buy Strongshell Scavenger from shop
    const afterBuy = buyMinion(state, 0, 0);
    expect(afterBuy.players[0]!.hand.length).toBe(1);

    // Play Strongshell Scavenger to board at index 2
    const afterPlay = playMinionToBoard(
      afterBuy,
      0,
      0, // hand index 0 = Strongshell Scavenger
      2, // board index 2
      RNG,
    );

    // The Taunt minion should be buffed to 3/3
    const tauntOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === tauntMinionOnBoard0.instanceId,
    );
    expect(tauntOnBoard).toBeDefined();
    expect(tauntOnBoard!.atk).toBe(3); // 1 + 2
    expect(tauntOnBoard!.hp).toBe(3); // 1 + 2

    // The Murloc Scout (no taunt) should NOT be buffed
    const murlocOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === murlocScoutOnBoard1.instanceId,
    );
    expect(murlocOnBoard).toBeDefined();
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(1);

    // Strongshell itself should be 2/3 (base stats, no self-buff)
    const ssOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === strongshellCard.instanceId,
    );
    expect(ssOnBoard).toBeDefined();
    expect(ssOnBoard!.atk).toBe(2);
    expect(ssOnBoard!.hp).toBe(3);
  });

  it("does NOT buff non-taunt minions", () => {
    const base = makeInitialState(42);
    const strongshell = instantiate(MINIONS["strongshell_scavenger"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { strongshell_scavenger: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [murlocScout],
              shop: [strongshell, murlocScout],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const murlocOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === murlocScout.instanceId,
    );
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(1);
  });

  it("does nothing when there are no friendly minions with taunt on board", () => {
    const base = makeInitialState(42);
    const strongshell = instantiate(MINIONS["strongshell_scavenger"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { strongshell_scavenger: 10, murloc_scout: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [murlocScout],
              shop: [strongshell, murlocScout],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    const murlocOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === murlocScout.instanceId,
    );
    expect(murlocOnBoard!.atk).toBe(1);
    expect(murlocOnBoard!.hp).toBe(1);
  });

  it("stacks when multiple Strongshell Scavengers are played", () => {
    const base = makeInitialState(42);
    const tauntMinion = instantiate(MINIONS["taunt_minion"]!); // 1/1
    const strongshell1 = instantiate(MINIONS["strongshell_scavenger"]!);
    const strongshell2 = instantiate(MINIONS["strongshell_scavenger"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        strongshell_scavenger: 10,
        taunt_minion: 10,
        murloc_scout: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [tauntMinion],
              shop: [strongshell1, strongshell2, murlocScout],
            }
          : p,
      ),
    };

    // Buy and play first Strongshell Scavenger
    const afterBuy1 = buyMinion(state, 0, 0);
    const afterPlay1 = playMinionToBoard(afterBuy1, 0, 0, 1, RNG);

    // Buy and play second Strongshell Scavenger
    const afterBuy2 = buyMinion(afterPlay1, 0, 0);
    const afterPlay2 = playMinionToBoard(afterBuy2, 0, 0, 2, RNG);

    // Taunt minion should be buffed +4/+4 total (2 Strongshells × +2/+2) → 5/5
    const tauntOnBoard = afterPlay2.players[0]!.board.find(
      (m) => m.instanceId === tauntMinion.instanceId,
    );
    expect(tauntOnBoard!.atk).toBe(5); // 1 + 2 + 2
    expect(tauntOnBoard!.hp).toBe(5); // 1 + 2 + 2
  });

  it("buffs minions that gain taunt via other effects (Righteous Protector)", () => {
    const base = makeInitialState(42);
    const strongshell = instantiate(MINIONS["strongshell_scavenger"]!);
    const righteousProtector = instantiate(MINIONS["righteous_protector"]!); // 1/1 divineShield+taunt
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: {
        strongshell_scavenger: 10,
        righteous_protector: 10,
        murloc_scout: 10,
      },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              tier: 1 as Tier,
              board: [righteousProtector],
              shop: [strongshell, murlocScout],
            }
          : p,
      ),
    };

    const afterBuy = buyMinion(state, 0, 0);
    const afterPlay = playMinionToBoard(afterBuy, 0, 0, 1, RNG);

    // Righteous Protector has taunt + divineShield, should be buffed to 3/3
    const rpOnBoard = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === righteousProtector.instanceId,
    );
    expect(rpOnBoard).toBeDefined();
    expect(rpOnBoard!.atk).toBe(3); // 1 + 2
    expect(rpOnBoard!.hp).toBe(3); // 1 + 2
    expect(rpOnBoard!.keywords).toContain("divineShield");
    expect(rpOnBoard!.keywords).toContain("taunt");
  });
});
