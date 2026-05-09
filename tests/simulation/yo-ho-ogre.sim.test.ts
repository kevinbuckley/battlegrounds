/**
 * Simulation tests for Yo-Ho-Ogre (tier 4 pirate, 2/8) yoHoOgre keyword.
 *
 * Yo-Ho-Ogre: after this minion attacks, it attacks again targeting a random enemy.
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
// Yo-Ho-Ogre
// ------------------------------------

describe("yo-ho-ogre", () => {
  it("attacks twice in a single turn — kills first enemy, then attacks again", () => {
    const ogre = m("yo-ho-ogre"); // 2/8 Pirate
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);

    const r = simulateCombat([ogre], [enemy1, enemy2], makeRng(0));

    const attacks = r.transcript.filter(
      (e): e is { kind: "Attack"; attacker: string; target: string } =>
        e.kind === "Attack" && e.attacker === ogre.instanceId,
    );

    // Should have 2 attacks (normal + extra)
    expect(attacks.length).toBe(2);
    // Both enemies should be dead
    const deaths = r.transcript.filter(
      (e): e is { kind: "Death"; source: string } => e.kind === "Death",
    );
    const deadIds = new Set(deaths.map((d) => d.source));
    expect(deadIds.has(enemy1.instanceId)).toBe(true);
    expect(deadIds.has(enemy2.instanceId)).toBe(true);
  });

  it("does NOT double-attack if only 1 enemy remains", () => {
    const ogre = m("yo-ho-ogre");
    const enemy = plain(1, 1);

    const r = simulateCombat([ogre], [enemy], makeRng(0));

    const attacks = r.transcript.filter(
      (e): e is { kind: "Attack"; attacker: string; target: string } =>
        e.kind === "Attack" && e.attacker === ogre.instanceId,
    );

    // Only 1 attack (no extra attack since no enemies remain after first)
    expect(attacks.length).toBe(1);
  });

  it("extra attack targets a random enemy (verified by multiple seeds)", () => {
    const ogre = m("yo-ho-ogre");
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);

    // Run with different seeds — extra attack should target different enemies
    const targets: string[] = [];
    for (let seed = 0; seed < 10; seed++) {
      const r = simulateCombat([ogre], [enemy1, enemy2], makeRng(seed));
      const attacks = r.transcript.filter(
        (e): e is { kind: "Attack"; attacker: string; target: string } =>
          e.kind === "Attack" && e.attacker === ogre.instanceId,
      );
      // Second attack (index 1) is the extra attack
      if (attacks.length >= 2) {
        const secondAttack = attacks[1];
        if (secondAttack) {
          targets.push(secondAttack.target);
        }
      }
    }

    // With 10 seeds, we should see at least 2 different targets
    const uniqueTargets = new Set(targets);
    expect(uniqueTargets.size).toBeGreaterThan(1);
  });

  it("does NOT get extra attack when on right side (counter-attack only)", () => {
    const ogre = m("yo-ho-ogre");
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);

    // Ogre on right side (enemy board), player's minion attacks
    const playerMinion = plain(2, 2);

    const r = simulateCombat([playerMinion], [ogre, enemy1, enemy2], makeRng(0));

    const attacks = r.transcript.filter(
      (e): e is { kind: "Attack"; attacker: string; target: string } =>
        e.kind === "Attack" && e.attacker === ogre.instanceId,
    );

    // When on right side, the ogre only counter-attacks (no extra attack from yoHoOgre)
    // The counter-attack is handled by applyDamage directly, not the full attack loop
    // so no Attack events are emitted for the ogre
    expect(attacks.length).toBe(0);
  });
});
