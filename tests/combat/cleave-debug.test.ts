import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number): MinionInstance {
  return instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// Cleave — hits exactly the defender and the two adjacent friendlies on
// the ENEMY board, not all friendlies on either board.
// ---------------------------------------------------------------------------

describe("cleave hits exactly adjacent minions", () => {
  it("debug transcript: cleave hits defender and adjacent enemies", () => {
    const cleaveMinion = minion("wrath_weaver");
    const ally1 = makeMinion(5, 10);
    const ally2 = makeMinion(5, 10);
    const enemy1 = makeMinion(3, 3);
    const enemy2 = makeMinion(3, 3);
    const enemy3 = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion, ally1, ally2], [enemy1, enemy2, enemy3], makeRng(0));

    console.log("=== TRANSCRIPT ===");
    for (const event of r.transcript) {
      console.log(JSON.stringify(event));
    }
    console.log("=== SURVIVORS LEFT ===");
    for (const m of r.survivorsLeft) {
      console.log(`${m.cardId} ${m.atk}/${m.hp}`);
    }
    console.log("=== SURVIVORS RIGHT ===");
    for (const m of r.survivorsRight) {
      console.log(`${m.cardId} ${m.atk}/${m.hp}`);
    }

    expect(r.winner).toBe("left");
  });

  it("debug transcript: single minion vs single enemy", () => {
    const cleaveMinion = minion("wrath_weaver");
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([cleaveMinion], [enemy], makeRng(0));

    console.log("=== TRANSCRIPT ===");
    for (const event of r.transcript) {
      console.log(JSON.stringify(event));
    }
    console.log("=== SURVIVORS LEFT ===");
    for (const m of r.survivorsLeft) {
      console.log(`${m.cardId} ${m.atk}/${m.hp}`);
    }
    console.log("=== SURVIVORS RIGHT ===");
    for (const m of r.survivorsRight) {
      console.log(`${m.cardId} ${m.atk}/${m.hp}`);
    }

    expect(r.winner).toBe("draw");
  });
});
