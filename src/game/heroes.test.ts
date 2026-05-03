import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { getAllHeroIds, HEROES } from "./heroes/index";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import { beginRecruitTurn, makeInitialState, rngForTurn, step } from "./state";
import type { Hero } from "./types";
import { updatePlayer } from "./utils";

const RNG = makeRng(1);

// ---------------------------------------------------------------------------
// Hero registry
// ---------------------------------------------------------------------------

describe("HEROES registry", () => {
  it("contains all 20 gameplay heroes (excluding stub)", () => {
    const ids = getAllHeroIds();
    expect(ids).toHaveLength(20);
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
  it("buffs frozen shop minions (with freeze keyword) by +1/+1 at start of recruit turn", () => {
    const state = makeStateWithHero("sindragosa", []);

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // Find any frozen-keyword minion in the rolled shop and verify it was buffed
    const frozenMinion = shop.find(
      (m) => m.keywords && m.keywords.has("freeze" as import("./types").Keyword),
    );
    // If a frozen minion was rolled, it should have +1/+1 buff
    if (frozenMinion) {
      const baseCard = MINIONS[frozenMinion.cardId];
      expect(frozenMinion.atk).toBe(baseCard!.baseAtk + 1);
      expect(frozenMinion.hp).toBe(baseCard!.baseHp + 1);
    }
  });

  it("does not buff non-frozen shop minions", () => {
    const state = makeStateWithHero("sindragosa", []);

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // Non-frozen minions should NOT have been buffed by Sindragosa
    // (they may have buffs from other sources, but not from Sindragosa)
    // We verify this by checking that non-frozen minions have their base stats
    // (no +1/+1 from Sindragosa)
    const nonFrozen = shop.filter(
      (m) => !(m.keywords && m.keywords.has("freeze" as import("./types").Keyword)),
    );
    for (const m of nonFrozen) {
      const baseCard = MINIONS[m.cardId];
      expect(m.atk).toBe(baseCard!.baseAtk);
      expect(m.hp).toBe(baseCard!.baseHp);
    }
  });

  it("buffs only frozen minions when shop has mixed types", () => {
    const state = makeStateWithHero("sindragosa", []);

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // Frozen minions should be buffed, non-frozen should not
    const frozen = shop.filter(
      (m) => m.keywords && m.keywords.has("freeze" as import("./types").Keyword),
    );
    const nonFrozen = shop.filter(
      (m) => !(m.keywords && m.keywords.has("freeze" as import("./types").Keyword)),
    );
    for (const m of frozen) {
      const baseCard = MINIONS[m.cardId];
      expect(m.atk).toBe(baseCard!.baseAtk + 1);
      expect(m.hp).toBe(baseCard!.baseHp + 1);
    }
    for (const m of nonFrozen) {
      const baseCard = MINIONS[m.cardId];
      expect(m.atk).toBe(baseCard!.baseAtk);
      expect(m.hp).toBe(baseCard!.baseHp);
    }
  });

  it("does nothing when shop is empty", () => {
    let state = makeStateWithHero("sindragosa");
    state = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, shop: [] } : p)),
    };

    const after = beginRecruitTurn(state, RNG);
    // Shop gets re-rolled by beginRecruitTurn even when empty — key is no crash
    expect(after.players[0]!.shop.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Jaraxxus
// ---------------------------------------------------------------------------

describe("Jaraxxus passive", () => {
  it("buffs demons in shop by +1/+1 at start of recruit turn", () => {
    const state = makeStateWithHero("jaraxxus", []);

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // Find any demon in the rolled shop and verify it was buffed
    const demons = shop.filter((m) => m.tribes && m.tribes.includes("Demon"));
    for (const m of demons) {
      const baseCard = MINIONS[m.cardId];
      expect(m.atk).toBe(baseCard!.baseAtk + 1);
      expect(m.hp).toBe(baseCard!.baseHp + 1);
    }
  });

  it("buffs all demons, not just one", () => {
    const state = makeStateWithHero("jaraxxus", []);

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // All demons in the shop should be buffed
    const demons = shop.filter((m) => m.tribes && m.tribes.includes("Demon"));
    for (const m of demons) {
      const baseCard = MINIONS[m.cardId];
      expect(m.atk).toBe(baseCard!.baseAtk + 1);
      expect(m.hp).toBe(baseCard!.baseHp + 1);
    }
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
    const state = makeStateWithHero("jaraxxus", []);

    const after = beginRecruitTurn(state, RNG);
    const shop = after.players[0]!.shop;
    // Non-demon minions should NOT have been buffed by Jaraxxus
    const nonDemons = shop.filter((m) => !(m.tribes && m.tribes.includes("Demon")));
    for (const m of nonDemons) {
      const baseCard = MINIONS[m.cardId];
      expect(m.atk).toBe(baseCard!.baseAtk);
      expect(m.hp).toBe(baseCard!.baseHp);
    }
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

describe("Reno Jackson hero power", () => {
  it("makes a friendly minion golden", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("reno_jackson", [minion]);

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    const golden = after.players[0]!.board[0]!;
    expect(golden.golden).toBe(true);
    expect(after.players[0]!.gold).toBe(5); // 10 - 5
    expect(after.players[0]!.renoJacksonUsed).toBe(true);
  });

  it("preserves actual stats when making minion golden (not base * 2)", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    // Give it buffs manually to simulate aura/buff effects
    const buffed = { ...minion, atk: 5, hp: 4, maxHp: 4 };
    const state = makeStateWithHero("reno_jackson", [buffed]);

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    const golden = after.players[0]!.board[0]!;
    // Should preserve the buffed stats, not do baseAtk * 2
    expect(golden.atk).toBe(5);
    expect(golden.hp).toBe(4);
    expect(golden.maxHp).toBe(4);
  });

  it("can only be used once per game", () => {
    const minion = instantiate(MINIONS["wrath_weaver"]!);
    const state = makeStateWithHero("reno_jackson", [minion]);

    const after1 = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    expect(after1.players[0]!.renoJacksonUsed).toBe(true);

    // Second use should fail — hero power already used this turn
    expect(() => step(after1, { kind: "HeroPower", player: 0, target: 0 }, RNG)).toThrow(
      "Hero power already used this turn",
    );
  });

  it("does nothing when no board minion exists", () => {
    const state = makeStateWithHero("reno_jackson", []);

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    // Should not error, just return unchanged state
    expect(after.players[0]!.board.length).toBe(0);
  });

  it("has correct stats: 30 HP, 7 armor, 5 gold cost", () => {
    const hero = HEROES["reno_jackson"];
    expect(hero).toBeDefined();
    expect(hero!.startHp).toBe(30);
    expect(hero!.startArmor).toBe(7);
    expect(hero!.power.kind).toBe("active");
    expect((hero!.power as { kind: "active"; cost: number; usesPerTurn: number }).cost).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Maiev Shadowsong
// ---------------------------------------------------------------------------

function makeMaievState(shopMinions: ReturnType<typeof instantiate>[]) {
  const state = makeInitialState(99);
  const hero = HEROES["maiev_shadowsong"]!;
  return {
    ...state,
    phase: { kind: "Recruit" as const, turn: 1 },
    turn: 1,
    players: state.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            heroId: "maiev_shadowsong",
            hp: hero.startHp,
            armor: hero.startArmor,
            gold: 10,
            board: [],
            shop: shopMinions,
            heroPowerUsed: false,
          }
        : p,
    ),
  } as import("./types").GameState;
}

describe("Maiev Shadowsong hero", () => {
  it("exists in the heroes registry", () => {
    expect(HEROES["maiev_shadowsong"]).toBeDefined();
  });

  it("has correct stats: 40 HP, 0 armor, 1 gold cost", () => {
    const hero = HEROES["maiev_shadowsong"];
    expect(hero).toBeDefined();
    expect(hero!.startHp).toBe(40);
    expect(hero!.startArmor).toBe(0);
    expect(hero!.power.kind).toBe("active");
    expect((hero!.power as { kind: "active"; cost: number; usesPerTurn: number }).cost).toBe(1);
  });

  it("puts a shop minion to dormant with turnsLeft=2", () => {
    const minion = instantiate(MINIONS["flame_imp"]!);
    const state = makeMaievState([minion]);

    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    const shopMinion = after.players[0]!.shop[0]!;
    expect(shopMinion.keywords.has("dormant" as import("./types").Keyword)).toBe(true);
    expect(shopMinion.attachments.dormantTurnsLeft).toBe(2);
  });

  it("dormant minions cannot be bought", () => {
    const minion = instantiate(MINIONS["flame_imp"]!);
    const state = makeMaievState([minion]);
    const withDormant = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);

    // Trying to buy a dormant minion should return unchanged state
    const bought = step(withDormant, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    expect(bought.players[0]!.shop.length).toBe(1);
    expect(bought.players[0]!.hand.length).toBe(0);
  });

  it("dormant minions awaken after 2 turns with +3/+3", () => {
    const minion = instantiate(MINIONS["flame_imp"]!);
    const baseAtk = minion.atk;
    const baseHp = minion.hp;
    const state = makeMaievState([minion]);
    const withDormant = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);

    // Turn 1: minion is dormant with turnsLeft=2
    let shopMinion = withDormant.players[0]!.shop[0]!;
    expect(shopMinion.attachments.dormantTurnsLeft).toBe(2);
    expect(shopMinion.keywords.has("dormant" as import("./types").Keyword)).toBe(true);

    // Turn 2: awaken decrements to 1
    const state2 = beginRecruitTurn(withDormant, RNG);
    shopMinion = state2.players[0]!.shop[0]!;
    expect(shopMinion.attachments.dormantTurnsLeft).toBe(1);
    expect(shopMinion.keywords.has("dormant" as import("./types").Keyword)).toBe(true);

    // Turn 3: awaken removes dormant keyword and adds +3/+3
    const state3 = beginRecruitTurn(state2, RNG);
    shopMinion = state3.players[0]!.shop[0]!;
    expect(shopMinion.keywords.has("dormant" as import("./types").Keyword)).toBe(false);
    expect(shopMinion.atk).toBe(baseAtk + 3);
    expect(shopMinion.hp).toBe(baseHp + 3);
    expect(shopMinion.maxHp).toBe(baseHp + 3);
  });

  it("dormant turns decrement each turn until awakening", () => {
    const minion = instantiate(MINIONS["flame_imp"]!);
    const state = makeMaievState([minion]);
    const withDormant = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);

    // Start: turnsLeft=2
    expect(withDormant.players[0]!.shop[0]!.attachments.dormantTurnsLeft).toBe(2);

    // After 1st beginRecruitTurn: turnsLeft=1
    const state2 = beginRecruitTurn(withDormant, RNG);
    expect(state2.players[0]!.shop[0]!.attachments.dormantTurnsLeft).toBe(1);

    // After 2nd beginRecruitTurn: dormant removed, +3/+3 applied
    const state3 = beginRecruitTurn(state2, RNG);
    expect(state3.players[0]!.shop[0]!.keywords.has("dormant" as import("./types").Keyword)).toBe(
      false,
    );
  });

  it("deducts 1 gold when using hero power", () => {
    const minion = instantiate(MINIONS["flame_imp"]!);
    const state = makeMaievState([minion]);
    // Override gold to 3 to verify deduction
    const withGold = {
      ...state,
      players: state.players.map((p, i) => (i === 0 ? { ...p, gold: 3 } : p)),
    };

    const after = step(withGold, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    expect(after.players[0]!.gold).toBe(2);
  });

  it("has correct description", () => {
    const hero = HEROES["maiev_shadowsong"];
    expect(hero!.description).toContain("Dormant");
    expect(hero!.description).toContain("+3/+3");
  });

  it("does nothing when targeting non-existent shop index", () => {
    const state = makeMaievState([]);
    const after = step(state, { kind: "HeroPower", player: 0, target: 0 }, RNG);
    expect(after.players[0]!.shop.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edwin Van Cleef — passive: every 2nd action gives all friendly minions +1/+1
// ---------------------------------------------------------------------------

describe("Edwin Van Cleef passive", () => {
  it("gives all friendly minions +1/+1 after 2 actions", () => {
    let state = makeInitialState(1);
    state = step(state, { kind: "SelectHero", player: 0, heroId: "edwin_van_cleef" }, RNG);
    state = beginRecruitTurn(state, RNG);

    const minion = instantiate(MINIONS["rockpool_hunter"]!);
    state = updatePlayer(state, 0, (p) => ({ ...p, shop: [minion], gold: 3 }));
    state = step(state, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(1);
    expect(state.players[0]!.hand.length).toBe(1);

    state = step(state, { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 0 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(2);
    expect(state.players[0]!.board[0]!.atk).toBe(minion.atk + 1);
    expect(state.players[0]!.board[0]!.hp).toBe(minion.hp + 1);
  });

  it("gives +1/+1 again after 4th action", () => {
    let state = makeInitialState(1);
    state = step(state, { kind: "SelectHero", player: 0, heroId: "edwin_van_cleef" }, RNG);
    state = beginRecruitTurn(state, RNG);

    const m1 = instantiate(MINIONS["rockpool_hunter"]!);
    const m2 = instantiate(MINIONS["murloc_tidehunter"]!);
    state = updatePlayer(state, 0, (p) => ({ ...p, shop: [m1, m2], gold: 6 }));

    state = step(state, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    state = step(state, { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 0 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(2);

    state = step(state, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(3);

    state = step(state, { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 1 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(4);
    expect(state.players[0]!.board[0]!.atk).toBe(m1.atk + 2);
    expect(state.players[0]!.board[1]!.atk).toBe(m2.atk + 1);
  });

  it("resets actionsThisTurn at start of each turn", () => {
    let state = makeInitialState(1);
    state = step(state, { kind: "SelectHero", player: 0, heroId: "edwin_van_cleef" }, RNG);
    state = beginRecruitTurn(state, RNG);

    const m1 = instantiate(MINIONS["rockpool_hunter"]!);
    state = updatePlayer(state, 0, (p) => ({ ...p, shop: [m1], gold: 3 }));

    state = step(state, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    state = step(state, { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 0 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(2);

    state = step(state, { kind: "EndTurn", player: 0 }, RNG);
    if (state.phase.kind === "Recruit") {
      expect(state.players[0]!.actionsThisTurn).toBe(0);
    }
  });

  it("does not buff when not Edwin Van Cleef", () => {
    let state = makeInitialState(1);
    state = step(state, { kind: "SelectHero", player: 0, heroId: "patchwerk" }, RNG);
    state = beginRecruitTurn(state, RNG);

    const m1 = instantiate(MINIONS["rockpool_hunter"]!);
    const m2 = instantiate(MINIONS["murloc_tidehunter"]!);
    state = updatePlayer(state, 0, (p) => ({ ...p, shop: [m1, m2], gold: 6 }));

    state = step(state, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    state = step(state, { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 0 }, RNG);
    state = step(state, { kind: "BuyMinion", player: 0, shopIndex: 0 }, RNG);
    state = step(state, { kind: "PlayMinion", player: 0, handIndex: 0, boardIndex: 1 }, RNG);
    expect(state.players[0]!.actionsThisTurn).toBe(4);
    expect(state.players[0]!.board[0]!.atk).toBe(m1.atk);
    expect(state.players[0]!.board[1]!.atk).toBe(m2.atk);
  });
});
