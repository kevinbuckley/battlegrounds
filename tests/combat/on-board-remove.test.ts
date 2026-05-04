import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number, hooks?: MinionInstance["hooks"]): MinionInstance {
  return instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: hooks || {},
  });
}

// ---------------------------------------------------------------------------
// onBoardRemove hook — fires when a minion is removed from the board during
// combat (e.g., death, deathrattle replacement)
// ---------------------------------------------------------------------------

describe("onBoardRemove hook", () => {
  it("fires onBoardRemove when a minion dies in combat", () => {
    let removeCount = 0;
    // This minion is on the RIGHT board and will die from combat
    const victim = makeMinion(1, 1);
    // Survivor on the LEFT board — should fire onBoardRemove when victim dies
    const attacker = makeMinion(3, 3, {
      onBoardRemove: () => {
        removeCount++;
      },
    });

    simulateCombat([attacker], [victim], makeRng(0));

    // Victim dies, so onBoardRemove fires on all surviving minions (attacker)
    expect(removeCount).toBe(1);
  });

  it("fires onBoardRemove on all surviving minions when one dies", () => {
    let fireCount = 0;
    // Two minions on right board — when one dies, both should fire onBoardRemove
    const victim = makeMinion(1, 1, {
      onBoardRemove: () => {
        fireCount++;
      },
    });
    const survivor = makeMinion(3, 3, {
      onBoardRemove: () => {
        fireCount++;
      },
    });
    const attacker = minion("flame_imp"); // 1/3

    simulateCombat([attacker], [victim, survivor], makeRng(0));

    // Both victim and survivor should fire onBoardRemove
    expect(fireCount).toBe(2);
  });

  it("fires onBoardRemove on surviving minions when one dies", () => {
    let removeCount = 0;
    // Victim is on the LEFT board and will die
    const victim = makeMinion(1, 1);
    // Survivor is on the RIGHT board — should fire onBoardRemove when victim dies
    const survivor = makeMinion(3, 3, {
      onBoardRemove: () => {
        removeCount++;
      },
    });

    simulateCombat([victim], [survivor], makeRng(0));

    // Victim dies, so onBoardRemove fires on all surviving minions (survivor)
    expect(removeCount).toBe(1);
  });

  it("fires onBoardRemove on all surviving minions when one dies", () => {
    let removeCount = 0;
    const minion1 = makeMinion(5, 5, {
      onBoardRemove: () => {
        removeCount++;
      },
    });
    const minion2 = makeMinion(1, 1);

    simulateCombat([minion1], [minion2], makeRng(0));

    // minion1 (5/5) kills minion2 (1/1), then takes 1 damage leaving 4 HP
    // minion2 dies, so onBoardRemove fires on all surviving minions (minion1)
    expect(removeCount).toBe(1);
  });
});
