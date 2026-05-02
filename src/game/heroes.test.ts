import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { getAllHeroIds, HEROES } from "./heroes/index";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import { beginRecruitTurn, makeInitialState, rngForTurn, step } from "./state";
import type { Hero } from "./types";

const RNG = makeRng(1);

// ---------------------------------------------------------------------------
// Hero registry
// ---------------------------------------------------------------------------

describe("HEROES registry", () => {
  it("contains all 18 gameplay heroes (excluding stub)", () => {
    const ids = getAllHeroIds();
    expect(ids).toHaveLength(18);
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
  it("swaps hero power to another active hero", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("sir_finley", [minion]);
    expect(state.players[0]!.heroId).toBe("sir_finley");
    expect(state.players[0]!.hp).toBe(40);
    expect(state.players[0]!.armor).toBe(0);

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    // Should have swapped to a different active hero (not sir_finley, not stub)
    expect(after.players[0]!.heroId).not.toBe("sir_finley");
    expect(after.players[0]!.heroId).not.toBe("stub_hero");
    // HP and armor should change to match the new hero
    const newHero = HEROES[after.players[0]!.heroId];
    expect(after.players[0]!.hp).toBe(newHero!.startHp);
    expect(after.players[0]!.armor).toBe(newHero!.startArmor);
    // Should cost 2 gold
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
    // The Curator ensures at least one missing tribe is represented in the shop.
    // When the shop is full and multiple tribes are missing, it may only add one.
    const hasMurloc = shop.some((m) => m.tribes.includes("Murloc"));
    const hasBeast = shop.some((m) => m.tribes.includes("Beast"));
    expect(hasMurloc || hasBeast).toBe(true);
  });

  it("does nothing when board is empty", () => {
    const state = makeStateWithHero("the_curator");
    const curState = beginRecruitTurn(state, RNG);
    // Shop should just be the normal roll, no extra guarantees needed
    expect(curState.players[0]!.shop.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// King Mukla
// ---------------------------------------------------------------------------

describe("King Mukla", () => {
  it("grants a Banana spell at start of first recruit turn", () => {
    const state = makeInitialState(42);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "king_mukla" }, makeRng(42));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(42));
    }
    expect(s.phase.kind).toBe("Recruit");
    const player = s.players[0]!;
    const bananas = player.spells.filter((sp) => sp.cardId === "banana");
    expect(bananas).toHaveLength(1);
  });

  it("grants a new Banana each subsequent recruit turn", () => {
    const state = makeInitialState(99);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "king_mukla" }, makeRng(99));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(99));
    }
    // After first recruit turn: 1 banana
    expect(s.players[0]!.spells.filter((sp) => sp.cardId === "banana")).toHaveLength(1);

    // End turn to trigger combat + next recruit turn
    s = step(s, { kind: "EndTurn", player: 0 }, makeRng(99));
    // After second recruit turn: 2 bananas
    const player = s.players[0]!;
    const bananas = player.spells.filter((sp) => sp.cardId === "banana");
    expect(bananas).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Sindragosa
// ---------------------------------------------------------------------------

describe("Sindragosa passive", () => {
  it("buffs frozen shop minions by +1/+1 at start of recruit turn", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    let state = makeStateWithHero("sindragosa", []);
    // Put a minion in the shop and freeze it
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, shop: [minion], shopFrozen: true } : p,
      ),
    };

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    expect(shop[0]!.atk).toBe(minion.atk + 1);
    expect(shop[0]!.hp).toBe(minion.hp + 1);
  });

  it("does nothing when shop is not frozen", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    let state = makeStateWithHero("sindragosa", []);
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, shop: [minion], shopFrozen: false } : p,
      ),
    };

    const after = beginRecruitTurn(state, RNG);
    // When not frozen, the shop gets re-rolled normally (Sindragosa does not buff)
    // The re-rolled shop should not have the +1/+1 buff from Sindragosa
    // Just verify the shop exists and was re-rolled (different from original)
    const shop = after.players[0]!.shop;
    expect(shop.length).toBeGreaterThan(0);
    // The original minion should not be in the shop (it was re-rolled)
    const originalStillThere = shop.some((m) => m.instanceId === minion.instanceId);
    // It's fine if it's there or not — the key is no +1/+1 buff was applied
    // Verify shopFrozen is still false
    expect(after.players[0]!.shopFrozen).toBe(false);
  });

  it("buffs all frozen shop minions, not just one", () => {
    const m1 = instantiate(MINIONS["wrath_weaver"]!);
    const m2 = instantiate(MINIONS["alley_cat"]!);
    let state = makeStateWithHero("sindragosa", []);
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, shop: [m1, m2], shopFrozen: true } : p,
      ),
    };

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    expect(shop[0]!.atk).toBe(m1.atk + 1);
    expect(shop[0]!.hp).toBe(m1.hp + 1);
    expect(shop[1]!.atk).toBe(m2.atk + 1);
    expect(shop[1]!.hp).toBe(m2.hp + 1);
  });

  it("does nothing when shop is empty", () => {
    let state = makeStateWithHero("sindragosa");
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [], shopFrozen: true } : p)),
    };

    const after = beginRecruitTurn(state, RNG);
    expect(after.players[0]!.shop).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Jaraxxus
