import { describe, expect, it } from "vitest";
import {
  brawl,
  cauterizingFlame,
  duskrayBuff,
  getAllSpellIds,
  getSpell,
  mysteryShot,
  pancakeSpell,
  poisonDartShield,
  SPELLS,
  swatTeam,
  tavernBrawl,
  tavernBrawler,
  tavernTipper,
} from "@/game/spells";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { Action, GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

describe("spell registry", () => {
  it("exports exactly 11 spells", () => {
    expect(getAllSpellIds()).toHaveLength(11);
  });

  it.each([
    poisonDartShield,
    mysteryShot,
    duskrayBuff,
    pancakeSpell,
    tavernBrawler,
    tavernBrawl,
    brawl,
    cauterizingFlame,
    tavernTipper,
    swatTeam,
  ])("%s has valid fields", (spell) => {
    expect(spell.id).toBeDefined();
    expect(spell.name).toBeDefined();
    expect(spell.description.length).toBeGreaterThan(0);
    expect(spell.cost).toBeGreaterThan(0);
    expect(spell.tiers.length).toBeGreaterThan(0);
    expect(spell.effects).toBeDefined();
    expect(spell.effects.onPlay).toBeDefined();
  });

  it("getSpell returns the same object", () => {
    expect(getSpell(poisonDartShield.id)).toBe(poisonDartShield);
  });

  it("getSpell throws for unknown id", () => {
    expect(() => getSpell("nonexistent_spell")).toThrow("Unknown spell: nonexistent_spell");
  });

  it("SPELLS object keys match getAllSpellIds", () => {
    expect(Object.keys(SPELLS).sort()).toEqual(getAllSpellIds().sort());
  });
});

describe("mystery shot", () => {
  it("is available at all tiers", () => {
    for (let t = 1; t <= 6; t++) {
      expect(mysteryShot.tiers).toContain(t as 1 | 2 | 3 | 4 | 5 | 6);
    }
  });

  it("costs 2 gold", () => {
    expect(mysteryShot.cost).toBe(2);
  });
});

describe("poison dart shield", () => {
  function makeSpellcastState(): GameState {
    const state = makeInitialState(42);
    return step(
      state,
      { kind: "SelectHero", player: 0, heroId: "patchwerk" },
      rngForTurn(state, "selectHero"),
    );
  }

  it("can be created and has correct cost", () => {
    expect(poisonDartShield.cost).toBe(2);
    expect(poisonDartShield.tiers).toContain(1);
    expect(poisonDartShield.tiers).toContain(6);
  });

  it("is available at all tiers", () => {
    for (let t = 1; t <= 6; t++) {
      expect(poisonDartShield.tiers).toContain(t as 1 | 2 | 3 | 4 | 5 | 6);
    }
  });
});

describe("duskray buff", () => {
  it("is available at tiers 3-6 only", () => {
    expect(duskrayBuff.tiers).toEqual([3, 4, 5, 6]);
  });

  it("costs 3 gold", () => {
    expect(duskrayBuff.cost).toBe(3);
  });
});

describe("pancake", () => {
  it("is available at all tiers", () => {
    for (let t = 1; t <= 6; t++) {
      expect(pancakeSpell.tiers).toContain(t as 1 | 2 | 3 | 4 | 5 | 6);
    }
  });

  it("costs 1 gold", () => {
    expect(pancakeSpell.cost).toBe(1);
  });
});

describe("tavern brawler", () => {
  it("is available at tiers 3-6 only", () => {
    expect(tavernBrawler.tiers).toEqual([3, 4, 5, 6]);
  });

  it("costs 2 gold", () => {
    expect(tavernBrawler.cost).toBe(2);
  });
});

describe("tavern brawl", () => {
  it("is available at tiers 2-4 only", () => {
    expect(tavernBrawl.tiers).toEqual([2, 3, 4]);
  });

  it("costs 2 gold", () => {
    expect(tavernBrawl.cost).toBe(2);
  });
});

describe("brawl", () => {
  it("is available at tiers 3-6 only", () => {
    expect(brawl.tiers).toEqual([3, 4, 5, 6]);
  });

  it("costs 2 gold", () => {
    expect(brawl.cost).toBe(2);
  });
});

describe("cauterizing flame", () => {
  it("is available at tiers 4-6 only", () => {
    expect(cauterizingFlame.tiers).toEqual([4, 5, 6]);
  });

  it("costs 3 gold", () => {
    expect(cauterizingFlame.cost).toBe(3);
  });

  it("has a valid onPlay handler", () => {
    expect(cauterizingFlame.effects.onPlay).toBeDefined();
    expect(typeof cauterizingFlame.effects.onPlay).toBe("function");
  });
});

describe("tavern tipper", () => {
  it("is available at tiers 2-5 only", () => {
    expect(tavernTipper.tiers).toEqual([2, 3, 4, 5]);
  });

  it("costs 2 gold", () => {
    expect(tavernTipper.cost).toBe(2);
  });
});

describe("swat team", () => {
  it("is available at tiers 3-6 only", () => {
    expect(swatTeam.tiers).toEqual([3, 4, 5, 6]);
  });

  it("costs 3 gold", () => {
    expect(swatTeam.cost).toBe(3);
  });

  it("summons three 1/1 Recruits with rush to an empty board", () => {
    const state = makeInitialState(42);
    const rng = rngForTurn(state, "selectHero");
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "patchwerk" }, rng);
    s = step(s, { kind: "EndTurn", player: 0 }, rng);

    // Directly add a swat team spell instance to the player's spells array
    const swatInstance = {
      instanceId: "swat_inst_1",
      cardId: "swat_team",
    } as import("./types").SpellInstance;
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, spells: [swatInstance] } : p)),
    };

    // Play the spell
    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rng);

    const player = s.players[0]!;
    expect(player.board.length).toBe(3);
    for (const m of player.board) {
      expect(m.atk).toBe(1);
      expect(m.hp).toBe(1);
      expect(m.cardId).toBe("swat_recruit");
      expect(m.keywords.has("rush" as const)).toBe(true);
    }
  });

  it("respects board cap of 7 minions", () => {
    const state = makeInitialState(42);
    const rng = rngForTurn(state, "selectHero");
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "patchwerk" }, rng);
    s = step(s, { kind: "EndTurn", player: 0 }, rng);

    // Fill board with 5 minions directly
    const boardMinions: import("./types").MinionInstance[] = [];
    for (let i = 0; i < 5; i++) {
      boardMinions.push({
        instanceId: `board_minion_${i}`,
        cardId: "rush_minion",
        atk: 1,
        hp: 1,
        maxHp: 1,
        keywords: new Set(),
        tribes: [],
        golden: false,
        spellDamage: 0,
        attachments: {},
        hooks: {},
      });
    }
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, board: boardMinions, gold: 15 } : p)),
    };

    expect(s.players[0]!.board.length).toBe(5);

    // Directly add a swat team spell instance
    const swatInstance = {
      instanceId: "swat_inst_2",
      cardId: "swat_team",
    } as import("./types").SpellInstance;
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, spells: [swatInstance] } : p)),
    };

    // Play swat team — should only add 2 (7 - 5 = 2 slots)
    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rng);

    expect(s.players[0]!.board.length).toBe(7);
  });

  it("does nothing when board is full", () => {
    const state = makeInitialState(42);
    const rng = rngForTurn(state, "selectHero");
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "patchwerk" }, rng);
    s = step(s, { kind: "EndTurn", player: 0 }, rng);

    // Fill board to 7 directly
    const boardMinions: import("./types").MinionInstance[] = [];
    for (let i = 0; i < 7; i++) {
      boardMinions.push({
        instanceId: `board_minion_${i}`,
        cardId: "rush_minion",
        atk: 1,
        hp: 1,
        maxHp: 1,
        keywords: new Set(),
        tribes: [],
        golden: false,
        spellDamage: 0,
        attachments: {},
        hooks: {},
      });
    }
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, board: boardMinions } : p)),
    };

    // Directly add a swat team spell instance
    const swatInstance = {
      instanceId: "swat_inst_3",
      cardId: "swat_team",
    } as import("./types").SpellInstance;
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, spells: [swatInstance] } : p)),
    };

    // Play swat team — should add nothing
    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rng);

    expect(s.players[0]!.board.length).toBe(7);
  });

  it("does nothing when board is full", () => {
    const state = makeInitialState(42);
    const rng = rngForTurn(state, "selectHero");
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "patchwerk" }, rng);
    s = step(s, { kind: "EndTurn", player: 0 }, rng);

    // Fill board to 7 directly
    const boardMinions: import("./types").MinionInstance[] = [];
    for (let i = 0; i < 7; i++) {
      boardMinions.push({
        instanceId: `board_minion_${i}`,
        cardId: "rush_minion",
        atk: 1,
        hp: 1,
        maxHp: 1,
        keywords: new Set(),
        tribes: [],
        golden: false,
        spellDamage: 0,
        attachments: {},
        hooks: {},
      });
    }
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, board: boardMinions } : p)),
    };

    // Directly add a swat team spell instance
    const swatInstance = {
      instanceId: "swat_inst_3",
      cardId: "swat_team",
    } as import("./types").SpellInstance;
    s = {
      ...s,
      players: s.players.map((p, i) => (i === 0 ? { ...p, spells: [swatInstance] } : p)),
    };

    // Play swat team — should add nothing
    s = step(s, { kind: "PlaySpell", player: 0, spellIndex: 0 }, rng);

    expect(s.players[0]!.board.length).toBe(7);
  });
});
