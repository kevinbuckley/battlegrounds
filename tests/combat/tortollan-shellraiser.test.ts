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
// Tortollan Shellraiser — deathrattle gives a random friendly minion +1/+3
// ---------------------------------------------------------------------------

describe("tortollan shellraiser deathrattle", () => {
  it("gives a random friendly minion +1/+3 when it dies", () => {
    const shellraiser = minion("tortollan_shellraiser");
    const ally1 = makeMinion(3, 5);
    const ally2 = makeMinion(4, 6);
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([shellraiser, ally1, ally2], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    // Shellraiser dies (2/3 vs 3/3, takes 3 damage → 0 HP)
    const shellraiserAlive = r.survivorsLeft.find((m) => m.cardId === "tortollan_shellraiser");
    expect(shellraiserAlive).toBeUndefined();

    // One ally was buffed by deathrattle (+1/+3), the other was not
    // ally1 (3/5) → buffed to 4/8, then took 3 counterattack → 4/5
    // ally2 (4/6) → not buffed, stays 4/6
    const buffed = r.survivorsLeft.find(
      (m) => m.cardId === `custom_3_5` && m.atk === 4 && m.hp === 5,
    );
    const unbuffed = r.survivorsLeft.find(
      (m) => m.cardId === `custom_4_6` && m.atk === 4 && m.hp === 6,
    );
    expect(buffed).toBeDefined();
    expect(unbuffed).toBeDefined();
  });

  it("gives +1/+3 to the only other ally when shellraiser dies", () => {
    const shellraiser = minion("tortollan_shellraiser");
    const ally = makeMinion(5, 10);
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([shellraiser, ally], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    // Shellraiser dies (2/3 vs 3/3, takes 3 → 0 HP)
    const shellraiserAlive = r.survivorsLeft.find((m) => m.cardId === "tortollan_shellraiser");
    expect(shellraiserAlive).toBeUndefined();
    // Ally was buffed by deathrattle (5/10 → 6/13), then took 3 counterattack → 6/10
    const allySurvivor = r.survivorsLeft.find((m) => m.cardId === `custom_5_10`);
    expect(allySurvivor).toBeDefined();
    expect(allySurvivor!.atk).toBe(6);
    expect(allySurvivor!.hp).toBe(10);
  });

  it("does nothing when no other friendly minions exist", () => {
    const shellraiser = minion("tortollan_shellraiser");
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([shellraiser], [enemy], makeRng(0));

    // Shellraiser dies (2/3 vs 3/3, takes 3 → 0 HP), deathrattle fires but no ally to buff
    // Enemy survives at 3/1
    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(1);
    expect(r.survivorsRight[0]!.hp).toBe(1);
  });

  it("taunt keyword is present", () => {
    const card = getMinion("tortollan_shellraiser");
    expect(card.baseAtk).toBe(2);
    expect(card.baseHp).toBe(3);
    const shellraiser = minion("tortollan_shellraiser");
    expect(shellraiser.keywords.has("taunt")).toBe(true);
    expect(shellraiser.tribes).toEqual(["Elemental"]);
  });
});
