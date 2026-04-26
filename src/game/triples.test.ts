import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import { makeInitialState } from "./state";
import { checkAndProcessTriples } from "./triples";
import type { GameState, MinionInstance, Tier } from "./types";

const RNG = makeRng(42);

function makeState(
  board: MinionInstance[] = [],
  hand: MinionInstance[] = [],
  tier: number = 1,
): GameState {
  const state = makeInitialState(99);
  return {
    ...state,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: state.players.map((p, i) =>
      i === 0 ? { ...p, tier: tier as Tier, board, hand, shop: [] } : p,
    ),
  };
}

describe("triples detection", () => {
  it("returns no triples when no minion appears 3 times", () => {
    const m1 = instantiate(MINIONS["alley_cat"]!);
    const m2 = instantiate(MINIONS["alley_cat"]!);
    const state = makeState([], [m1, m2]);

    const result = checkAndProcessTriples(state, 0, RNG);
    expect(result.players[0]!.discoverOffer).toBeNull();
    expect(result.players[0]!.hand).toHaveLength(2);
  });

  it("creates a golden when 3 identical copies exist in hand", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState([], copies);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;

    // Golden should be on hand (where the 3 originals were)
    expect(player.hand.length).toBe(1);
    const golden = player.hand[0]!;
    expect(golden.golden).toBe(true);
    expect(golden.atk).toBe(baseCard.baseAtk * 2);
    expect(golden.hp).toBe(baseCard.baseHp * 2);
    expect(golden.maxHp).toBe(baseCard.baseHp * 2);
  });

  it("creates a golden when 3 identical copies exist on board", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState(copies, []);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;

    expect(player.board.length).toBe(1);
    const golden = player.board[0]!;
    expect(golden.golden).toBe(true);
    expect(golden.atk).toBe(baseCard.baseAtk * 2);
    expect(golden.hp).toBe(baseCard.baseHp * 2);
  });

  it("detects triples across board and hand (1 on board + 2 in hand)", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const boardCopy: MinionInstance = instantiate(baseCard);
    const handCopies: MinionInstance[] = [instantiate(baseCard), instantiate(baseCard)];
    const state = makeState([boardCopy], handCopies);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;

    // Combined board+hand has 1 minion (the golden)
    expect(player.board.length + player.hand.length).toBe(1);
    const golden = [...player.board, ...player.hand].find((m) => m.golden === true);
    expect(golden).toBeDefined();
    expect(golden!.atk).toBe(baseCard.baseAtk * 2);
    expect(golden!.hp).toBe(baseCard.baseHp * 2);
  });

  it("detects triples across board and hand (2 on board + 1 in hand)", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const boardCopies: MinionInstance[] = [instantiate(baseCard), instantiate(baseCard)];
    const handCopy: MinionInstance = instantiate(baseCard);
    const state = makeState(boardCopies, [handCopy]);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;

    expect(player.board.length + player.hand.length).toBe(1);
    const golden = [...player.board, ...player.hand].find((m) => m.golden === true);
    expect(golden).toBeDefined();
    expect(golden!.atk).toBe(baseCard.baseAtk * 2);
    expect(golden!.hp).toBe(baseCard.baseHp * 2);
  });
});

describe("triples discovery", () => {
  it("offers discover options when at tier below 6", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState(copies, []);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;
    expect(player.discoverOffer).not.toBeNull();
    expect(player.discoverOffer!.offers.length).toBe(3);
    expect(player.discoverOffer!.title).toBeTruthy();
  });

  it("does not offer discover when at tier 6", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState(copies, [], 6);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;
    expect(player.discoverOffer).toBeNull();
  });

  it("golden minion has correct keywords from base card", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState(copies, []);

    const result = checkAndProcessTriples(state, 0, RNG);
    const golden = result.players[0]!.board[0]!;
    for (const kw of baseCard.baseKeywords) {
      expect(golden.keywords.has(kw)).toBe(true);
    }
  });

  it("golden minion has correct tribes from base card", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState(copies, []);

    const result = checkAndProcessTriples(state, 0, RNG);
    const golden = result.players[0]!.board[0]!;
    for (const tribe of baseCard.tribes) {
      expect(golden.tribes).toContain(tribe);
    }
  });
});

describe("triples idempotency", () => {
  it("does not double-trigger on the golden minion", () => {
    const baseCard = MINIONS["alley_cat"]!;
    const copies: MinionInstance[] = [
      instantiate(baseCard),
      instantiate(baseCard),
      instantiate(baseCard),
    ];
    const state = makeState(copies, []);

    const firstPass = checkAndProcessTriples(state, 0, RNG);
    const resultAfter = checkAndProcessTriples(firstPass, 0, RNG);

    const goldenCount =
      resultAfter.players[0]!.board.filter((m) => m.golden === true).length +
      resultAfter.players[0]!.hand.filter((m) => m.golden === true).length;
    expect(goldenCount).toBe(1);
  });

  it("handles multiple triple groups simultaneously", () => {
    const alleyCard = MINIONS["alley_cat"]!;
    const dragonCard = MINIONS["dragonspawn_lieutenant"]!;
    const copies1: MinionInstance[] = [
      instantiate(alleyCard),
      instantiate(alleyCard),
      instantiate(alleyCard),
    ];
    const copies2: MinionInstance[] = [
      instantiate(dragonCard),
      instantiate(dragonCard),
      instantiate(dragonCard),
    ];
    const state = makeState([...copies1, ...copies2], []);

    const result = checkAndProcessTriples(state, 0, RNG);
    const player = result.players[0]!;
    const goldenCount =
      player.board.filter((m) => m.golden === true).length +
      player.hand.filter((m) => m.golden === true).length;
    expect(goldenCount).toBe(2);
    expect(player.board.length + player.hand.length).toBe(2);
  });

  it("golden at position 0 does not shift next golden incorrectly", () => {
    const alleyCard = MINIONS["alley_cat"]!;
    const dragonCard = MINIONS["dragonspawn_lieutenant"]!;
    const copies1: MinionInstance[] = [
      instantiate(alleyCard),
      instantiate(alleyCard),
      instantiate(alleyCard),
    ];
    const copies2: MinionInstance[] = [
      instantiate(dragonCard),
      instantiate(dragonCard),
      instantiate(dragonCard),
    ];
    const state = makeState([...copies1, ...copies2], []);

    const result = checkAndProcessTriples(state, 0, RNG);
    const board = result.players[0]!.board;
    const golden0 = board[0];
    const golden1 = board[1];
    expect(golden0!.cardId).toBeDefined();
    expect(golden1!.cardId).toBeDefined();
    expect(golden0!.atk > 0).toBe(true);
    expect(golden1!.atk > 0).toBe(true);
  });
});
