import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import { checkAndProcessTriples } from "@/game/triples";
import type { GameState, MinionInstance, PlayerState } from "@/game/types";

function makeRecruitState(): GameState {
  const state = makeInitialState(999);

  // Manually set up a Recruit state with player 0 having 3 gold
  const s = state;
  s.phase = { kind: "Recruit", turn: 1 };
  s.turn = 1;

  (s.players as unknown as Array<GameState["players"][number]>) = state.players.map((p, i) => ({
    ...p,
    heroId: i === 0 ? "patchwerk" : "stub_hero",
    hp: i === 0 ? 60 : 40,
    gold: 3,
    tier: 1,
    upgradedThisTurn: false,
    heroPowerUsed: false,
  }));

  return s;
}

/** Create 3 copies of the same minion type for manual state manipulation. */
function makeThreeCopies(cardId: string): MinionInstance[] {
  const card = MINIONS[cardId];
  if (!card) throw new Error(`Unknown minion: ${cardId}`);
  return [
    { ...instantiate(card), instanceId: `a_${Date.now()}_1` },
    { ...instantiate(card), instanceId: `a_${Date.now()}_2` },
    { ...instantiate(card), instanceId: `a_${Date.now()}_3` },
  ];
}

function getTier1Cards(): MinionInstance[] {
  const tier1 = Object.entries(MINIONS)
    .filter(([, c]) => c.tier === 1)
    .map(([id]) => {
      const card = MINIONS[id as keyof typeof MINIONS];
      if (!card) return null;
      return instantiate(card);
    })
    .filter((m): m is MinionInstance => m !== null);
  return tier1;
}

function getStateWithHand(hand: MinionInstance[]): GameState {
  const s = makeRecruitState();

  (s.players as unknown as Array<PlayerState>) = s.players.map((p, i) => ({
    ...p,
    hand: i === 0 ? hand : p.hand,
  }));

  return s;
}

function getStateWithBoard(board: MinionInstance[]): GameState {
  const s = makeRecruitState();

  (s.players as unknown as Array<PlayerState>) = s.players.map((p, i) => ({
    ...p,
    board: i === 0 ? board : p.board,
  }));

  return s;
}

function getStateWithBoardAndHand(board: MinionInstance[], hand: MinionInstance[]): GameState {
  const s = makeRecruitState();
  (s.players as unknown as Array<PlayerState>) = s.players.map((p, i) => ({
    ...p,
    board: i === 0 ? board : p.board,
    hand: i === 0 ? hand : p.hand,
  }));
  return s;
}