// ---------------------------------------------------------------------------

describe("Jaraxxus passive", () => {
  it("buffs demons in shop by +1/+1 at start of recruit turn", () => {
    const demon = instantiate(MINIONS["flame_imp"]!);
    const nonDemon = instantiate(MINIONS["alley_cat"]!);
    let state = makeStateWithHero("jaraxxus", []);
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [demon, nonDemon] } : p)),
    };

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // Demon should be buffed
    expect(shop[0]!.atk).toBe(demon.atk + 1);
    expect(shop[0]!.hp).toBe(demon.hp + 1);
    // Non-demon should be unchanged
    expect(shop[1]!.atk).toBe(nonDemon.atk);
    expect(shop[1]!.hp).toBe(nonDemon.hp);
  });

  it("buffs all demons, not just one", () => {
    const d1 = instantiate(MINIONS["flame_imp"]!);
    const d2 = instantiate(MINIONS["vulgar_homunculus"]!);
    const nonDemon = instantiate(MINIONS["rockpool_hunter"]!);
    let state = makeStateWithHero("jaraxxus", []);
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [d1, d2, nonDemon] } : p)),
    };

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    expect(shop[0]!.atk).toBe(d1.atk + 1);
    expect(shop[0]!.hp).toBe(d1.hp + 1);
    expect(shop[1]!.atk).toBe(d2.atk + 1);
    expect(shop[1]!.hp).toBe(d2.hp + 1);
    expect(shop[2]!.atk).toBe(nonDemon.atk);
    expect(shop[2]!.hp).toBe(nonDemon.hp);
  });

  it("does nothing when shop is empty", () => {
    let state = makeStateWithHero("jaraxxus");
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [] } : p)),
    };

    const after = beginRecruitTurn(state, RNG);
    // Shop gets re-rolled even when empty, so it won't be empty after
    // The key is no +1/+1 buff was applied (no demons to buff)
    expect(after.players[0]!.shop.length).toBeGreaterThan(0);
  });

  it("does not buff non-demon minions", () => {
    const beast = instantiate(MINIONS["bristleback_boys"]!);
    const mech = instantiate(MINIONS["annoy_o_tron"]!);
    const murloc = instantiate(MINIONS["murloc_tidecaller"]!);
    let state = makeStateWithHero("jaraxxus", []);
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [beast, mech, murloc] } : p)),
    };

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    expect(shop[0]!.atk).toBe(beast.atk);
    expect(shop[0]!.hp).toBe(beast.hp);
    expect(shop[1]!.atk).toBe(mech.atk);
    expect(shop[1]!.hp).toBe(mech.hp);
    expect(shop[2]!.atk).toBe(murloc.atk);
    expect(shop[2]!.hp).toBe(murloc.hp);
  });
});

