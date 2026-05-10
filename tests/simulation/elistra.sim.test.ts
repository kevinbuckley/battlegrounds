import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function plain(atk: number, hp: number) {
  return instantiate(
    defineMinion({
      id: `plain_${atk}_${hp}_elistra`,
      name: `${atk}/${hp}`,
      tier: 1,
      tribes: [],
      baseAtk: atk,
      baseHp: hp,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {} as never,
    }),
  );
}

describe("elistra the immortal — reborn", () => {
  it("returns as 1/1 with reborn removed after dying", () => {
    // turn=1 → Elistra (left) attacks first
    // Elistra (8/8) attacks plain (9/1): plain takes 8 → dead; Elistra takes 9 → dead → reborn → 1/1
    const elistra = instantiate(getMinion("elistra_the_immortal")); // 8/8 Dragon reborn
    const enemy = plain(9, 1);

    const r = simulateCombat([elistra], [enemy], makeRng(0), undefined, 1);

    expect(r.winner).toBe("left");
    const returned = r.survivorsLeft.find((m) => m.cardId === "elistra_the_immortal");
    expect(returned).toBeDefined();
    expect(returned!.hp).toBe(1);
    expect(returned!.atk).toBe(1);
    expect(returned!.keywords.has("reborn")).toBe(false);
  });

  it("reborn version can die again (no second reborn)", () => {
    // Elistra (8/8) vs [9/1, 10/100]
    // turn=1: Elistra attacks e1 (9/1) → e1 dies, Elistra dies → reborts 1/1
    // turn=2: e2 (10/100) attacks 1/1 Elistra → Elistra takes 10 → dead, no reborn; e2 takes 1 → 10/99
    // right wins with e2 (10/99)
    const elistra = instantiate(getMinion("elistra_the_immortal"));
    const e1 = plain(9, 1);
    const e2 = plain(10, 100);

    const r = simulateCombat([elistra], [e1, e2], makeRng(0), undefined, 1);

    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
  });

  it("is a Dragon tribe", () => {
    const elistra = instantiate(getMinion("elistra_the_immortal"));
    expect(elistra.tribes).toContain("Dragon");
  });

  it("golden Elistra still reborts once (reborn is not doubled by golden)", () => {
    // Golden doubles deathrattles but reborn is guarded by rebornUsed — fires once only
    const elistra = instantiate(getMinion("elistra_the_immortal"));
    elistra.golden = true;
    const enemy = plain(9, 1);

    const r = simulateCombat([elistra], [enemy], makeRng(0), undefined, 1);

    // Same as non-golden: kills enemy, reborts to 1/1
    expect(r.winner).toBe("left");
    const returned = r.survivorsLeft.find((m) => m.cardId === "elistra_the_immortal");
    expect(returned).toBeDefined();
    expect(returned!.hp).toBe(1);
    expect(returned!.keywords.has("reborn")).toBe(false);
  });
});
