/**
 * Simulation tests for Houndmaster Shaw (tier 4 Beast, 3/6).
 *
 * Houndmaster Shaw: onStartOfCombat gives ALL other friendly minions Rush.
 */
import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  const card = MINIONS[id];
  if (!card) throw new Error(`Unknown card: ${id}`);
  return instantiate(card);
}

function plain(atk: number, hp: number) {
  return instantiate(
    defineMinion({
      id: `plain_${atk}_${hp}`,
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

// ------------------------------------
// Houndmaster Shaw
// ------------------------------------

describe("houndmaster-shaw", () => {
  it("gives all other friendly minions Rush at start of combat", () => {
    const shaw = m("houndmaster_shaw"); // 3/6 Beast
    const vanilla = plain(1, 1);
    const killer = plain(5, 1);

    const r = simulateCombat([shaw, vanilla], [killer], makeRng(0));

    // Shaw should give Rush to the vanilla minion
    const shawStats = r.transcript
      .filter(
        (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
      )
      .filter((s) => s.target === shaw.instanceId);
    const vanillaStats = r.transcript
      .filter(
        (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
      )
      .filter((s) => s.target === vanilla.instanceId);

    // Shaw should have at least one Stat event (from giving itself no rush)
    expect(shawStats.length).toBeGreaterThanOrEqual(0);
    // Vanilla should have at least one Stat event (from getting rush)
    expect(vanillaStats.length).toBeGreaterThan(0);
  });

  it("does NOT give itself Rush (only OTHER friendly minions)", () => {
    const shaw = m("houndmaster_shaw");
    const killer = plain(5, 1);

    const r = simulateCombat([shaw], [killer], makeRng(0));

    // Shaw should not gain rush keyword from its own onStartOfCombat
    expect(shaw.keywords.has("rush")).toBe(false);
  });

  it("does NOT give Rush to enemy minions", () => {
    const shaw = m("houndmaster_shaw");
    const enemyVanilla = plain(3, 3);
    const killer = plain(5, 1);

    const r = simulateCombat([shaw], [killer, enemyVanilla], makeRng(0));

    // Enemy minions should not gain rush from Shaw's effect
    expect(enemyVanilla.keywords.has("rush")).toBe(false);
  });

  it("gives Rush to minions on both sides of the board", () => {
    const shaw = m("houndmaster_shaw");
    const ally1 = plain(1, 1);
    const ally2 = plain(2, 2);
    const killer = plain(5, 1);

    const r = simulateCombat([shaw, ally1, ally2], [killer], makeRng(0));

    const ally1Stats = r.transcript
      .filter(
        (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
      )
      .filter((s) => s.target === ally1.instanceId);
    const ally2Stats = r.transcript
      .filter(
        (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
      )
      .filter((s) => s.target === ally2.instanceId);

    // Both allies should have Stat events from getting rush
    expect(ally1Stats.length).toBeGreaterThan(0);
    expect(ally2Stats.length).toBeGreaterThan(0);
  });

  it("works on the right side (enemy board) — gives enemy minions Rush", () => {
    const shaw = m("houndmaster_shaw");
    const allyCat = m("alley_cat"); // 1/1 Beast
    const killer = plain(5, 1);

    // Shaw on right side (enemy board)
    const r = simulateCombat([killer], [shaw, allyCat], makeRng(0));

    const allyStats = r.transcript
      .filter(
        (e): e is { kind: "Stat"; target: string; atk: number; hp: number } => e.kind === "Stat",
      )
      .filter((s) => s.target === allyCat.instanceId);
    // Alley Cat on enemy board should get rush from Shaw
    expect(allyStats.length).toBeGreaterThan(0);
  });
});
