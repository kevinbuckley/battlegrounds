/**
 * Simulation tests for Maexxna (M5) — poisonous Beast.
 * Maexxna (tier 5, 2/12, Beast, poisonous) kills any minion in one hit
 * regardless of HP.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

function plain(atk: number, hp: number) {
  return instantiate({
    id: `plain_${atk}_${hp}`,
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
// Maexxna — poisonous kills any minion in one hit regardless of HP
// ---------------------------------------------------------------------------

describe("maexxna", () => {
  it("has correct base stats and poisonous keyword", () => {
    const card = MINIONS["maexxna"]!;
    expect(card.baseAtk).toBe(2);
    expect(card.baseHp).toBe(12);
    expect(card.tier).toBe(5);
    expect(card.tribes).toContain("Beast");
    expect(card.baseKeywords).toContain("poisonous");
  });

  it("kills any minion regardless of HP — Maexxna vs 1000 HP", () => {
    const maexxna = m("maexxna"); // 2/12 poisonous
    const enemy = plain(1, 1000);

    const r = simulateCombat([maexxna], [enemy], makeRng(0));

    // Enemy should die (poisonous kills regardless of HP)
    expect(r.survivorsRight).toHaveLength(0);

    // Maexxna should survive (enemy deals 1 damage → 2/11)
    const maexxnaSurvivor = r.survivorsLeft.find((m) => m.instanceId === maexxna.instanceId);
    expect(maexxnaSurvivor).toBeDefined();
    expect(maexxnaSurvivor!.hp).toBe(11);
  });

  it("dies when attacked by high-ATK enemy — both die in exchange", () => {
    const maexxna = m("maexxna"); // 2/12 poisonous
    const enemy = plain(1000, 1);

    const r = simulateCombat([maexxna], [enemy], makeRng(0));

    // Maexxna should die (1000 damage > 12 HP)
    const maexxnaSurvivor = r.survivorsLeft.find((m) => m.instanceId === maexxna.instanceId);
    expect(maexxnaSurvivor).toBeUndefined();

    // Enemy should also die (poisonous kills regardless of HP, 1 damage from enemy → 1000/0 → clamped to 0 HP)
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("must attack taunt first — kills taunt instantly, then attacks others", () => {
    const maexxna = m("maexxna"); // 2/12 poisonous
    const taunt = plain(3, 5);
    taunt.keywords.add("taunt");
    const plain2 = plain(2, 2);

    const r = simulateCombat([maexxna], [taunt, plain2], makeRng(0));

    // Both enemies should die (Maexxna kills taunt with poisonous,
    // then attacks plain2 with counterattack from taunt → 2/12 takes 3 → 2/9,
    // then plain2 counterattacks → 2/9 takes 2 → 2/7, plain2 dies)
    expect(r.survivorsRight).toHaveLength(0);

    // Maexxna should survive (taunt deals 3, plain2 deals 2 = 5 total → 12-5=7)
    const maexxnaSurvivor = r.survivorsLeft.find((m) => m.instanceId === maexxna.instanceId);
    expect(maexxnaSurvivor).toBeDefined();
    expect(maexxnaSurvivor!.hp).toBe(7);
  });
});
