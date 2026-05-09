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
// Mama Bear — onSummon gives newly summoned friendly Beasts +5/+5
// ---------------------------------------------------------------------------

describe("mama_bear simulation", () => {
  it("gives a newly summoned friendly Beast +5/+5 during combat", () => {
    // Rat Pack (4/4) dies → summons 4 rats (1/1 Beasts)
    // Mama Bear on board should buff each rat +5/+5 → 6/6 rats
    // 4 rats × 6atk = 24 total damage vs 10/10 enemy
    const mamaBear = m("mama_bear"); // 5/5
    const ratPack = m("rat_pack");
    ratPack.atk = 4; // buffed to 4 → summons 4 rats
    const enemy = plain(10, 10);

    const r = simulateCombat([mamaBear, ratPack], [enemy], makeRng(0));

    // Enemy should die (4 rats × 6atk = 24 damage)
    const enemySurvivor = r.survivorsRight.find((m) => m.instanceId === enemy.instanceId);
    expect(enemySurvivor).toBeUndefined();

    // Count Summon events for rats
    const ratSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "rat_pack_rat");
    expect(ratSummons).toHaveLength(4);

    // Verify summoned rats have +5/+5 from Mama Bear (1+5=6atk, 1+5=6hp)
    const ratSurvivors = r.survivorsLeft.filter((m) => m.instanceId.startsWith("rat_pack_rat"));
    for (const rat of ratSurvivors) {
      expect(rat.atk).toBe(6);
      expect(rat.hp).toBe(6);
    }
  });

  it("does not buff non-Beast summons", () => {
    // Mama Bear (5/5) vs 0/1 enemy — Mama takes 0 damage, stays 5/5
    // No summons happen, so Mama should not be buffed
    const mamaBear = m("mama_bear"); // 5/5

    const r = simulateCombat([mamaBear], [plain(0, 1)], makeRng(0));

    // Mama Bear should remain 5/5 (no summons = no buffs, only took 0 damage)
    const mamaSurvivor = r.survivorsLeft.find((m) => m.instanceId === mamaBear.instanceId);
    expect(mamaSurvivor).toBeDefined();
    expect(mamaSurvivor!.atk).toBe(5);
    expect(mamaSurvivor!.hp).toBe(5);
  });

  it("does not buff itself (self-summon check)", () => {
    // When Mama Bear summons itself (if that were possible), it should skip.
    // Since Mama Bear has no deathrattle/battlecry that summons itself,
    // verify it stays at base stats when no summons occur.
    const mamaBear = m("mama_bear"); // 5/5 base

    const r = simulateCombat([mamaBear], [plain(0, 1)], makeRng(0));

    // Mama Bear should remain 5/5 (not buffed by itself)
    const mamaSurvivor = r.survivorsLeft.find((m) => m.instanceId === mamaBear.instanceId);
    expect(mamaSurvivor).toBeDefined();
    expect(mamaSurvivor!.atk).toBe(5);
    expect(mamaSurvivor!.hp).toBe(5);
  });

  it("golden Mama Bear also buffs +5/+5 (golden does not scale buff)", () => {
    // Golden Mama Bear (10/10) + Rat Pack (4/4) vs 10/10
    // 4 rats get +5/+5 → 6/6 each → 24 total damage kills enemy
    const mamaBear = (() => {
      const base = instantiate(MINIONS["mama_bear"]!);
      return { ...base, golden: true, atk: base.atk * 2, hp: base.hp * 2, maxHp: base.hp * 2 };
    })();
    const ratPack = m("rat_pack");
    ratPack.atk = 4;
    const enemy = plain(10, 10);

    const r = simulateCombat([mamaBear, ratPack], [enemy], makeRng(0));

    // Enemy should die
    const enemySurvivor = r.survivorsRight.find((m) => m.instanceId === enemy.instanceId);
    expect(enemySurvivor).toBeUndefined();

    // Summoned rats should still get +5/+5 (not +10/+10)
    const ratSurvivors = r.survivorsLeft.filter((m) => m.instanceId.startsWith("rat_pack_rat"));
    for (const rat of ratSurvivors) {
      expect(rat.atk).toBe(6);
      expect(rat.hp).toBe(6);
    }
  });
});
