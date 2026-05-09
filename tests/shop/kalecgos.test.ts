import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { beginRecruitTurn, makeInitialState, rngForTurn, step } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

function p(state: GameState): GameState["players"][number] {
  return state.players[0]!;
}

function startGame(seed: number): GameState {
  let state = makeInitialState(seed);
  state = step(
    state,
    { kind: "SelectHero", player: 0, heroId: "patchwerk" },
    rngForTurn(state, "sel"),
  );
  state = allHeroesSelected(state);
  state = step(
    state,
    { kind: "SelectHero", player: 0, heroId: "patchwerk" },
    rngForTurn(state, "sel"),
  );
  return state;
}

function allHeroesSelected(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((pl) => (pl.heroId === "" ? { ...pl, heroId: "stub_hero" } : pl)),
  };
}

function buildKalecgosState(): GameState {
  const base = startGame(42);
  const minion1 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
  const minion2 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
  const kalecgos = instantiate(MINIONS["kalecgos_arcane_aspect"]!); // 4/8 Dragon

  return {
    ...base,
    phase: { kind: "Recruit", turn: 6 },
    turn: 6,
    players: base.players.map((pl, i) =>
      i === 0
        ? {
            ...pl,
            gold: 10,
            board: [minion1, minion2, kalecgos],
          }
        : i === 1
          ? { ...pl, board: [instantiate(MINIONS["murloc_scout"]!)] }
          : pl,
    ),
  } as GameState;
}

// ---------------------------------------------------------------------------
// Kalecgos, Arcane Aspect — onCast gives ALL friendly board minions +1/+1
// when a spell is cast
// ---------------------------------------------------------------------------