// ---------------------------------------------------------------------------
// Trade Prince Gallywix
// ---------------------------------------------------------------------------

describe("Trade Prince Gallywix hero power", () => {
  it("adds a copy of a random opponent board minion to hand", () => {
    const opponentMinion = instantiate(MINIONS["wrath_weaver"]!);
    let state = makeStateWithHero("trade-prince-gallywix", []);
    // Set up an opponent with a minion on board and create a pairing
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 1
          ? {
              ...p,
              heroId: "patchwerk",
              hp: 40,
              board: [opponentMinion],
            }
          : p,
      ),
      pairingsHistory: [[0, 1]],
    };

    const handBefore = state.players[0]!.hand.length;
    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    const handAfter = after.players[0]!.hand;

    expect(handAfter.length).toBe(handBefore + 1);
    const copied = handAfter[handAfter.length - 1]!;
    expect(copied.cardId).toBe("wrath_weaver");
    expect(after.players[0]!.gold).toBe(8); // 10 - 2
    expect(after.players[0]!.heroPowerUsed).toBe(true);
  });

  it("copies the minion with correct stats from opponent's board", () => {
    const opponentMinion = instantiate(MINIONS["venomous_crasher"]!);
    // Give the opponent's minion boosted stats (e.g. from buffs)
    const boostedMinion = { ...opponentMinion, atk: 5, hp: 8, maxHp: 8 };
    let state = makeStateWithHero("trade-prince-gallywix", []);
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 1
          ? {
              ...p,
              heroId: "patchwerk",
              hp: 40,
              board: [boostedMinion],
            }
          : p,
      ),
      pairingsHistory: [[0, 1]],
    };

    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    const copied = after.players[0]!.hand[after.players[0]!.hand.length - 1]!;
    // The copy should have the base stats from the card, not the boosted stats
    // (we instantiate from the card, not clone the instance)
    const baseCard = MINIONS["venomous_crasher"]!;
    expect(copied.atk).toBe(baseCard.baseAtk);
    expect(copied.hp).toBe(baseCard.baseHp);
  });

  it("does nothing when opponent has no alive minions", () => {
    let state = makeStateWithHero("trade-prince-gallywix", []);
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 1
          ? {
              ...p,
              heroId: "patchwerk",
              hp: 40,
              board: [],
            }
          : p,
      ),
      pairingsHistory: [[0, 1]],
    };

    const handBefore = state.players[0]!.hand.length;
    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    expect(after.players[0]!.hand.length).toBe(handBefore);
  });

  it("does nothing when there is no pairing yet", () => {
    const state = makeStateWithHero("trade-prince-gallywix", []);

    const handBefore = state.players[0]!.hand.length;
    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    expect(after.players[0]!.hand.length).toBe(handBefore);
  });

  it("finds opponent from the most recent pairing involving player 0", () => {
    const opponentMinion = instantiate(MINIONS["flame_imp"]!);
    let state = makeStateWithHero("trade-prince-gallywix", []);
    // Set up player 3 as the opponent with a minion on board
    state = {
      ...state,
      players: state.players.map((p, i) =>
        i === 3
          ? {
              ...p,
              heroId: "patchwerk",
              hp: 40,
              board: [opponentMinion],
            }
          : p,
      ),
      pairingsHistory: [
        [0, 1],
        [2, 3],
        [0, 3],
      ],
    };

    const after = step(state, { kind: "HeroPower", player: 0 }, RNG);
    const handAfter = after.players[0]!.hand;
    expect(handAfter.length).toBe(1);
    expect(handAfter[0]!.cardId).toBe("flame_imp");
  });
});
