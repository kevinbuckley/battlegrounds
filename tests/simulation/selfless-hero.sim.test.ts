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
// Selfless Hero — deathrattle gives divine shield to a random friendly minion
// that doesn't already have one
// ---------------------------------------------------------------------------

describe("selfless_hero simulation", () => {
  it("gives divine shield to a random friendly minion without one when it dies in combat", () => {
    const selfless = minion("selfless_hero");
    const ally = makeMinion(2, 3);
    const enemy = makeMinion(1, 1);

    const r = simulateCombat([selfless, ally], [enemy], makeRng(0));

    // Selfless Hero dies (1 HP vs 1 ATK), so its deathrattle fires.
    // It should give divine shield to the ally.
    const allyAfter = r.survivorsLeft.find((m: MinionInstance) => m.instanceId === ally.instanceId);
    expect(allyAfter).toBeDefined();
    expect(allyAfter!.keywords.has("divineShield")).toBe(true);
  });

  it("skips friendly minions that already have divine shield", () => {
    const selfless = minion("selfless_hero");
    const shieldedAlly = makeMinion(2, 3);
    shieldedAlly.keywords.add("divineShield");
    const unshieldedAlly = makeMinion(2, 3);
    const enemy = makeMinion(1, 1);

    const r = simulateCombat([selfless, shieldedAlly, unshieldedAlly], [enemy], makeRng(0));

    // Selfless Hero dies, deathrattle fires. Shielded ally is skipped.
    // The unshielded ally should get the divine shield.
    const unshieldedAfter = r.survivorsLeft.find(
      (m: MinionInstance) => m.instanceId === unshieldedAlly.instanceId,
    );
    expect(unshieldedAfter).toBeDefined();
    expect(unshieldedAfter!.keywords.has("divineShield")).toBe(true);

    // Shielded ally should still have divine shield (unchanged).
    const shieldedAfter = r.survivorsLeft.find(
      (m: MinionInstance) => m.instanceId === shieldedAlly.instanceId,
    );
    expect(shieldedAfter).toBeDefined();
    expect(shieldedAfter!.keywords.has("divineShield")).toBe(true);
  });

  it("does nothing when there are no friendly minions", () => {
    const selfless = minion("selfless_hero");
    const enemy = makeMinion(1, 1);

    const r = simulateCombat([selfless], [enemy], makeRng(0));

    // No friendly minions to give shield to — deathrattle is a no-op.
    expect(r.survivorsLeft).toHaveLength(0);
  });

  it("golden Selfless Hero gives 2 divine shields", () => {
    const selfless = (() => {
      const m = instantiate(getMinion("selfless_hero"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
    })();
    const ally1 = makeMinion(2, 3);
    const ally2 = makeMinion(2, 3);
    const enemy = makeMinion(3, 3);

    const r = simulateCombat([selfless, ally1, ally2], [enemy], makeRng(0));

    // Golden: deathrattle fires twice, giving 2 shields.
    const ally1After = r.survivorsLeft.find(
      (m: MinionInstance) => m.instanceId === ally1.instanceId,
    );
    const ally2After = r.survivorsLeft.find(
      (m: MinionInstance) => m.instanceId === ally2.instanceId,
    );
    expect(ally1After).toBeDefined();
    expect(ally2After).toBeDefined();
    expect(ally1After!.keywords.has("divineShield")).toBe(true);
    expect(ally2After!.keywords.has("divineShield")).toBe(true);
  });

  it("does not give shield to Selfless Hero itself (no other friendly minions)", () => {
    const selfless = minion("selfless_hero");
    const enemy = makeMinion(2, 2);

    const r = simulateCombat([selfless], [enemy], makeRng(0));

    // Selfless Hero dies, no other friendly minions exist, so no shield is given.
    expect(r.survivorsLeft).toHaveLength(0);
  });
});
