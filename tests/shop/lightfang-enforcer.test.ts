import { describe, expect, it } from "vitest";
import { defineMinion, instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { Tier } from "@/game/types";

// ---------------------------------------------------------------------------
// Lightfang Enforcer — onTurnEnd: give one friendly minion of each distinct
// tribe on your board +2/+1
// ---------------------------------------------------------------------------

describe("lightfang-enforcer — onTurnEnd", () => {
  function plain(atk: number, hp: number, tribes: Tribe[] = []) {
    return instantiate(
      defineMinion({
        id: `plain_${atk}_${hp}_${tribes.join("-")}`,
        name: `${atk}/${hp}`,
        tier: 1 as Tier,
        tribes,
        baseAtk: atk,
        baseHp: hp,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {} as never,
      }),
    );
  }

  type Tribe =
    | "Beast"
    | "Murloc"
    | "Demon"
    | "Mech"
    | "Elemental"
    | "Pirate"
    | "Dragon"
    | "Naga"
    | "Quilboar"
    | "Undead"
    | "All";

  it("gives one friendly minion of each distinct tribe +2/+1 on turn end", () => {
    const base = makeInitialState(42);
    const lightfang = instantiate(MINIONS["lightfang_enforcer"]!); // 4/5 Beast
    const beast = plain(1, 1, ["Beast"]);
    const mech = plain(2, 2, ["Mech"]);
    const murloc = plain(1, 1, ["Murloc"]);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { lightfang_enforcer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [lightfang, beast, mech, murloc],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    const board = player.board;
    const lightfangAfter = board.find((m) => m.instanceId === lightfang.instanceId)!;
    const beastAfter = board.find((m) => m.instanceId === beast.instanceId)!;
    const mechAfter = board.find((m) => m.instanceId === mech.instanceId)!;
    const murlocAfter = board.find((m) => m.instanceId === murloc.instanceId)!;

    // Lightfang itself is NOT buffed (excluded)
    expect(lightfangAfter.atk).toBe(4);
    expect(lightfangAfter.hp).toBe(5);

    // Beast tribe: beast gets +2/+1 → 3/2
    expect(beastAfter.atk).toBe(3);
    expect(beastAfter.hp).toBe(2);

    // Mech tribe: mech gets +2/+1 → 4/3
    expect(mechAfter.atk).toBe(4);
    expect(mechAfter.hp).toBe(3);

    // Murloc tribe: murloc gets +2/+1 → 3/2
    expect(murlocAfter.atk).toBe(3);
    expect(murlocAfter.hp).toBe(2);
  });

  it("does NOT buff tribeless minions", () => {
    const base = makeInitialState(42);
    const lightfang = instantiate(MINIONS["lightfang_enforcer"]!);
    const vanilla = plain(3, 3); // no tribes

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { lightfang_enforcer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [lightfang, vanilla],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    const board = player.board;
    const vanillaAfter = board.find((m) => m.instanceId === vanilla.instanceId)!;

    // No tribe on board → no buffs
    expect(vanillaAfter.atk).toBe(3);
    expect(vanillaAfter.hp).toBe(3);
  });

  it("handles board with 2 Beasts and 1 Mech — exactly 1 Beast and 1 Mech buffed", () => {
    const base = makeInitialState(42);
    const lightfang = instantiate(MINIONS["lightfang_enforcer"]!);
    const beast1 = plain(1, 1, ["Beast"]);
    const beast2 = plain(2, 2, ["Beast"]);
    const mech = plain(3, 3, ["Mech"]);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { lightfang_enforcer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [lightfang, beast1, beast2, mech],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    const board = player.board;
    const beast1After = board.find((m) => m.instanceId === beast1.instanceId)!;
    const beast2After = board.find((m) => m.instanceId === beast2.instanceId)!;
    const mechAfter = board.find((m) => m.instanceId === mech.instanceId)!;

    // Beast tribe: first Beast (beast1) gets buffed → 3/2
    expect(beast1After.atk).toBe(3);
    expect(beast1After.hp).toBe(2);
    // Second Beast stays unchanged
    expect(beast2After.atk).toBe(2);
    expect(beast2After.hp).toBe(2);

    // Mech gets +2/+1 → 5/4
    expect(mechAfter.atk).toBe(5);
    expect(mechAfter.hp).toBe(4);
  });

  it("a multi-tribe minion satisfies multiple tribes simultaneously", () => {
    const base = makeInitialState(42);
    const lightfang = instantiate(MINIONS["lightfang_enforcer"]!);
    const multi = plain(1, 1, ["Beast", "Murloc"]);
    const mech = plain(2, 2, ["Mech"]);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { lightfang_enforcer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [lightfang, multi, mech],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    const board = player.board;
    const multiAfter = board.find((m) => m.instanceId === multi.instanceId)!;
    const mechAfter = board.find((m) => m.instanceId === mech.instanceId)!;

    // Multi-tribe: satisfies Beast (first) and Murloc (second) → +4/+2 → 5/3
    expect(multiAfter.atk).toBe(5);
    expect(multiAfter.hp).toBe(3);

    // Mech gets +2/+1 → 4/3
    expect(mechAfter.atk).toBe(4);
    expect(mechAfter.hp).toBe(3);
  });

  it("does nothing when board has only Lightfang (no other minions)", () => {
    const base = makeInitialState(42);
    const lightfang = instantiate(MINIONS["lightfang_enforcer"]!);

    const state = {
      ...base,
      phase: { kind: "Recruit" as const, turn: 1 },
      turn: 1,
      pool: { lightfang_enforcer: 10 },
      players: base.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              gold: 10,
              hp: 25,
              tier: 1 as Tier,
              board: [lightfang],
              heroId: "stub_hero",
            }
          : { ...p, heroId: "stub_hero" },
      ),
    };

    const result = step(state, { kind: "EndTurn", player: 0 }, rngForTurn(state, "endTurn"));
    const player = result.players[0]!;

    const board = player.board;
    const lightfangAfter = board.find((m) => m.instanceId === lightfang.instanceId)!;

    expect(lightfangAfter.atk).toBe(4);
    expect(lightfangAfter.hp).toBe(5);
  });
});
