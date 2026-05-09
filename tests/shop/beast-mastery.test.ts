import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { beastMastery } from "@/game/quests";
import { sellMinion } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import type { GameState } from "@/game/types";
import { makeRng } from "@/lib/rng";

const rng = makeRng(0);

function makeTestState(
  board: ReturnType<typeof instantiate>[],
  quests: {
    cardId: string;
    progress: number;
    target: number;
    completed: boolean;
    attachments?: Record<string, unknown>;
  }[],
): GameState {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 1,
            board,
            shop: [],
            hand: [],
            quests: quests.map((q) => ({
              instanceId: `quest_${i}`,
              ...q,
            })),
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Beast Mastery Quest — sell 4 Beasts from board → +2/+2 to all friendly Beasts
// ---------------------------------------------------------------------------

describe("beast mastery quest — onProgress", () => {
  it("tracks Beast sales and increments progress", () => {
    const alleyCat1 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const alleyCat2 = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast (second copy)
    const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1 non-Beast

    const state = makeTestState(
      [alleyCat1, alleyCat2, murlocScout],
      [{ cardId: "beast_mastery", progress: 0, target: 4, completed: false, attachments: {} }],
    );

    // Sell alleyCat1 (Beast) → board index 0
    const afterSell1 = sellMinion(state, 0, 0);
    const quest1 = afterSell1.players[0]!.quests[0]!;
    expect((quest1.attachments as { beastsSold?: number })?.beastsSold).toBe(1);

    // Sell alleyCat2 (Beast) → board index 0 (murloc shifted down)
    const afterSell2 = sellMinion(afterSell1, 0, 0);
    const quest2 = afterSell2.players[0]!.quests[0]!;
    expect((quest2.attachments as { beastsSold?: number })?.beastsSold).toBe(2);

    // Sell murloc (non-Beast) → should NOT increment beastsSold
    const afterSell3 = sellMinion(afterSell2, 0, 0);
    const quest3 = afterSell3.players[0]!.quests[0]!;
    expect((quest3.attachments as { beastsSold?: number })?.beastsSold).toBe(2);
  });

  it("increments quest progress on beginRecruitTurn when beastsSold > 0", () => {
    const alleyCat1 = instantiate(MINIONS["alley_cat"]!);
    const alleyCat2 = instantiate(MINIONS["alley_cat"]!);
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = makeTestState(
      [alleyCat1, alleyCat2, murlocScout],
      [{ cardId: "beast_mastery", progress: 0, target: 4, completed: false, attachments: {} }],
    );

    // Sell 2 Beasts
    const afterSell1 = sellMinion(state, 0, 0);
    const afterSell2 = sellMinion(afterSell1, 0, 0);

    // Now call onProgress (simulating beginRecruitTurn)
    const afterProgress = beastMastery.onProgress(afterSell2, 0, rng);
    const quest = afterProgress.players[0]!.quests[0]!;
    expect(quest.progress).toBe(2);
    // beastsSold should be reset to 0 after progress is applied
    expect((quest.attachments as { beastsSold?: number })?.beastsSold).toBe(0);
  });

  it("does not increment progress when no Beasts sold", () => {
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = makeTestState(
      [murlocScout],
      [{ cardId: "beast_mastery", progress: 0, target: 4, completed: false, attachments: {} }],
    );

    const afterProgress = beastMastery.onProgress(state, 0, rng);
    const quest = afterProgress.players[0]!.quests[0]!;
    expect(quest.progress).toBe(0);
  });
});

describe("beast mastery quest — isComplete", () => {
  it("returns true when progress >= target", () => {
    const state = makeTestState(
      [],
      [{ cardId: "beast_mastery", progress: 4, target: 4, completed: false, attachments: {} }],
    );
    expect(beastMastery.isComplete(state, 0)).toBe(true);
  });

  it("returns false when progress < target", () => {
    const state = makeTestState(
      [],
      [{ cardId: "beast_mastery", progress: 2, target: 4, completed: false, attachments: {} }],
    );
    expect(beastMastery.isComplete(state, 0)).toBe(false);
  });
});

describe("beast mastery quest — onReward", () => {
  it("gives all friendly Beasts +2/+2 on board", () => {
    const alleyCat = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const murlocScout = instantiate(MINIONS["murloc_scout"]!); // 1/1 non-Beast

    const state = makeTestState(
      [alleyCat, murlocScout],
      [{ cardId: "beast_mastery", progress: 4, target: 4, completed: true, attachments: {} }],
    );

    const afterReward = beastMastery.onReward(state, 0, rng);
    const board = afterReward.players[0]!.board;
    expect(board).toHaveLength(2);

    // Beast should be buffed
    const beast = board.find((m) => m.tribes.includes("Beast"));
    expect(beast).toBeDefined();
    expect(beast!.atk).toBe(3); // 1 + 2
    expect(beast!.hp).toBe(3); // 1 + 2
    expect(beast!.maxHp).toBe(3);

    // Non-Beast should be unchanged
    const nonBeast = board.find((m) => !m.tribes.includes("Beast"));
    expect(nonBeast).toBeDefined();
    expect(nonBeast!.atk).toBe(1);
    expect(nonBeast!.hp).toBe(1);
  });

  it("does nothing when no Beasts on board", () => {
    const murlocScout = instantiate(MINIONS["murloc_scout"]!);

    const state = makeTestState(
      [murlocScout],
      [{ cardId: "beast_mastery", progress: 4, target: 4, completed: true, attachments: {} }],
    );

    const afterReward = beastMastery.onReward(state, 0, rng);
    expect(afterReward.players[0]!.board[0]!.atk).toBe(1);
    expect(afterReward.players[0]!.board[0]!.hp).toBe(1);
  });
});