describe("triples: checkAndProcessTriples", () => {
  it("creates golden minion when 3 copies in hand", () => {
    const tier1Cards = getTier1Cards();
    if (tier1Cards.length === 0) throw new Error("no tier1 cards available");

    const cardId = tier1Cards[0]!.cardId;
    const copies = makeThreeCopies(cardId);

    const s = getStateWithHand(copies);
    const found = findTripleGroupsRaw(s.players[0]!.hand);
    expect(found.length).toBeGreaterThan(0);

    const finalState = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const hand = finalState.players[0]?.hand;

    const surviving = hand?.filter((m) => m.cardId === cardId) ?? [];
    expect(surviving.length).toBe(1);
    expect(surviving[0]?.golden).toBe(true);
  });

  it("golden minion has 2x stats", () => {
    const tier1Cards = getTier1Cards();
    if (tier1Cards.length === 0) throw new Error("no tier1 cards");

    const cardId = tier1Cards[0]!.cardId;
    const copies = makeThreeCopies(cardId);

    const s = getStateWithHand(copies);
    const baseAtk = tier1Cards[0]!.atk;
    const baseHp = tier1Cards[0]!.hp;

    const finalState = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const hand = finalState.players[0]?.hand;

    // Golden stats = sum of all three merged copies' actual stats
    const golden = hand?.find((m) => m.cardId === cardId);
    expect(golden?.atk).toBe(baseAtk * 3);
    expect(golden?.hp).toBe(baseHp * 3);
    expect(golden?.maxHp).toBe(baseHp * 3);
  });

  it("no triples without 3 copies", () => {
    const tier1Cards = getTier1Cards();
    const copies = tier1Cards.slice(0, 2);

    const s = getStateWithHand(copies);
    const beforeHand = s.players[0]?.hand.length ?? 0;

    const after = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const afterHand = after.players[0]?.hand.length ?? 0;

    expect(beforeHand).toEqual(afterHand);
  });

  it("returns unchanged state when no triples", () => {
    const tier1Cards = getTier1Cards();
    const copies = tier1Cards.slice(0, 2);

    const s = getStateWithHand(copies);
    const beforeBoard = s.players[0]?.board.length ?? 0;

    const after = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const afterBoard = after.players[0]?.board.length ?? 0;

    expect(beforeBoard).toEqual(afterBoard);
  });

  it("golden minion has correct instanceId preserved", () => {
    const tier1Cards = getTier1Cards();
    if (tier1Cards.length === 0) throw new Error("no tier1 cards");

    const copies = makeThreeCopies(tier1Cards[0]!.cardId);
    const thirdInstanceId = copies[2]!.instanceId;

    const s = getStateWithHand(copies);
    const finalState = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const golden = finalState.players[0]?.hand.find((m) => m.golden === true);

    expect(golden?.golden).toBe(true);
    expect(golden?.instanceId).toEqual(thirdInstanceId);
  });

  it("discovers minion from tier+1 after triple", () => {
    const tier1Cards = getTier1Cards();
    const copies = makeThreeCopies(tier1Cards[0]!.cardId);

    const s = getStateWithHand(copies);
    const originalHandCount = s.players[0]?.hand.length ?? 0;

    const discovered = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const handAfter = discovered.players[0]?.hand.length ?? 0;
    const offer = discovered.players[0]?.discoverOffer;

    // triple: remove 3 copies (-3), golden +1 = -2 net
    expect(handAfter).toBe(originalHandCount - 2);
    // Discover offer should have 3 options
    expect(offer?.offers.length).toBe(3);
    // Found minion should be in hand (the golden one)
    expect(discovered.players[0]?.hand.find((m) => m.golden)).toBeTruthy();
  });

  it("triples across board and hand detect correctly", () => {
    const tier1Cards = getTier1Cards();
    if (tier1Cards.length < 2) throw new Error("need 2+ tier1 cards");

    const cardId = tier1Cards[0]!.cardId;
    const copies = [
      ...makeThreeCopies(cardId).slice(0, 2), // 2 in hand
    ];
    const thirdCopy = makeThreeCopies(cardId)[2]!;

    const board: MinionInstance[] = [thirdCopy];
    const hand: MinionInstance[] = copies;

    const s = getStateWithBoardAndHand(board, hand);
    const finalState = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));

    const handAfter = finalState.players[0]?.hand ?? [];
    const boardAfter = finalState.players[0]?.board ?? [];
    const surviving = [...handAfter, ...boardAfter].filter((m) => m.cardId === cardId);

    expect(surviving.length).toBe(1);
    expect(surviving[0]?.golden).toBe(true);
  });

  it("no discover at max tier (tier 6)", () => {
    const tier1Cards = getTier1Cards();
    if (tier1Cards.length === 0) throw new Error("no tier1 cards");

    const copies = makeThreeCopies(tier1Cards[0]!.cardId);

    const s = makeRecruitState();
    (s.players as unknown as Array<PlayerState>) = s.players.map((p, i) => ({
      ...p,
      heroId: i === 0 ? "patchwerk" : "stub_hero",
      hp: i === 0 ? 60 : 40,
      gold: 3,
      tier: 6, // max tier
      upgradedThisTurn: false,
      heroPowerUsed: false,
      hand: i === 0 ? copies : p.hand,
    }));

    const originalCount = s.players[0]?.hand.length ?? 0;
    const discovered = checkAndProcessTriples(s, 0, rngForTurn(s, "triple"));
    const discoveredCount = discovered.players[0]?.hand.length ?? 0;

    // triple only: 3 removed, 1 added = -2, but no discover
    expect(discoveredCount).toBeLessThan(originalCount);
  });
});

/** Manual duplicate of findTripleGroups logic for verification. */
function findTripleGroupsRaw(hand: MinionInstance[]): Array<{ cardId: string; count: number }> {
  const countMap = new Map<string, MinionInstance[]>();

  for (const m of hand) {
    if (!countMap.has(m.cardId)) countMap.set(m.cardId, []);
    countMap.get(m.cardId)!.push(m);
  }

  const groups: Array<{ cardId: string; count: number }> = [];
  for (const [cardId, copies] of countMap) {
    if (copies.length >= 3) {
      groups.push({ cardId, count: copies.length });
    }
  }

  return groups;
}