describe("kalecgos — onCast", () => {
  it("gives ALL friendly board minions +1/+1 when a spell is cast", () => {
    let state = buildKalecgosState();

    // Add a spell to the player's spells array
    const spellInstance = {
      instanceId: "spell_duskray_1",
      cardId: "duskray_buff",
    } as import("@/game/types").SpellInstance;
    state = {
      ...state,
      players: state.players.map((pl, i) => (i === 0 ? { ...pl, spells: [spellInstance] } : pl)),
    } as GameState;

    // Play the spell — this should trigger onCast on Kalecgos
    state = step(
      state,
      { kind: "PlaySpell", player: 0, spellIndex: 0, targetIndex: 0 },
      rngForTurn(state, "playSpell"),
    );

    const board = p(state).board;

    // All three minions should gain +1/+1 from Kalecgos onCast
    // Plus the spell Duskray Buff gives +2/+2 to the targeted minion (index 0)
    const kc = board.find((m) => m.cardId === "kalecgos_arcane_aspect");
    expect(kc).toBeDefined();
    expect(kc!.atk).toBe(5); // 4 + 1 (Kalecgos onCast only)
    expect(kc!.hp).toBe(9); // 8 + 1 (Kalecgos onCast only)

    const ac = board.find((m) => m.cardId === "alley_cat");
    expect(ac).toBeDefined();
    expect(ac!.atk).toBe(4); // 1 + 2 (spell) + 1 (Kalecgos onCast)
    expect(ac!.hp).toBe(4); // 1 + 2 (spell) + 1 (Kalecgos onCast)

    const ms = board.find((m) => m.cardId === "murloc_scout");
    expect(ms).toBeDefined();
    expect(ms!.atk).toBe(2); // 1 + 1 (Kalecgos onCast only)
    expect(ms!.hp).toBe(2); // 1 + 1 (Kalecgos onCast only)
  });

  it("does nothing when there are no Kalecgos on the board", () => {
    const base = startGame(42);
    const minion1 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    let state = {
      ...base,
      phase: { kind: "Recruit", turn: 6 },
      turn: 6,
      players: base.players.map((pl, i) =>
        i === 0
          ? {
              ...pl,
              gold: 10,
              board: [minion1],
            }
          : pl,
      ),
    } as GameState;

    // Add a spell to the player's spells array
    const spellInstance = {
      instanceId: "spell_duskray_1",
      cardId: "duskray_buff",
    } as import("@/game/types").SpellInstance;
    state = {
      ...state,
      players: state.players.map((pl, i) => (i === 0 ? { ...pl, spells: [spellInstance] } : pl)),
    } as GameState;

    // Play the spell — no Kalecgos on board, so nothing happens
    state = step(
      state,
      { kind: "PlaySpell", player: 0, spellIndex: 0, targetIndex: 0 },
      rngForTurn(state, "playSpell"),
    );

    const board = p(state).board;

    // Alley Cat should gain +2/+2 from the spell itself (no Kalecgos to add +1/+1)
    const ac = board.find((m) => m.cardId === "alley_cat");
    expect(ac).toBeDefined();
    expect(ac!.atk).toBe(3);
    expect(ac!.hp).toBe(3);
  });

  it("stacks across multiple spell casts", () => {
    let state = buildKalecgosState();

    // Add two spells to the player's spells array
    const spellInstance1 = {
      instanceId: "spell_duskray_1",
      cardId: "duskray_buff",
    } as import("@/game/types").SpellInstance;
    const spellInstance2 = {
      instanceId: "spell_duskray_2",
      cardId: "duskray_buff",
    } as import("@/game/types").SpellInstance;
    state = {
      ...state,
      players: state.players.map((pl, i) =>
        i === 0 ? { ...pl, spells: [spellInstance1, spellInstance2] } : pl,
      ),
    } as GameState;

    // First spell cast
    state = step(
      state,
      { kind: "PlaySpell", player: 0, spellIndex: 0, targetIndex: 0 },
      rngForTurn(state, "playSpell"),
    );

    // Second spell cast
    state = step(
      state,
      { kind: "PlaySpell", player: 0, spellIndex: 0, targetIndex: 0 },
      rngForTurn(state, "playSpell"),
    );

    const board = p(state).board;

    // All three minions should gain +2/+2 total from Kalecgos onCast (2 spell casts)
    // Plus each spell Duskray Buff gives +2/+2 to the targeted minion (index 0)
    const kc = board.find((m) => m.cardId === "kalecgos_arcane_aspect");
    expect(kc).toBeDefined();
    expect(kc!.atk).toBe(6); // 4 + 2 (Kalecgos onCast x2)
    expect(kc!.hp).toBe(10); // 8 + 2 (Kalecgos onCast x2)

    const ac = board.find((m) => m.cardId === "alley_cat");
    expect(ac).toBeDefined();
    expect(ac!.atk).toBe(7); // 1 + 4 (spell x2) + 2 (Kalecgos onCast x2)
    expect(ac!.hp).toBe(7); // 1 + 4 (spell x2) + 2 (Kalecgos onCast x2)

    const ms = board.find((m) => m.cardId === "murloc_scout");
    expect(ms).toBeDefined();
    expect(ms!.atk).toBe(3); // 1 + 2 (Kalecgos onCast x2)
    expect(ms!.hp).toBe(3); // 1 + 2 (Kalecgos onCast x2)
  });

  it("does not buff minions on enemy boards", () => {
    let state = buildKalecgosState();

    // Add a spell to the player's spells array
    const spellInstance = {
      instanceId: "spell_duskray_1",
      cardId: "duskray_buff",
    } as import("@/game/types").SpellInstance;
    state = {
      ...state,
      players: state.players.map((pl, i) => (i === 0 ? { ...pl, spells: [spellInstance] } : pl)),
    } as GameState;

    // Play the spell
    state = step(
      state,
      { kind: "PlaySpell", player: 0, spellIndex: 0, targetIndex: 0 },
      rngForTurn(state, "playSpell"),
    );

    const board = p(state).board;
    const enemyBoard = state.players[1]!.board;

    // Player's Alley Cat should gain +2/+2 from spell +1/+1 from Kalecgos onCast
    const ac = board.find((m) => m.cardId === "alley_cat");
    expect(ac).toBeDefined();
    expect(ac!.atk).toBe(4);
    expect(ac!.hp).toBe(4);

    // Enemy's Murloc Scout should NOT be buffed
    const ms = enemyBoard.find((m) => m.cardId === "murloc_scout");
    expect(ms).toBeDefined();
    expect(ms!.atk).toBe(1);
    expect(ms!.hp).toBe(1);
  });
});
