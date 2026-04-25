import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { HEROES, getAllHeroIds } from "./heroes/index";
import { makeInitialState, beginRecruitTurn } from "./state";
import { step } from "./state";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";

const RNG = makeRng(1);

// ---------------------------------------------------------------------------
// Hero registry
// ---------------------------------------------------------------------------

describe("HEROES registry", () => {
  it("contains all 10 gameplay heroes (excluding stub)", () => {
    const ids = getAllHeroIds();
    expect(ids).toHaveLength(10);
  });

  it("every hero has a description", () => {
    for (const hero of Object.values(HEROES)) {
      expect(hero.description).toBeTruthy();
    }
  });

  it("Patchwerk starts at 60 HP", () => {
    expect(HEROES["patchwerk"]?.startHp).toBe(60);
  });

  it("George the Fallen starts at 35 HP with 5 armor", () => {
    expect(HEROES["george_the_fallen"]?.startHp).toBe(35);
    expect(HEROES["george_the_fallen"]?.startArmor).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Hero selection flow
// ---------------------------------------------------------------------------

describe("hero selection", () => {
  it("assigns HP and armor from the selected hero", () => {
    let state = makeInitialState(1);
    // Select heroes for all 8 players to trigger transition to Recruit
    const heroIds = ["patchwerk", "george_the_fallen", "sir_finley", "edwin_van_cleef",
      "scabbs_cutterbutter", "ragnaros", "ysera", "millificent_manastorm"];

    for (let i = 0; i < 8; i++) {
      state = step(state, { kind: "SelectHero", player: i, heroId: heroIds[i]! }, RNG);
    }

    // Player 0 picked Patchwerk (60 HP)
    expect(state.players[0]!.hp).toBe(60);
    // Player 1 picked George (35 HP, 5 armor)
    expect(state.players[1]!.hp).toBe(35);
    expect(state.players[1]!.armor).toBe(5);
    // Phase transitions to Recruit once all heroes selected
    expect(state.phase.kind).toBe("Recruit");
  });

  it("heroPowerUsed starts false each turn", () => {
    let state = makeInitialState(1);
    const heroIds = ["stub_hero", "stub_hero", "stub_hero", "stub_hero",
      "stub_hero", "stub_hero", "stub_hero", "stub_hero"];
    for (let i = 0; i < 8; i++) {
      state = step(state, { kind: "SelectHero", player: i, heroId: heroIds[i]! }, RNG);
    }
    expect(state.players[0]!.heroPowerUsed).toBe(false);

    state = beginRecruitTurn(state, RNG);
    expect(state.players[0]!.heroPowerUsed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Hero powers — active effects
// ---------------------------------------------------------------------------

function makeStateWithHero(heroId: string, board: ReturnType<typeof instantiate>[] = []) {
  let state = makeInitialState(99);
  // Set the hero directly (skip full selection)
  const hero = HEROES[heroId]!;
  state = {
    ...state,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: state.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            heroId,
            hp: hero.startHp,
            armor: hero.startArmor,
            gold: 10,
            board,
            heroPowerUsed: false,
          }
        : p,
    ),
  };
  return state;
}

describe("George the Fallen hero power", () => {
  it("gives divine shield to the targeted board minion", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("george_the_fallen", [minion]);

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    const buffed = after.players[0]!.board[0]!;
    expect(buffed.keywords.has("divine_shield")).toBe(true);
    expect(after.players[0]!.gold).toBe(8); // 10 - 2
    expect(after.players[0]!.heroPowerUsed).toBe(true);
  });

  it("cannot be used twice in one turn", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("george_the_fallen", [minion]);

    const after1 = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    expect(() => step(after1, { kind: "HeroPower", player: 0, target: 0 }, RNG)).toThrow(
      "Hero power already used this turn",
    );
  });

  it("throws when not enough gold", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = {
      ...makeStateWithHero("george_the_fallen", [minion]),
      players: makeStateWithHero("george_the_fallen", [minion]).players.map((p, i) =>
        i === 0 ? { ...p, gold: 1 } : p,
      ),
    };
    expect(() => step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG)).toThrow(
      "Not enough gold",
    );
  });
});

describe("Edwin Van Cleef hero power", () => {
  it("gives +1/+1 to all minions in hand", () => {
    const m1 = instantiate(MINIONS["wrath_weaver"]!);
    const m2 = instantiate(MINIONS["alley_cat"]!);
    let state = makeStateWithHero("edwin_van_cleef");
    state = { ...state, players: state.players.map((p, i) =>
      i === 0 ? { ...p, hand: [m1, m2] } : p) };

    const after = step(state, { kind: "HeroPower", player: 0, target: undefined }, RNG);
    const hand = after.players[0]!.hand;
    expect(hand[0]!.atk).toBe(m1.atk + 1);
    expect(hand[0]!.hp).toBe(m1.hp + 1);
    expect(hand[1]!.atk).toBe(m2.atk + 1);
    expect(after.players[0]!.gold).toBe(6); // 10 - 4
  });
});

describe("Sir Finley Mrrgglton hero power", () => {
  it("gives +1/+1 to the targeted board minion", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("sir_finley", [minion]);
    const origAtk = minion.atk;
    const origHp = minion.hp;

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    const buffed = after.players[0]!.board[0]!;
    expect(buffed.atk).toBe(origAtk + 1);
    expect(buffed.hp).toBe(origHp + 1);
    expect(after.players[0]!.gold).toBe(8);
  });
});

describe("Scabbs Cutterbutter hero power", () => {
  it("gives +1/+1 to a board minion for 1 gold", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("scabbs_cutterbutter", [minion]);
    const origAtk = minion.atk;

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    expect(after.players[0]!.board[0]!.atk).toBe(origAtk + 1);
    expect(after.players[0]!.gold).toBe(9); // 10 - 1
  });
});
