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
  enemyBoardMinions: ReturnType<typeof instantiate>[],
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
        : i === 1
          ? {
              ...p,
              board: enemyBoardMinions,
            }
          : p,
    ),
  };
}

// ---------------------------------------------------------------------------
// Murozond — battlecry copies a random enemy minion into your hand
// ---------------------------------------------------------------------------

describe("murozond — battlecry", () => {
  it("copies a random enemy minion into hand when played", () => {
    const enemyMinion = instantiate(MINIONS["voidlord"]!); // 3/9 Demon taunt
    const murozond = instantiate(MINIONS["murozond"]!); // 4/5 Dragon

    const state = makeTestState([murozond], [], [], [enemyMinion]);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    // Murozond should be on the board
    const playedMurozond = afterPlay.players[0]!.board.find(
      (m) => m.instanceId === murozond.instanceId,
    );
    expect(playedMurozond).toBeDefined();

    // A copy of the enemy minion should be in hand
    const copiedMinion = afterPlay.players[0]!.hand.find((m) => m.cardId === enemyMinion.cardId);
    expect(copiedMinion).toBeDefined();
    expect(copiedMinion!.baseAtk).toBe(enemyMinion.baseAtk);
    expect(copiedMinion!.baseHp).toBe(enemyMinion.baseHp);
  });

  it("throws when no enemy minions exist", () => {
    const murozond = instantiate(MINIONS["murozond"]!);

    const state = makeTestState([murozond], [], [], []);

    // Murozond tries to pick from empty enemyMinions array → throws
    expect(() => playMinionToBoard(state, 0, 0, 0, RNG)).toThrow("pick from empty array");
  });

  it("copies from any enemy player's board", () => {
    const enemy1Minion = instantiate(MINIONS["voidlord"]!); // 3/9
    const enemy2Minion = instantiate(MINIONS["dreadscale"]!); // 2/3
    const murozond = instantiate(MINIONS["murozond"]!);

    const state = makeTestState([murozond], [], [], [enemy1Minion]);

    // Manually add a second enemy with a minion
    const stateWithTwoEnemies = {
      ...state,
      players: [
        state.players[0]!,
        state.players[1]!,
        {
          ...state.players[2]!,
          board: [enemy2Minion],
        },
      ],
    };

    const afterPlay = playMinionToBoard(stateWithTwoEnemies, 0, 0, 0, RNG);

    // A copy of one of the enemy minions should be in hand
    const copiedMinion = afterPlay.players[0]!.hand.find(
      (m) => m.cardId === "voidlord" || m.cardId === "dreadscale",
    );
    expect(copiedMinion).toBeDefined();
  });

  it("copies dead enemy minions? No — only alive ones", () => {
    const deadMinion = { ...instantiate(MINIONS["voidlord"]!), hp: 0 }; // dead
    const aliveMinion = instantiate(MINIONS["dreadscale"]!); // 2/3
    const murozond = instantiate(MINIONS["murozond"]!);

    const state = makeTestState([murozond], [], [], [deadMinion, aliveMinion]);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    // Only the alive minion should be copied (dead ones are filtered)
    const copiedMinion = afterPlay.players[0]!.hand.find((m) => m.cardId === "dreadscale");
    expect(copiedMinion).toBeDefined();
  });

  it("golden murozond copies enemy minion (battlecry fires twice)", () => {
    const murozond = instantiate(MINIONS["murozond"]!);
    murozond.golden = true;
    const enemyMinion = instantiate(MINIONS["voidlord"]!);

    const state = makeTestState([murozond], [], [], [enemyMinion]);

    const afterPlay = playMinionToBoard(state, 0, 0, 0, RNG);

    // Golden = 2 battlecry triggers → 2 copies of the enemy minion
    const copiedMinions = afterPlay.players[0]!.hand.filter((m) => m.cardId === "voidlord");
    expect(copiedMinions).toHaveLength(2);
  });
});
