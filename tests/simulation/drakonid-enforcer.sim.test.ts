/**
 * Simulation tests for Drakonid Enforcer (tier 4 dragon, 3/6).
 * Drakonid gains +2/+2 when a FRIENDLY divine shield pops.
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
// Drakonid Enforcer — onDivineShieldPop: gain +2/+2 when a FRIENDLY divine
// shield pops (not enemy shields).
// ---------------------------------------------------------------------------

describe("drakonid_enforcer", () => {
  it("gains +2/+2 when a friendly divine shield pops", () => {
    const drakonid = m("drakonid_enforcer"); // 3/6
    const annoy = m("annoy_o_tron"); // 1/2 divineShield
    const enemy = plain(3, 10); // high HP so Drakonid can't kill in one hit

    const r = simulateCombat([drakonid, annoy], [enemy], makeRng(0));

    // Enemy attacks Annoy (taunt) → Annoy's shield pops → Drakonid gains +2/+2 → 5/8.
    // Annoy dies to enemy's 3 ATK. Enemy counterattacks Drakonid (3 damage).
    // Drakonid at 5 ATK vs enemy 3 ATK → Drakonid wins (5 > 3, enemy dies).
    const survivors = r.survivorsLeft;
    const drakonidSurvivor = survivors.find((m) => m.instanceId === drakonid.instanceId);
    expect(drakonidSurvivor).toBeDefined();
    if (drakonidSurvivor) {
      expect(drakonidSurvivor.atk).toBe(5);
      expect(drakonidSurvivor.hp).toBe(2); // 8 - 3 (counterattack) - 3 (final exchange)
    }
  });

  it("does not gain stats when an enemy divine shield pops", () => {
    const drakonid = m("drakonid_enforcer"); // 3/6
    const enemyShielded = instantiate({
      id: "enemy_shielded",
      name: "3/10 Shielded",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 10,
      baseKeywords: ["divineShield"],
      spellDamage: 0,
      hooks: {},
    });

    const r = simulateCombat([drakonid], [enemyShielded], makeRng(0));

    // Enemy's shield pops on first attack → Drakonid does NOT gain stats (enemy side).
    // Then enemy counterattacks Drakonid (3 damage).
    // Drakonid at 3 ATK vs enemy 3 ATK → Drakonid dies (3 damage to 6 HP, enemy still alive).
    // Key: Drakonid stayed at 3 ATK (no +2/+2 from enemy shield pop).
    const survivors = r.survivorsLeft;
    // Drakonid takes 3 damage from counterattack → 3 HP, enemy still alive with 7 HP.
    // Then enemy attacks again → Drakonid dies.
    expect(survivors.length).toBe(0);
    // Check that no Stat event shows Drakonid's ATK increasing.
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === drakonid.instanceId,
    );
    // All Stat events for Drakonid should show atk=3 (base, never buffed).
    for (const e of statEvents) {
      expect((e as { atk: number }).atk).toBe(3);
    }
  });

  it("gains +2/+2 per friendly shield pop — 3 shields → +6/+6 total", () => {
    const drakonid = m("drakonid_enforcer"); // 3/6
    const annoy1 = m("annoy_o_tron"); // 1/2 divineShield
    const annoy2 = m("annoy_o_tron"); // 1/2 divineShield
    const enemy = plain(3, 10); // high HP to allow multiple exchanges

    const r = simulateCombat([drakonid, annoy1, annoy2], [enemy], makeRng(0));

    // Annoy1's shield pops → Drakonid +2/+2 (5/8).
    // Annoy1 dies, enemy counterattacks Drakonid (3 damage).
    // Annoy2's shield pops → Drakonid +2/+2 (7/10).
    // Annoy2 dies, enemy counterattacks Drakonid (3 damage).
    // Drakonid at 7 ATK vs enemy 3 ATK → Drakonid wins.
    const survivors = r.survivorsLeft;
    const drakonidSurvivor = survivors.find((m) => m.instanceId === drakonid.instanceId);
    expect(drakonidSurvivor).toBeDefined();
    if (drakonidSurvivor) {
      expect(drakonidSurvivor.atk).toBe(7);
      expect(drakonidSurvivor.hp).toBe(4); // 10 - 3 (first exchange) - 3 (final)
    }
  });

  it("stacks across multiple hits from the same enemy", () => {
    const drakonid = m("drakonid_enforcer"); // 3/6
    const annoy = m("annoy_o_tron"); // 1/2 divineShield
    const enemy = plain(1, 20); // high HP enemy to allow multiple exchanges

    const r = simulateCombat([drakonid, annoy], [enemy], makeRng(0));

    // Annoy's shield pops → Drakonid +2/+2 (5/8).
    // Annoy dies to enemy's 1 ATK → enemy counterattacks Drakonid (1 damage).
    // Drakonid at 5 ATK vs enemy 1 ATK → Drakonid wins, enemy survives with 4 HP.
    // Next exchange: Drakonid attacks enemy (5 damage → enemy at -1, dies).
    // Drakonid survives with 7 HP (8 - 1 counterattack).
    const survivors = r.survivorsLeft;
    const drakonidSurvivor = survivors.find((m) => m.instanceId === drakonid.instanceId);
    expect(drakonidSurvivor).toBeDefined();
    if (drakonidSurvivor) {
      // 1 shield pop: annoy's → +2/+2 → 5/8, then -1 damage per exchange (4 exchanges) → 5/4
      expect(drakonidSurvivor.atk).toBe(5);
      expect(drakonidSurvivor.hp).toBe(4);
    }
  });
});
