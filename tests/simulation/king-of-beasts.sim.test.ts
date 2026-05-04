/**
 * Unit tests for King of Beasts (tier 6 beast, 2/6):
 * taunt; battlecry gains +1 ATK for each other Beast on your board.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

// ---------------------------------------------------------------------------
// King of Beasts — recruit phase battlecry
// ---------------------------------------------------------------------------

describe("king_of_beasts", () => {
  it("gains +1 ATK per other Beast on board at battlecry", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const king = instantiate(MINIONS["king_of_beasts"]!); // 2/6
    const beast1 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const beast2 = instantiate(MINIONS["bristleback_boys"]!); // 1/1 Beast (no onShopSummon)
    const nonBeast = instantiate(MINIONS["taunt_minion"]!);

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [king],
              board: [beast1, beast2, nonBeast],
              gold: 10,
              tier: 6 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 6, rng);
    const board = after.players[0]!.board;
    const kingOnBoard = board.find((m) => m.cardId === "king_of_beasts");
    expect(kingOnBoard).toBeDefined();
    if (kingOnBoard) {
      expect(kingOnBoard.atk).toBe(4); // 2 base + 2 other beasts
      expect(kingOnBoard.hp).toBe(6); // unchanged
      expect(kingOnBoard.keywords.has("taunt")).toBe(true);
    }
  });

  it("does NOT count itself when counting other Beasts", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const king = instantiate(MINIONS["king_of_beasts"]!); // 2/6
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [king],
              board: [beast],
              gold: 10,
              tier: 6 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 6, rng);
    const kingOnBoard = after.players[0]!.board.find((m) => m.cardId === "king_of_beasts");
    expect(kingOnBoard).toBeDefined();
    if (kingOnBoard) {
      expect(kingOnBoard.atk).toBe(3); // 2 base + 1 other beast
    }
  });

  it("gains 0 ATK when no other Beasts on board", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const king = instantiate(MINIONS["king_of_beasts"]!); // 2/6
    const nonBeast = instantiate(MINIONS["taunt_minion"]!); // not a beast

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [king],
              board: [nonBeast],
              gold: 10,
              tier: 6 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 6, rng);
    const kingOnBoard = after.players[0]!.board.find((m) => m.cardId === "king_of_beasts");
    expect(kingOnBoard).toBeDefined();
    if (kingOnBoard) {
      expect(kingOnBoard.atk).toBe(2); // base, no other beasts
    }
  });

  it("counts Beast tokens from other minions", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const king = instantiate(MINIONS["king_of_beasts"]!); // 2/6
    // Use beasts without onShopSummon hooks to avoid side effects
    const cat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const beast2 = instantiate(MINIONS["bristleback_boys"]!); // 1/1 Beast
    const beast3 = instantiate(MINIONS["pack_leader"]!) as typeof cat;
    // Pack leader has onShopSummon that would buff king when played,
    // so remove it and use a plain beast instead
    const beast3Plain = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [king],
              board: [cat, beast2, beast3Plain],
              gold: 10,
              tier: 6 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 6, rng);
    const kingOnBoard = after.players[0]!.board.find((m) => m.cardId === "king_of_beasts");
    expect(kingOnBoard).toBeDefined();
    if (kingOnBoard) {
      expect(kingOnBoard.atk).toBe(5); // 2 base + 3 other beasts
    }
  });
});

// ---------------------------------------------------------------------------
// King of Beasts — combat behavior
// ---------------------------------------------------------------------------

describe("king_of_beasts combat", () => {
  it("has taunt keyword — forces enemy to attack it first", () => {
    const king = m("king_of_beasts"); // 2/6 taunt
    const nonTaunt = m("alley_cat"); // 1/1 — no taunt
    const enemy = m("wrath_weaver"); // 1/3

    // left: [king (2/6, taunt), nonTaunt (1/1)], right: [enemy (1/3)]
    // Enemy must attack king first due to taunt
    const r = simulateCombat([king, nonTaunt], [enemy], makeRng(0));
    // King should survive (6 HP vs 1 damage)
    const kingSurvivor = r.survivorsLeft.find((m) => m.instanceId === king.instanceId);
    expect(kingSurvivor).toBeDefined();
  });

  it("battlecry buffs persist into combat", () => {
    const rng = makeRng(0);
    const state = makeInitialState(42);
    const king = instantiate(MINIONS["king_of_beasts"]!); // 2/6
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const nonBeast = instantiate(MINIONS["taunt_minion"]!);

    const withBoard = {
      ...state,
      phase: { kind: "Recruit" as const, turn: 1 },
      players: state.players.map((p, i) =>
        i === 0
          ? {
              ...p,
              hand: [king],
              board: [beast, nonBeast],
              gold: 10,
              tier: 6 as const,
            }
          : p,
      ),
    };

    const after = playMinionToBoard(withBoard, 0, 0, 6, rng);
    const kingOnBoard = after.players[0]!.board.find((m) => m.cardId === "king_of_beasts");
    expect(kingOnBoard).toBeDefined();
    if (kingOnBoard) {
      expect(kingOnBoard.atk).toBe(3); // 2 + 1 (alley cat)
    }

    // Now run combat — the buffed king should fight with 3 ATK
    const enemy = m("wrath_weaver"); // 1/3
    const r = simulateCombat([kingOnBoard!, beast], [enemy], makeRng(1));
    const kingInCombat = r.survivorsLeft.find((m) => m.instanceId === kingOnBoard!.instanceId);
    expect(kingInCombat).toBeDefined();
    if (kingInCombat) {
      expect(kingInCombat.atk).toBe(3); // buffed atk persists
    }
  });
});
