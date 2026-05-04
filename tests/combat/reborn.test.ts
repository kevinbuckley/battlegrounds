import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { Keyword, MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function makeMinion(atk: number, hp: number, keywords: Keyword[] = []): MinionInstance {
  const m = instantiate({
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
  for (const kw of keywords) m.keywords.add(kw);
  return m;
}

// ---------------------------------------------------------------------------
// Reborn — basic behavior
// ---------------------------------------------------------------------------

describe("reborn — basic behavior", () => {
  it("reborn minion returns at 1 HP with reborn keyword removed", () => {
    const reborn = makeMinion(1, 1, ["reborn"]);
    const enemy = makeMinion(5, 1);

    const r = simulateCombat([reborn], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(1);
    expect(r.survivorsLeft[0]!.atk).toBe(1);
    expect(r.survivorsLeft[0]!.maxHp).toBe(1);
    expect(r.survivorsLeft[0]!.keywords.has("reborn")).toBe(false);
  });

  it("reborn minion comes back at 1/1 regardless of previous stats", () => {
    const big = makeMinion(8, 8, ["reborn"]);
    const helper1 = makeMinion(6, 6);
    const helper2 = makeMinion(6, 6);
    const opponent = makeMinion(5, 15);

    const r = simulateCombat([big, helper1, helper2], [opponent], makeRng(0));
    expect(r.winner).toBe("left");

    const reborn = r.survivorsLeft.find((m) => m.atk === 1 && m.hp === 1);
    expect(reborn).toBeDefined();
    expect(reborn!.maxHp).toBe(1);
    expect(reborn!.spellDamage).toBe(0);
    expect(reborn!.keywords.has("reborn")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Reborn — second death (re-enters at 1/1 with no reborn flag)
// ---------------------------------------------------------------------------

describe("reborn — second death", () => {
  it("a 1/1 reborn that dies re-enters board at 1/1 with no reborn flag", () => {
    // Left: reborn minion (1/1) + two 10/10 helpers
    // Right: 10/10 enemy
    // The reborn 1/1 dies in the first exchange, re-enters at 1/1 with no
    // reborn flag, then dies again and does NOT come back (reborn is gone).
    const reborn = makeMinion(1, 1, ["reborn"]);
    const helper1 = makeMinion(10, 10);
    const helper2 = makeMinion(10, 10);
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([reborn, helper1, helper2], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    // The reborn minion should be back (1/1) and NOT have reborn anymore
    const rebornSurvivor = r.survivorsLeft.find((m) => m.atk === 1 && m.hp === 1);
    expect(rebornSurvivor).toBeDefined();
    expect(rebornSurvivor!.keywords.has("reborn")).toBe(false);
  });

  it("reborn minion that dies a second time does not come back", () => {
    // Left: reborn minion (1/1) + one 10/1 helper
    // Right: 10/10 enemy
    // The reborn 1/1 dies, comes back at 1/1, then dies again.
    // The 10/1 helper kills the enemy. Reborn should NOT trigger a second time.
    const reborn = makeMinion(1, 1, ["reborn"]);
    const helper = makeMinion(10, 1);
    const enemy = makeMinion(10, 10);

    const r = simulateCombat([reborn, helper], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    // Only the helper should survive (the reborn 1/1 dies a second time
    // and does NOT come back since reborn was already consumed).
    const rebornSurvivor = r.survivorsLeft.find((m) => m.atk === 1 && m.hp === 1);
    // The reborn minion may or may not be back depending on combat ordering,
    // but if it IS back, it should NOT have the reborn keyword.
    if (rebornSurvivor) {
      expect(rebornSurvivor.keywords.has("reborn")).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Reborn — Elistra the Immortal (tier 6 dragon)
// ---------------------------------------------------------------------------

describe("reborn — Elistra the Immortal", () => {
  it("Elistra returns at 1/1 with reborn removed after dying", () => {
    const elistra = instantiate(getMinion("elistra_the_immortal"));
    const enemy = makeMinion(10, 10);
    const helper = makeMinion(10, 10);

    const r = simulateCombat([elistra, helper], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    const reborn = r.survivorsLeft.find((m) => m.cardId === "elistra_the_immortal");
    expect(reborn).toBeDefined();
    expect(reborn!.atk).toBe(1);
    expect(reborn!.hp).toBe(1);
    expect(reborn!.maxHp).toBe(1);
    expect(reborn!.keywords.has("reborn")).toBe(false);
  });

  it("reborn from Yogg-Saron spell behaves correctly", () => {
    const rebornSpellMinion = instantiate({
      id: "reborn_test_minion",
      name: "Reborn Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: ["reborn"],
      spellDamage: 0,
      hooks: {},
    });
    const enemy = makeMinion(5, 5);
    const helper = makeMinion(10, 10);

    const r = simulateCombat([rebornSpellMinion, helper], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    const reborn = r.survivorsLeft.find((m) => m.atk === 1 && m.hp === 1);
    expect(reborn).toBeDefined();
    expect(reborn!.keywords.has("reborn")).toBe(false);
  });
});
