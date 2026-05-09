import { describe, expect, it } from "vitest";
import { HEROES } from "@/game/heroes";
import { ysera } from "@/game/heroes/ysera";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, step } from "@/game/state";
import { makeRng } from "@/lib/rng";

describe("Ysera — hero definition", () => {
  it("exists in the HEROES registry", () => {
    expect(HEROES["ysera"]).toBe(ysera);
  });

  it("has correct id", () => {
    expect(ysera.id).toBe("ysera");
  });

  it("has correct name", () => {
    expect(ysera.name).toBe("Ysera");
  });

  it("has passive power kind", () => {
    expect(ysera.power.kind).toBe("passive");
  });

  it("has startHp of 40", () => {
    expect(ysera.startHp).toBe(40);
  });

  it("has startArmor of 0", () => {
    expect(ysera.startArmor).toBe(0);
  });

  it("has description", () => {
    expect(ysera.description).toBe("At the start of your turn, add a Dragon to Bob's Tavern.");
  });
});

describe("Ysera — passive: adds a Dragon to the shop each turn", () => {
  it("adds a random Dragon to the shop at the start of each turn", () => {
    const state = makeInitialState(42);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "ysera" }, makeRng(42));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(42));
    }
    expect(s.phase.kind).toBe("Recruit");
    const shopAfterFirst = s.players[0]!.shop;
    const dragonsOnShop = shopAfterFirst.filter(
      (m) => "tribes" in m && (m as { tribes: string[] }).tribes.includes("Dragon"),
    );
    expect(dragonsOnShop.length).toBeGreaterThanOrEqual(1);
  });

  it("adds a dragon from the current tier", () => {
    const state = makeInitialState(77);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "ysera" }, makeRng(77));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(77));
    }
    const tier1Dragons = Object.values(MINIONS).filter(
      (m) => m.tribes.includes("Dragon") && m.tier === 1,
    );
    expect(tier1Dragons.length).toBeGreaterThan(0);
    const shopDragons = s.players[0]!.shop.filter(
      (m) => "tribes" in m && (m as { tribes: string[] }).tribes.includes("Dragon"),
    );
    for (const dragon of shopDragons) {
      const card = MINIONS[dragon.cardId];
      expect(card!.tier).toBe(1);
    }
  });

  it("adds a dragon from tier 2 when player is tier 2", () => {
    const state = makeInitialState(99);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "ysera" }, makeRng(99));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(99));
    }
    s = {
      ...s,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, gold: 4, tier: 1, upgradeCost: 4, upgradedThisTurn: false } : p,
      ),
    };
    s = step(s, { kind: "UpgradeTier", player: 0 }, makeRng(99));
    s = step(s, { kind: "EndTurn", player: 0 }, makeRng(99));
    expect(s.phase.kind).toBe("Recruit");
    const tier2Dragons = Object.values(MINIONS).filter(
      (m) => m.tribes.includes("Dragon") && m.tier === 2,
    );
    expect(tier2Dragons.length).toBeGreaterThan(0);
    const shopDragons = s.players[0]!.shop.filter(
      (m) => "tribes" in m && (m as { tribes: string[] }).tribes.includes("Dragon"),
    );
    for (const dragon of shopDragons) {
      const card = MINIONS[dragon.cardId];
      expect(card!.tier).toBe(2);
    }
  });

  it("does not add dragons for non-Ysera heroes", () => {
    const state = makeInitialState(42);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "stub_hero" }, makeRng(42));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(42));
    }
    const shopDragons = s.players[0]!.shop.filter(
      (m) => "tribes" in m && (m as { tribes: string[] }).tribes.includes("Dragon"),
    );
    expect(shopDragons.length).toBe(0);
  });

  it("adds a dragon from tier 3 when player is tier 3", () => {
    const state = makeInitialState(123);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "ysera" }, makeRng(123));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(123));
    }
    // Upgrade to tier 3
    s = {
      ...s,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, gold: 6, tier: 2, upgradeCost: 6, upgradedThisTurn: false } : p,
      ),
    };
    s = step(s, { kind: "UpgradeTier", player: 0 }, makeRng(123));
    s = step(s, { kind: "EndTurn", player: 0 }, makeRng(123));
    expect(s.phase.kind).toBe("Recruit");
    const tier3Dragons = Object.values(MINIONS).filter(
      (m) => m.tribes.includes("Dragon") && m.tier === 3,
    );
    expect(tier3Dragons.length).toBeGreaterThan(0);
    const shopDragons = s.players[0]!.shop.filter(
      (m) => "tribes" in m && (m as { tribes: string[] }).tribes.includes("Dragon"),
    );
    for (const dragon of shopDragons) {
      const card = MINIONS[dragon.cardId];
      expect(card!.tier).toBe(3);
    }
  });

  it("adds a dragon at tier 4 when player is tier 4", () => {
    const state = makeInitialState(200);
    let s = step(state, { kind: "SelectHero", player: 0, heroId: "ysera" }, makeRng(200));
    for (let i = 1; i < 8; i++) {
      s = step(s, { kind: "SelectHero", player: i, heroId: "stub_hero" }, makeRng(200));
    }
    // Upgrade to tier 4
    s = {
      ...s,
      players: s.players.map((p, i) =>
        i === 0 ? { ...p, gold: 8, tier: 3, upgradeCost: 8, upgradedThisTurn: false } : p,
      ),
    };
    s = step(s, { kind: "UpgradeTier", player: 0 }, makeRng(200));
    s = step(s, { kind: "EndTurn", player: 0 }, makeRng(200));
    expect(s.phase.kind).toBe("Recruit");
    const tier4Dragons = Object.values(MINIONS).filter(
      (m) => m.tribes.includes("Dragon") && m.tier === 4,
    );
    expect(tier4Dragons.length).toBeGreaterThan(0);
    const shopDragons = s.players[0]!.shop.filter(
      (m) => "tribes" in m && (m as { tribes: string[] }).tribes.includes("Dragon"),
    );
    for (const dragon of shopDragons) {
      const card = MINIONS[dragon.cardId];
      expect(card!.tier).toBe(4);
    }
  });
});
