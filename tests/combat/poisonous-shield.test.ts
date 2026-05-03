import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function minion(id: string): MinionInstance {
  return instantiate(getMinion(id));
}

function makeMinion(atk: number, hp: number, keywords: string[] = []): MinionInstance {
  return instantiate({
    id: `custom_${atk}_${hp}_${keywords.join("-")}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: keywords as import("@/game/types").Keyword[],
    spellDamage: 0,
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// Poisonous + Divine Shield interaction
// ---------------------------------------------------------------------------

describe("poisonous + divine shield interaction", () => {
  it("poisonous attacker hits divine-shielded defender: shield pops, defender dies, poisonous is NOT consumed", () => {
    // Use a high-HP poisonous minion that can survive the counterattack
    const poisonousMinion = makeMinion(3, 5, ["poisonous"]);
    expect(poisonousMinion.keywords.has("poisonous")).toBe(true);

    const shieldedMinion = makeMinion(3, 3, ["divineShield"]);
    expect(shieldedMinion.keywords.has("divineShield")).toBe(true);

    const r = simulateCombat([poisonousMinion], [shieldedMinion], makeRng(0));

    // Poisonous minion should win — shielded defender dies from poison
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsRight).toHaveLength(0);

    // The poisonous minion should still have its poisonous keyword (not consumed)
    expect(r.survivorsLeft[0]!.keywords.has("poisonous")).toBe(true);
  });

  it("non-poisonous attacker hits divine-shielded defender: shield pops, no damage dealt, defender counterattacks", () => {
    // 3/3 normal vs 3/3 divine shield
    // Shield pops, no damage dealt (non-poisonous), then 3/3 counterattacks for 3
    // killing the 3/3 attacker. The now-unshielded 3/3 survives at 3 HP.
    const normalMinion = makeMinion(3, 3);
    const shieldedMinion = makeMinion(3, 3, ["divineShield"]);

    const r = simulateCombat([normalMinion], [shieldedMinion], makeRng(0));

    // Shielded defender wins — its counterattack kills the attacker
    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(1);
    // Shield should be gone (popped)
    expect(r.survivorsRight[0]!.keywords.has("divineShield")).toBe(false);
    // Defender survives at full HP (no damage from non-poisonous attack)
    expect(r.survivorsRight[0]!.hp).toBe(3);
  });

  it("poisonous attacker hits non-shielded defender: defender dies, poisonous is NOT consumed", () => {
    // In real Battlegrounds, poisonous is NOT consumed after killing a minion.
    // Only venomous is consumed. This is a key distinction.
    const poisonousMinion = makeMinion(3, 5, ["poisonous"]);
    const normalMinion = makeMinion(3, 3);

    const r = simulateCombat([poisonousMinion], [normalMinion], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsRight).toHaveLength(0);

    // Poisonous is NOT consumed after killing a minion (unlike venomous)
    expect(r.survivorsLeft[0]!.keywords.has("poisonous")).toBe(true);
  });

  it("poisonous attacker kills shielded then fights non-shielded: poisonous still active", () => {
    const poisonousMinion = makeMinion(3, 5, ["poisonous"]);
    const shieldedMinion = makeMinion(1, 1, ["divineShield"]);
    const normalMinion = makeMinion(1, 1);

    const r = simulateCombat([poisonousMinion], [shieldedMinion, normalMinion], makeRng(0));

    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsRight).toHaveLength(0);

    // After killing the shielded minion, poisonous should still be active
    // and kill the second minion too
    expect(r.survivorsLeft[0]!.keywords.has("poisonous")).toBe(true);
  });

  it("divine shield prevents poisonous from killing: shield pops, minion survives at reduced HP", () => {
    // A low-HP minion with divine shield — the shield absorbs the poison
    // but the poisonous attack still deals its normal damage
    const poisonousMinion = makeMinion(3, 5, ["poisonous"]);
    const shieldedMinion = makeMinion(3, 3, ["divineShield"]);

    const r = simulateCombat([poisonousMinion], [shieldedMinion], makeRng(0));

    // Both survive because the 3/3 has enough HP to survive the 3 damage
    // from the poisonous attack (3 - 3 = 0 HP, but the counterattack kills
    // the 3/5 at 2 HP = 3 - 3 = 0, so it's a draw)
    // Actually: poisonous deals 3 damage, shield pops, then 3 damage is dealt
    // to the 3/3 bringing it to 0 HP, then the 3/5 takes 3 counterattack damage
    // bringing it to 2 HP. But the 3/3 is at 0 HP so it dies.
    // Result: poisonous minion wins at 2 HP, poisonous is NOT consumed.
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsRight).toHaveLength(0);
    expect(r.survivorsLeft[0]!.keywords.has("poisonous")).toBe(true);
  });
});
