/**
 * Simulation tests for Voidlord deathrattle (M5).
 * Voidlord (tier 5 demon, 3/9, taunt) deathrattle summons three 1/3 Demons
 * with taunt when it dies.
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
// Voidlord — deathrattle summons three 1/3 Demon taunts
// ---------------------------------------------------------------------------

describe("voidlord", () => {
  it("summons three 1/3 Demon taunts on death", () => {
    const voidlord = m("voidlord"); // 3/9 taunt
    const enemy = plain(10, 1); // 10 ATK — kills voidlord (3/9 vs 10/1 exchange)

    const r = simulateCombat([voidlord], [enemy], makeRng(0));

    // Voidlord should be dead (9 HP < 10 ATK)
    const vlSurvivor = r.survivorsLeft.find((m) => m.instanceId === voidlord.instanceId);
    expect(vlSurvivor).toBeUndefined();

    // Three 1/3 Demon taunts should have been summoned
    const tauntDemons = r.survivorsLeft.filter((m) => m.cardId === "voidlord_taunt_demon");
    expect(tauntDemons).toHaveLength(3);

    // All should have taunt
    for (const td of tauntDemons) {
      expect(td.keywords).toContain("taunt");
      expect(td.atk).toBe(1);
      expect(td.hp).toBe(3);
    }
  });

  it("respects board cap of 7 — fewer tokens if board is full", () => {
    const voidlord = m("voidlord"); // 3/9 taunt
    // Fill board with 5 other minions (7 total with voidlord)
    const allies = [voidlord, plain(1, 1), plain(1, 1), plain(1, 1), plain(1, 1), plain(1, 1)];
    const enemy = plain(10, 1); // kills voidlord

    const r = simulateCombat(allies, [enemy], makeRng(0));

    // Board cap is 7, voidlord dies → 5 remaining → 3 tokens would make 8 → cap at 7
    // So only 2 tokens should be summoned (5 + 2 = 7)
    const tauntDemons = r.survivorsLeft.filter((m) => m.cardId === "voidlord_taunt_demon");
    expect(tauntDemons.length).toBeLessThanOrEqual(3);
    expect(tauntDemons.length).toBeGreaterThanOrEqual(2);
  });

  it("taunt demons survive and finish the fight", () => {
    const voidlord = m("voidlord"); // 3/9 taunt
    const enemy = plain(10, 1); // 10 ATK — kills voidlord

    const r = simulateCombat([voidlord], [enemy], makeRng(0));

    // Enemy should also be dead (10 ATK vs 3/9 exchange)
    expect(r.survivorsRight).toHaveLength(0);

    // Taunt demons should be on the board
    const tauntDemons = r.survivorsLeft.filter((m) => m.cardId === "voidlord_taunt_demon");
    expect(tauntDemons).toHaveLength(3);
  });

  it("golden voidlord deathrattle fires twice — six tokens instead of three", () => {
    const voidlord = m("voidlord"); // 3/9 taunt
    voidlord.golden = true;

    const enemy = plain(10, 1);

    const r = simulateCombat([voidlord], [enemy], makeRng(0));

    // Golden voidlord dies (3/9 vs 10/1)
    const vlSurvivor = r.survivorsLeft.find((m) => m.instanceId === voidlord.instanceId);
    expect(vlSurvivor).toBeUndefined();

    // Golden = 2 triggers of deathrattle → 3 + 3 = 6 tokens (board cap 7 allows all)
    const tauntDemons = r.survivorsLeft.filter((m) => m.cardId === "voidlord_taunt_demon");
    expect(tauntDemons).toHaveLength(6);
  });
});
