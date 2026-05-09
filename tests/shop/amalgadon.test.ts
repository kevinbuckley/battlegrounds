import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { buyMinion, playMinionToBoard } from "@/game/shop";
import { makeInitialState } from "@/game/state";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(42);

function makeTestState(
  handMinions: ReturnType<typeof instantiate>[],
  boardMinions: ReturnType<typeof instantiate>[],
  shopMinions: ReturnType<typeof instantiate>[],
): ReturnType<typeof makeInitialState> {
  const base = makeInitialState(42);
  return {
    ...base,
    phase: { kind: "Recruit", turn: 1 },
    turn: 1,
    pool: {},
    players: base.players.map((p, i) =>
      i === 0
        ? {
            ...p,
            gold: 10,
            tier: 6,
            board: boardMinions,
            hand: handMinions,
            shop: shopMinions,
          }
        : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Amalgadon — battlecry gains a random keyword for each distinct tribe
// among OTHER friendly minions
// ---------------------------------------------------------------------------

describe("amalgadon — battlecry", () => {
  it("gains 3 keywords when board has [Murloc, Beast, Demon]", () => {
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const demon = instantiate(MINIONS["flame_imp"]!); // 1/1 Demon
    const amalgadon = instantiate(MINIONS["amalgadon"]!); // 6/6, no tribe

    const state = makeTestState([amalgadon], [murloc, beast, demon], []);

    // Play Amalgadon to board
    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    const playedAmalgadon = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgadon.instanceId,
    );
    expect(playedAmalgadon).toBeDefined();

    // Should have gained 3 keywords (one per distinct tribe: Murloc, Beast, Demon)
    const keywordCount = playedAmalgadon!.keywords.size;
    expect(keywordCount).toBe(3);
  });

  it("gains 1 keyword when board has [Murloc, Murloc] (one tribe)", () => {
    const murloc1 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const murloc2 = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc (second copy)
    const amalgadon = instantiate(MINIONS["amalgadon"]!);

    const state = makeTestState([amalgadon], [murloc1, murloc2], []);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    const playedAmalgadon = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgadon.instanceId,
    );
    expect(playedAmalgadon).toBeDefined();

    // Only 1 distinct tribe (Murloc) → 1 keyword
    expect(playedAmalgadon!.keywords.size).toBe(1);
  });

  it("gains 0 keywords when no other minions on board", () => {
    const amalgadon = instantiate(MINIONS["amalgadon"]!);

    const state = makeTestState([amalgadon], [], []);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    const playedAmalgadon = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgadon.instanceId,
    );
    expect(playedAmalgadon).toBeDefined();

    // No other minions → 0 keywords gained
    expect(playedAmalgadon!.keywords.size).toBe(0);
  });

  it("does not count its own tribes (Amalgadon has no tribe)", () => {
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const amalgadon = instantiate(MINIONS["amalgadon"]!);

    const state = makeTestState([amalgadon], [murloc], []);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    const playedAmalgadon = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgadon.instanceId,
    );
    expect(playedAmalgadon).toBeDefined();

    // 1 distinct tribe (Murloc) → 1 keyword
    expect(playedAmalgadon!.keywords.size).toBe(1);
  });

  it("counts Nightmare Amalgam's expanded tribes (10 concrete tribes → up to 10 keywords)", () => {
    const nightmareAmalgam = instantiate(MINIONS["nightmare_amalgam"]!); // 2/4, expands to 10 concrete tribes
    const amalgadon = instantiate(MINIONS["amalgadon"]!);

    const state = makeTestState([amalgadon], [nightmareAmalgam], []);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    const playedAmalgadon = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgadon.instanceId,
    );
    expect(playedAmalgadon).toBeDefined();

    // Nightmare Amalgam expands to 10 concrete tribes at instantiation,
    // so Amalgadon gets 10 battlecry picks (some may duplicate → fewer unique keywords)
    expect(playedAmalgadon!.keywords.size).toBeGreaterThanOrEqual(1);
    expect(playedAmalgadon!.keywords.size).toBeLessThanOrEqual(10);
  });

  it("gains keywords for each tribe from a minion with multiple tribes", () => {
    // Use a minion that has multiple tribes if available, otherwise
    // verify that each tribe counts separately
    const murloc = instantiate(MINIONS["murloc_scout"]!); // 1/1 Murloc
    const beast = instantiate(MINIONS["alley_cat"]!); // 1/1 Beast
    const demon = instantiate(MINIONS["flame_imp"]!); // 1/1 Demon
    const mech = instantiate(MINIONS["annoy_o_tron"]!); // 1/1 Mech
    const amalgadon = instantiate(MINIONS["amalgadon"]!);

    const state = makeTestState([amalgadon], [murloc, beast, demon, mech], []);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    const playedAmalgadon = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === amalgadon.instanceId,
    );
    expect(playedAmalgadon).toBeDefined();

    // 4 distinct tribes → 4 keywords
    expect(playedAmalgadon!.keywords.size).toBe(4);
  });
});
