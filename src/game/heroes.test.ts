import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { getAllHeroIds, HEROES } from "./heroes/index";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import { beginRecruitTurn, makeInitialState, step } from "./state";
import type { Hero } from "./types";

const RNG = makeRng(1);

// ---------------------------------------------------------------------------
// Hero registry
// ---------------------------------------------------------------------------

describe("HEROES registry", () => {
  it("contains all 14 gameplay heroes (excluding stub)", () => {
    const ids = getAllHeroIds();
    expect(ids).toHaveLength(14);
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

describe("hero tier stats", () => {
  // Known valid start HP values for BG heroes
  const validHPs = new Set([25, 30, 35, 40, 50, 60]);
  // Known valid start armor values (per spec: 0/3/5/7/9)
  const validArmor = new Set([0, 3, 5, 7, 9]);

  it("every hero's start HP is a recognized value", () => {
    const heroes = Object.values(HEROES).filter((h): h is Hero => h !== undefined);
    for (const hero of heroes) {
      expect(validHPs.has(hero.startHp)).toBe(true);
    }
  });

  it("every hero's start armor is a valid tier value", () => {
    const nonStubHeroes = getAllHeroIds();
    for (const id of nonStubHeroes) {
      const hero = HEROES[id];
      expect(hero).toBeDefined();
      expect(validArmor.has(hero!.startArmor)).toBe(true);
    }
  });
});

describe("hero selection", () => {
  it("assigns HP and armor from the selected hero", () => {
    let state = makeInitialState(1);
    // Select player 0's hero — AI players are auto-assigned random heroes.
    state = step(state, { kind: "SelectHero", player: 0, heroId: "patchwerk" }, RNG);

    // Player 0 picked Patchwerk (60 HP)
    expect(state.players[0]!.hp).toBe(60);
    // Phase transitions to Recruit once player 0 selects (AI auto-assigned)
    expect(state.phase.kind).toBe("Recruit");
    // AI players should have been assigned random heroes
    for (let i = 1; i < 8; i++) {
      const p = state.players[i]!;
      expect(p.heroId).not.toBe("");
      expect(p.heroId).not.toBe("stub_hero");
      expect(p.hp).toBeGreaterThan(0);
    }
  });

  it("heroPowerUsed starts false each turn", () => {
    let state = makeInitialState(1);
    const heroIds = [
      "stub_hero",
      "stub_hero",
      "stub_hero",
      "stub_hero",
      "stub_hero",
      "stub_hero",
      "stub_hero",
      "stub_hero",
    ];
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
    expect(buffed.keywords.has("divineShield")).toBe(true);
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
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, hand: [m1, m2] } : p)),
    };

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

describe("Yogg-Saron hero power", () => {
  it("gives all friendly minions a random keyword for 2 gold", () => {
    const m1 = instantiate(MINIONS["wrath_weaver"]!);
    const m2 = instantiate(MINIONS["venomous_crasher"]!);
    const state = makeStateWithHero("yogg_saron", [m1, m2]);

    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    const board = after.players[0]!.board;
    expect(board[0]!.keywords.size).toBeGreaterThan(m1.keywords.size);
    expect(board[1]!.keywords.size).toBeGreaterThan(m2.keywords.size);
    // Both minions should share the same randomly chosen keyword
    const kw1 = board[0]!.keywords.values().next().value;
    const kw2 = board[1]!.keywords.values().next().value;
    // The new keyword should be the same for all minions
    const newKw1 = [...board[0]!.keywords].find((k) => !m1.keywords.has(k));
    const newKw2 = [...board[1]!.keywords].find((k) => !m2.keywords.has(k));
    expect(newKw1).toBe(newKw2);
    expect(after.players[0]!.gold).toBe(8); // 10 - 2
    expect(after.players[0]!.heroPowerUsed).toBe(true);
  });

  it("does nothing when board is empty but still costs gold", () => {
    const state = makeStateWithHero("yogg_saron");
    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    expect(after.players[0]!.gold).toBe(8); // 10 - 2, gold still spent
    expect(after.players[0]!.heroPowerUsed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The Curator — passive: shop contains one of each tribe on board
// ---------------------------------------------------------------------------

describe("The Curator passive", () => {
  it("adds a murloc to shop when a murloc is on the board", () => {
    const murlocMinion = instantiate(MINIONS["rockpool_hunter"]!);
    const state = makeStateWithHero("the_curator", [murlocMinion]);
    const curState = beginRecruitTurn(state, RNG);
    const shop = curState.players[0]!.shop;
    const hasMurloc = shop.some((m) => m.tribes.includes("Murloc"));
    expect(hasMurloc).toBe(true);
  });

  it("adds a beast to shop when a beast is on the board", () => {
    const beastMinion = instantiate(MINIONS["bristleback_boys"]!);
    const state = makeStateWithHero("the_curator", [beastMinion]);
    const curState = beginRecruitTurn(state, RNG);
    const shop = curState.players[0]!.shop;
    const hasBeast = shop.some((m) => m.tribes.includes("Beast"));
    expect(hasBeast).toBe(true);
  });

  it("handles multiple tribes on board", () => {
    const murlocMinion = instantiate(MINIONS["rockpool_hunter"]!);
    const beastMinion = instantiate(MINIONS["bristleback_boys"]!);
    const state = makeStateWithHero("the_curator", [murlocMinion, beastMinion]);
    const curState = beginRecruitTurn(state, RNG);
    const shop = curState.players[0]!.shop;
    const hasMurloc = shop.some((m) => m.tribes.includes("Murloc"));
    const hasBeast = shop.some((m) => m.tribes.includes("Beast"));
    expect(hasMurloc).toBe(true);
    expect(hasBeast).toBe(true);
  });

  it("does nothing when board is empty", () => {
    const state = makeStateWithHero("the_curator");
    const curState = beginRecruitTurn(state, RNG);
    // Shop should just be the normal roll, no extra guarantees needed
    expect(curState.players[0]!.shop.length).toBeGreaterThan(0);
  });
});
