import { describe, expect, it } from "vitest";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion, MINIONS } from "@/game/minions/index";
import { makeInitialState, step } from "@/game/state";
import type { GameState, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeDiscoverState(
  boardMinions: MinionInstance[],
  offers: Array<{ minion: MinionInstance; offerId: string }>,
): GameState {
  const state = makeInitialState(42);
  return {
    ...state,
    phase: { kind: "Recruit", turn: 5 },
    turn: 5,
    players: state.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            board: boardMinions,
            hand: [],
            gold: 10,
            tier: 5,
            discoverOffer: { offers },
          }
        : p,
    ),
  };
}

describe("onDiscover hook", () => {
  it("fires onDiscover when a minion is picked from a discover offer", () => {
    let firedMinion: MinionInstance | null = null;
    let firedIndex = -1;

    const discoverReacting = defineMinion({
      id: "discover_tester",
      name: "Discover Tester",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDiscover: ({ self, state: _state, offers, chosenIndex }) => {
          firedMinion = offers[chosenIndex]?.minion ?? null;
          firedIndex = chosenIndex;
          return _state;
        },
      },
    });
    MINIONS[discoverReacting.id] = discoverReacting;

    try {
      const tester = instantiate(discoverReacting);
      const offerMinion = getMinion("murloc_tidehunter");
      const instance = instantiate(offerMinion);
      const state = makeDiscoverState([tester], [{ minion: instance, offerId: "offer_1" }]);

      const result = step(state, { kind: "PickDiscover", player: 0, index: 0 }, makeRng(0));

      expect(firedMinion).not.toBeNull();
      expect(firedMinion!.cardId).toBe("murloc_tidehunter");
      expect(firedIndex).toBe(0);

      // Verify the minion was added to hand
      expect(result.players[0]!.hand.length).toBe(1);
      expect(result.players[0]!.hand[0]!.cardId).toBe("murloc_tidehunter");
    } finally {
      delete MINIONS[discoverReacting.id];
    }
  });

  it("fires onDiscover for all board minions when one is picked", () => {
    let fireCount = 0;

    const makeTester = (id: string) =>
      defineMinion({
        id,
        name: id,
        tier: 1,
        tribes: [],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
        spellDamage: 0,
        hooks: {
          onDiscover: ({ state: _state }) => {
            fireCount++;
            return _state;
          },
        },
      });

    const tester1 = makeTester("discover_tester_1");
    const tester2 = makeTester("discover_tester_2");
    MINIONS[tester1.id] = tester1;
    MINIONS[tester2.id] = tester2;

    try {
      const t1 = instantiate(tester1);
      const t2 = instantiate(tester2);
      const offerMinion = getMinion("murloc_tidehunter");
      const instance = instantiate(offerMinion);
      const state = makeDiscoverState([t1, t2], [{ minion: instance, offerId: "offer_1" }]);

      step(state, { kind: "PickDiscover", player: 0, index: 0 }, makeRng(0));

      expect(fireCount).toBe(2);
    } finally {
      delete MINIONS[tester1.id];
      delete MINIONS[tester2.id];
    }
  });

  it("onDiscover does NOT fire when discover is dismissed", () => {
    let fired = false;

    const dismissTester = defineMinion({
      id: "dismiss_tester",
      name: "Dismiss Tester",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDiscover: ({ state: _state }) => {
          fired = true;
          return _state;
        },
      },
    });
    MINIONS[dismissTester.id] = dismissTester;

    try {
      const tester = instantiate(dismissTester);
      const state = makeDiscoverState(
        [tester],
        [
          {
            minion: instantiate(getMinion("murloc_tidehunter")),
            offerId: "offer_1",
          },
        ],
      );

      step(state, { kind: "DismissDiscover", player: 0 }, makeRng(0));

      expect(fired).toBe(false);
    } finally {
      delete MINIONS[dismissTester.id];
    }
  });

  it("onDiscover receives correct offers array with all available options", () => {
    let receivedOffers: Array<{ minion: MinionInstance; offerId: string }> | null = null;

    const offerTracker = defineMinion({
      id: "offer_tracker",
      name: "Offer Tracker",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDiscover: ({ offers, state: _state }) => {
          receivedOffers = offers;
          return _state;
        },
      },
    });
    MINIONS[offerTracker.id] = offerTracker;

    try {
      const tracker = instantiate(offerTracker);
      const tidehunter = instantiate(getMinion("murloc_tidehunter"));
      const tinyfin = instantiate(getMinion("murloc_tinyfin"));
      const warleader = instantiate(getMinion("murloc_warleader"));
      const state = makeDiscoverState(
        [tracker],
        [
          { minion: tidehunter, offerId: "offer_1" },
          { minion: tinyfin, offerId: "offer_2" },
          { minion: warleader, offerId: "offer_3" },
        ],
      );

      step(state, { kind: "PickDiscover", player: 0, index: 1 }, makeRng(0));

      expect(receivedOffers).not.toBeNull();
      expect(receivedOffers!.length).toBe(3);
      expect(receivedOffers![0]!.minion.cardId).toBe("murloc_tidehunter");
      expect(receivedOffers![1]!.minion.cardId).toBe("murloc_tinyfin");
      expect(receivedOffers![2]!.minion.cardId).toBe("murloc_warleader");
    } finally {
      delete MINIONS[offerTracker.id];
    }
  });
});
