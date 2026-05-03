import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { mysteryShot, poisonDartShield } from "@/game/spells";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { GameState, MinionInstance, SpellInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

// Register a test minion with spellDamage for testing
const testMinionWithSpellDamage = {
  id: "spell_damage_test_minion",
  name: "Spell Damage Test Minion",
  tier: 3 as const,
  tribes: ["Mech"] as const,
  baseAtk: 3,
  baseHp: 2,
  baseKeywords: [] as const,
  spellDamage: 1,
  hooks: {},
};
MINIONS[testMinionWithSpellDamage.id] = testMinionWithSpellDamage as never;

function seeded(seed: number) {
  return makeInitialState(seed);
}

function p(state: GameState): GameState["players"][number] {
  return state.players[0]!;
}

function makeEnemyBoard(): MinionInstance[] {
  const enemy = instantiate(MINIONS["rush_minion"]!);
  return [{ ...enemy, instanceId: "enemy_minion_1", hp: 10, maxHp: 10 }];
}

function makeTinkerInstance(): MinionInstance {
  const tinker = instantiate(testMinionWithSpellDamage as never);
  return { ...tinker, instanceId: "tinker_1" };
}

function addSpell(state: GameState, spellId: string): GameState {
  const spellInstance: SpellInstance = {
    instanceId: `spell_${spellId}_1`,
    cardId: spellId,
  };
  return {
    ...state,
    players: state.players.map((pl, i) => (i === 0 ? { ...pl, spells: [spellInstance] } : pl)),
  };
}

function addBoard(state: GameState, playerId: number, board: MinionInstance[]): GameState {
  return {
    ...state,
    players: state.players.map((pl, i) => (i === playerId ? { ...pl, board } : pl)),
  };
}

// ---------------------------------------------------------------------------
// spellDamage from board minions — damage-dealing spells should scale
// ---------------------------------------------------------------------------

describe("spellDamage from board minions", () => {
  it("Mystery Shot deals base 2 damage with no spellDamage on board", () => {
    const rng = makeRng(100);
    const state = seeded(1);
    let s = step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "sel"),
    );
    s = step(s, { kind: "EndTurn", player: 0 }, rngForTurn(s, "endTurn"));

    s = addBoard(s, 1, makeEnemyBoard());
    s = addSpell(s, "mystery_shot");

    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rngForTurn(s, "playSpell"));

    const enemyAfter = s.players[1]!.board[0]!;
    expect(enemyAfter.hp).toBe(8); // 10 - 2 = 8
  });

  it("Mystery Shot deals 3 damage with one Arcane Tinker (spellDamage: 1) on caster's board", () => {
    const rng = makeRng(100);
    const state = seeded(1);
    let s = step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "sel"),
    );
    s = step(s, { kind: "EndTurn", player: 0 }, rngForTurn(s, "endTurn"));

    // Put tinker on player 0's board (caster) and enemy on player 1's board
    const tinker = makeTinkerInstance();
    s = addBoard(s, 0, [tinker]);
    s = addBoard(s, 1, makeEnemyBoard());
    s = addSpell(s, "mystery_shot");

    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rngForTurn(s, "playSpell"));

    // The spell deals (2 + 1) = 3 damage to whichever target it picks.
    // Check that either the tinker or the enemy took 3 damage.
    const tinkerAfter = s.players[0]!.board[0]!;
    const enemyAfter = s.players[1]!.board[0]!;
    const tinkerDmg = 2 - tinkerAfter.hp;
    const enemyDmg = 10 - enemyAfter.hp;
    const totalDmg = tinkerDmg + enemyDmg;
    expect(totalDmg).toBe(3); // base 2 + spellDamage 1
  });

  it("Mystery Shot deals 4 damage with two Arcane Tinkers (spellDamage: 2) on caster's board", () => {
    const rng = makeRng(100);
    const state = seeded(1);
    let s = step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "sel"),
    );
    s = step(s, { kind: "EndTurn", player: 0 }, rngForTurn(s, "endTurn"));

    // Put two tinkers on player 0's board (caster) and enemy on player 1's board
    const tinker1 = makeTinkerInstance();
    const tinker2 = makeTinkerInstance();
    s = addBoard(s, 0, [tinker1, tinker2]);
    s = addBoard(s, 1, makeEnemyBoard());
    s = addSpell(s, "mystery_shot");

    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rngForTurn(s, "playSpell"));

    // The spell deals (2 + 2) = 4 damage to whichever target it picks.
    const tinkerAfter = s.players[0]!.board;
    const enemyAfter = s.players[1]!.board[0]!;
    let totalDmg = 0;
    for (const t of tinkerAfter) {
      totalDmg += 2 - t.hp;
    }
    totalDmg += 10 - enemyAfter.hp;
    expect(totalDmg).toBe(4); // base 2 + spellDamage 2
  });

  it("Poison Dart Shield deals base 4 damage with no spellDamage on board", () => {
    const rng = makeRng(100);
    const state = seeded(1);
    let s = step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "sel"),
    );
    s = step(s, { kind: "EndTurn", player: 0 }, rngForTurn(s, "endTurn"));

    s = addBoard(s, 1, makeEnemyBoard());
    s = addSpell(s, "poison_dart_shield");

    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rngForTurn(s, "playSpell"));

    const enemyAfter = s.players[1]!.board[0]!;
    expect(enemyAfter.hp).toBe(6); // 10 - 4 = 6
  });

  it("Poison Dart Shield deals 5 damage with one Arcane Tinker (spellDamage: 1) on caster's board", () => {
    const rng = makeRng(100);
    const state = seeded(1);
    let s = step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "sel"),
    );
    s = step(s, { kind: "EndTurn", player: 0 }, rngForTurn(s, "endTurn"));

    // Put tinker on player 0's board (caster) and enemy on player 1's board
    const tinker = makeTinkerInstance();
    s = addBoard(s, 0, [tinker]);
    s = addBoard(s, 1, makeEnemyBoard());
    s = addSpell(s, "poison_dart_shield");

    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rngForTurn(s, "playSpell"));

    // The spell deals (4 + 1) = 5 damage to whichever target it picks.
    const tinkerAfter = s.players[0]!.board[0]!;
    const enemyAfter = s.players[1]!.board[0]!;
    const tinkerDmg = 2 - tinkerAfter.hp;
    const enemyDmg = 10 - enemyAfter.hp;
    const totalDmg = tinkerDmg + enemyDmg;
    expect(totalDmg).toBe(5); // base 4 + spellDamage 1
  });
});
