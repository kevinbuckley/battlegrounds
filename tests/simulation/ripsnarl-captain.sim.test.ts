/**
 * Simulation tests for Ripsnarl Captain onAllyAttack (M2).
 * Ripsnarl Captain (tier 4 pirate, 3/5) gains +2/+2 whenever a friendly
 * Pirate attacks.
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
// Ripsnarl Captain — onAllyAttack gains +2/+2 when a friendly Pirate attacks
// ---------------------------------------------------------------------------

describe("ripsnarl-captain", () => {
  it("gains +2/+2 when a friendly Pirate attacks", () => {
    const captain = m("ripsnarl_captain"); // 3/5
    const pirate = m("bloodsail_pirate"); // 2/3
    const enemy1 = plain(1, 1);
    const enemy2 = plain(1, 1);
    const enemy3 = plain(1, 1);

    const r = simulateCombat([captain, pirate], [enemy1, enemy2, enemy3], makeRng(0));

    // Captain should have gained +2/+2 from the pirate's attack
    const captainSurvivor = r.survivorsLeft.find((m) => m.instanceId === captain.instanceId);
    expect(captainSurvivor).toBeDefined();
    expect(captainSurvivor!.atk).toBe(5); // 3 + 2 (buffed by pirate's attack)
    // HP: base 5 + 2 (buff) - 2 (enemy counterattacks from 2 dead enemies) = 5
    expect(captainSurvivor!.hp).toBe(5);
  });

  it("does not gain when it attacks itself (onAllyAttack skips attacker)", () => {
    const captain = m("ripsnarl_captain"); // 3/5

    const r = simulateCombat([captain], [plain(1, 1)], makeRng(0));

    // Captain attacks itself — onAllyAttack skips the attacker, so no buff
    const captainSurvivor = r.survivorsLeft.find((m) => m.instanceId === captain.instanceId);
    expect(captainSurvivor).toBeDefined();
    expect(captainSurvivor!.atk).toBe(3); // no buff from self-attack
    expect(captainSurvivor!.hp).toBe(4); // took 1 damage from enemy counterattack
  });

  it("does not gain when non-Pirate attacks", () => {
    const captain = m("ripsnarl_captain"); // 3/5
    const nonPirate = plain(3, 3);

    const r = simulateCombat([captain, nonPirate], [plain(1, 1)], makeRng(0));

    const captainSurvivor = r.survivorsLeft.find((m) => m.instanceId === captain.instanceId);
    expect(captainSurvivor).toBeDefined();
    expect(captainSurvivor!.atk).toBe(3); // no buff from non-Pirate
    expect(captainSurvivor!.hp).toBe(4); // took 1 damage from enemy
  });

  it("does not gain when it attacks itself (onAllyAttack skips attacker)", () => {
    const captain = m("ripsnarl_captain"); // 3/5

    const r = simulateCombat([captain], [plain(1, 1)], makeRng(0));

    // Captain attacks itself — onAllyAttack skips the attacker, so no buff
    const captainSurvivor = r.survivorsLeft.find((m) => m.instanceId === captain.instanceId);
    expect(captainSurvivor).toBeDefined();
    expect(captainSurvivor!.atk).toBe(3); // no buff from self-attack
    expect(captainSurvivor!.hp).toBe(4); // took 1 damage from enemy counterattack
  });
});
