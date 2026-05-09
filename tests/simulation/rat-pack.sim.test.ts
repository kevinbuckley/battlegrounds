/**
 * Simulation tests for Rat Pack deathrattle (M5).
 * Rat Pack (tier 2 beast, 2/2) summons 1/1 Rats equal to its current ATK
 * when it dies in combat.
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
// Rat Pack — deathrattle summons 1/1 Rats equal to current ATK
// ---------------------------------------------------------------------------

describe("rat_pack", () => {
  it("summons 1/1 Rats equal to Rat Pack's ATK when it dies", () => {
    // Rat Pack (2/2) dies → summons 2 rats (atk=2)
    // Use a strong enemy so Rat Pack dies: 4/4 vanilla
    const ratPack = m("rat_pack"); // 2/2
    const enemy = plain(4, 4); // strong enemy

    const r = simulateCombat([ratPack], [enemy], makeRng(0));

    // Count Summon events for rat_pack_rat
    const ratSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "rat_pack_rat");
    expect(ratSummons).toHaveLength(2); // 2/2 → 2 rats
  });

  it("summons 4 rats when Rat Pack is buffed to 4/2", () => {
    // Buff Rat Pack to 4/2 (atk=4) → should summon 4 rats
    const ratPack = m("rat_pack");
    ratPack.atk = 4; // buffed to 4 ATK
    const enemy = plain(4, 4);

    const r = simulateCombat([ratPack], [enemy], makeRng(0));

    const ratSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "rat_pack_rat");
    expect(ratSummons).toHaveLength(4); // 4/2 → 4 rats
  });

  it("golden Rat Pack (4/4) summons 4 rats (board cap of 7 applies)", () => {
    // Golden Rat Pack has double stats: 4/4, so atk=4 → 4 rats per deathrattle trigger
    // Golden = 2x deathrattle → 4+4 = 8 rats, but board cap is 7
    const ratPack = (() => {
      const m = instantiate(MINIONS["rat_pack"]!);
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.hp * 2 };
    })();
    const enemy = plain(4, 4);

    const r = simulateCombat([ratPack], [enemy], makeRng(0));

    const ratSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "rat_pack_rat");
    // 4 rats × 2 (golden) = 8, but board cap of 7 trims 1 → 7 summons
    expect(ratSummons).toHaveLength(7);
  });

  it("does not summon rats when Rat Pack survives combat", () => {
    // Rat Pack (2/2) vs weak enemy (1/1) — Rat Pack wins, no death, no summons
    const ratPack = m("rat_pack"); // 2/2
    const enemy = plain(1, 1);

    const r = simulateCombat([ratPack], [enemy], makeRng(0));

    const ratSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "rat_pack_rat");
    expect(ratSummons).toHaveLength(0);
  });

  it("summons rats even when Rat Pack dies to a weak enemy", () => {
    // Rat Pack (2/2) vs 3/3 — Rat Pack dies, summons 2 rats
    const ratPack = m("rat_pack"); // 2/2
    const enemy = plain(3, 3);

    const r = simulateCombat([ratPack], [enemy], makeRng(0));

    const ratSummons = r.transcript.filter((e) => e.kind === "Summon" && e.card === "rat_pack_rat");
    expect(ratSummons).toHaveLength(2);

    // Enemy should also die (2 damage from rat pack + 2 rats = 4 total)
    const enemySurvivor = r.survivorsRight.find((m) => m.instanceId === enemy.instanceId);
    expect(enemySurvivor).toBeUndefined();
  });
});
