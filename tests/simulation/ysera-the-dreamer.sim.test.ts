import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Ysera the Dreamer — tier 6 Dragon, start-of-combat transform
// ---------------------------------------------------------------------------

describe("ysera_the_dreamer", () => {
  it("has correct base stats and tribes", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    expect(ysera.cardId).toBe("ysera_the_dreamer");
    expect(ysera.atk).toBe(0);
    expect(ysera.hp).toBe(5);
    expect(ysera.tribes).toContain("Dragon");
    expect(ysera.keywords.has("taunt")).toBe(true);
  });

  it("transforms a random friendly minion into 0/5 with Taunt at start of combat", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    // Create a friendly minion that should be transformed
    const friendly = instantiate(getMinion("murloc_tidehunter")); // 2/1
    // Enemy minion
    const enemy = instantiate(getMinion("rockpool_hunter")); // 2/1
    const r = simulateCombat([ysera, friendly], [enemy], makeRng(0));
    // Check for a Transform event in the transcript
    const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
    expect(transformEvents.length).toBe(1);
    // The transformed minion should now be 0/5 with Taunt
    const transformed = r.transcript.find((e) => e.kind === "Transform") as {
      kind: "Transform";
      target: string;
      from: string;
    };
    expect(transformed.from).toBe(ysera.instanceId);
    expect(transformed.target).toBe(friendly.instanceId);
  });

  it("does nothing if Ysera is the only friendly minion", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    const enemy = instantiate(getMinion("rockpool_hunter"));
    const r = simulateCombat([ysera], [enemy], makeRng(0));
    const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
    expect(transformEvents.length).toBe(0);
  });

  it("transforms a random minion when multiple friendly minions exist", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    const friendly1 = instantiate(getMinion("murloc_tidehunter"));
    const friendly2 = instantiate(getMinion("rockpool_hunter"));
    const enemy = instantiate(getMinion("venomous_crasher"));
    // Run multiple times with different seeds to verify randomness
    const targets = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const r = simulateCombat([ysera, friendly1, friendly2], [enemy], makeRng(i));
      const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
      expect(transformEvents.length).toBe(1);
      const target = (transformEvents[0] as { target: string }).target;
      targets.add(target);
    }
    // Should have transformed different minions across runs
    expect(targets.size).toBeGreaterThan(1);
  });

  it("transformed minion has 0 ATK and 5 HP with Taunt after combat", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    // Use a high-HP friendly minion that will survive combat
    const friendly = defineMinion({
      id: "test_friendly",
      name: "Test Friendly",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    // Enemy with 0 ATK so it can't deal damage back — ensures transformed minion survives
    const enemy = defineMinion({
      id: "weak_enemy",
      name: "Weak Enemy",
      tier: 1,
      tribes: [],
      baseAtk: 0,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat([ysera, instantiate(friendly)], [instantiate(enemy)], makeRng(0));
    // Find the Transform event to get the target's instance ID
    const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
    expect(transformEvents.length).toBe(1);
    const transformEvent = transformEvents[0] as { target: string };
    // Check the survivors for the transformed minion's final state
    const transformedSurvivor = r.survivorsLeft.find((m) => m.instanceId === transformEvent.target);
    // The transformed minion should survive with full 5 HP (enemy has 0 ATK)
    expect(transformedSurvivor).toBeDefined();
    expect(transformedSurvivor!.atk).toBe(0);
    expect(transformedSurvivor!.hp).toBe(5);
    expect(transformedSurvivor!.keywords.has("taunt")).toBe(true);
  });
});
