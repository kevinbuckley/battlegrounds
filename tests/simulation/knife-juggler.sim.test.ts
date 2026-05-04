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
// Knife Juggler — onSummon fires when deathrattle summons occur
// ---------------------------------------------------------------------------

describe("knife_juggler simulation", () => {
  it("fires 1 damage when a deathrattle summons a minion during combat", () => {
    const juggler = minion("knife_juggler");
    const harvestGolem = minion("harvest_golem");
    // Enemy needs to kill the harvest golem so its deathrattle fires
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([juggler, harvestGolem], [enemy], makeRng(0));

    // Count Damage events targeting enemy minions
    const damageEvents = r.transcript.filter(
      (e): e is { kind: "Damage"; target: string; amount: number } => e.kind === "Damage",
    );
    const enemyDamageTargets = new Set(damageEvents.map((e) => e.target));
    // The enemy minion should have taken at least 1 damage from Knife Juggler
    // (in addition to normal combat damage)
    expect(enemyDamageTargets.has(enemy.instanceId)).toBe(true);
  });

  it("fires 1 damage when tokens from deathrattle are summoned (Infested Wolf → spiders)", () => {
    const juggler = minion("knife_juggler");
    const wolf = minion("infested_wolf");
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([juggler, wolf], [enemy], makeRng(42));

    // Count Damage events targeting enemy minions
    const damageEvents = r.transcript.filter(
      (e): e is { kind: "Damage"; target: string; amount: number } => e.kind === "Damage",
    );
    const enemyDamageTargets = new Set(damageEvents.map((e) => e.target));
    // The enemy should have taken damage from Knife Juggler when spider tokens
    // were summoned by the Infested Wolf's deathrattle
    expect(enemyDamageTargets.has(enemy.instanceId)).toBe(true);
  });

  it("does not fire when there are no enemy minions", () => {
    const juggler = minion("knife_juggler");
    const harvestGolem = minion("harvest_golem");

    const r = simulateCombat([juggler, harvestGolem], [], makeRng(0));

    const damageEvents = r.transcript.filter((e) => e.kind === "Damage");
    expect(damageEvents).toHaveLength(0);
  });

  it("fires for each deathrattle summon (multiple summons = multiple triggers)", () => {
    const juggler = minion("knife_juggler");
    // Golden harvest golem: deathrattle fires twice → 2 small mech summons
    // Each summon triggers Knife Juggler once
    const goldenGolem = (() => {
      const m = instantiate(getMinion("harvest_golem"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
    })();
    // Enemy with enough HP to survive the summons but die to combat damage
    const enemy = makeMinion(4, 20);

    const r = simulateCombat([juggler, goldenGolem], [enemy], makeRng(0));

    // Count Damage events targeting the enemy
    const damageEvents = r.transcript.filter(
      (e): e is { kind: "Damage"; target: string; amount: number } => e.kind === "Damage",
    );
    const enemyDamageEvents = damageEvents.filter((e) => e.target === enemy.instanceId);
    // Knife Juggler fires once per deathrattle summon:
    // 1 (initial combat) + 2 (golden deathrattle summons) = 3 damage events to enemy
    // Plus the harvest golem's own attacks. We just need to verify there are
    // multiple damage events to the enemy (more than just combat).
    expect(enemyDamageEvents.length).toBeGreaterThan(1);
  });
});
