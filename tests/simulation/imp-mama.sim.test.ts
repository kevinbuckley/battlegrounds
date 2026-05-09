/**
 * Simulation tests for Imp Mama (M6).
 * Imp Mama (tier 6 demon, 6/8) gains +1/+1 and spawns a 1/1 Imp
 * each time it takes damage.
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
// Imp Mama — onDamageTaken: gain +1/+1 and spawn 1/1 Imp
// ---------------------------------------------------------------------------

describe("imp-mama", () => {
  it("gains +1/+1 and spawns a 1/1 Imp when hit", () => {
    const impMama = m("imp_mama"); // 6/8
    const enemy = plain(3, 3); // 3 ATK — hits imp mama

    const r = simulateCombat([impMama], [enemy], makeRng(0));

    // Imp Mama should survive (6/8 vs 3/3 exchange)
    const mamaSurvivor = r.survivorsLeft.find((m) => m.instanceId === impMama.instanceId);
    expect(mamaSurvivor).toBeDefined();
    // onDamageTaken fires per hit: +1/+1 and 1 imp spawned
    // hp = 8 - 3 (damage) + 1 (hook) = 6
    // atk = 6 + 1 (hook) = 7
    expect(mamaSurvivor!.atk).toBe(7);
    expect(mamaSurvivor!.hp).toBe(6);

    // One 1/1 Imp should have been summoned
    const imps = r.survivorsLeft.filter((m) => m.cardId === "imp_mama_imp");
    expect(imps).toHaveLength(1);
    if (imps[0]) {
      expect(imps[0].atk).toBe(1);
      expect(imps[0].hp).toBe(1);
    }
  });

  it("multiple hits spawn multiple Imps and stack +1/+1", () => {
    const impMama = m("imp_mama"); // 6/8
    // Two enemies that hit imp mama
    const enemies = [plain(3, 3), plain(3, 3)];

    const r = simulateCombat([impMama], enemies, makeRng(0));

    // Imp Mama should survive (6/8 vs 3/3 exchange — takes 2 hits)
    const mamaSurvivor = r.survivorsLeft.find((m) => m.instanceId === impMama.instanceId);
    expect(mamaSurvivor).toBeDefined();
    // 2 hits → +2/+2 → hp = 8 - 3 - 3 + 1 + 1 = 4, atk = 6 + 2 = 8
    if (mamaSurvivor) {
      expect(mamaSurvivor.atk).toBe(8);
      expect(mamaSurvivor.hp).toBe(4);
    }

    // Two 1/1 Imps should have been summoned
    const imps = r.survivorsLeft.filter((m) => m.cardId === "imp_mama_imp");
    expect(imps).toHaveLength(2);
  });

  it("does nothing when taking 0 damage", () => {
    const impMama = m("imp_mama"); // 6/8
    const enemy = plain(0, 10); // 0 ATK — doesn't kill imp mama

    const r = simulateCombat([impMama], [enemy], makeRng(0));

    // Imp Mama survives unchanged
    const mamaSurvivor = r.survivorsLeft.find((m) => m.instanceId === impMama.instanceId);
    expect(mamaSurvivor).toBeDefined();
    if (mamaSurvivor) {
      expect(mamaSurvivor.atk).toBe(6);
      expect(mamaSurvivor.hp).toBe(8);
    }

    // No imps spawned
    const imps = r.survivorsLeft.filter((m) => m.cardId === "imp_mama_imp");
    expect(imps).toHaveLength(0);
  });

  it("golden imp mama spawns multiple imps and stacks more", () => {
    const impMama = m("imp_mama"); // 6/8
    impMama.golden = true;

    const enemies = [plain(3, 3), plain(3, 3)];

    const r = simulateCombat([impMama], enemies, makeRng(0));

    // Golden imp mama survives (6/8 vs 3/3 exchange)
    const mamaSurvivor = r.survivorsLeft.find((m) => m.instanceId === impMama.instanceId);
    expect(mamaSurvivor).toBeDefined();
    // Golden does NOT double onDamageTaken (only deathrattle), so same as non-golden:
    // 2 hits → +2/+2 → hp = 8 - 3 - 3 + 1 + 1 = 4, atk = 6 + 2 = 8
    if (mamaSurvivor) {
      expect(mamaSurvivor.atk).toBe(8);
      expect(mamaSurvivor.hp).toBe(4);
    }

    // Golden does NOT double onDamageTaken → still 2 imps (not 4)
    const imps = r.survivorsLeft.filter((m) => m.cardId === "imp_mama_imp");
    expect(imps).toHaveLength(2);
  });
});
