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

  it("transforms a random enemy minion into 1/1 Dragon with Taunt at start of combat", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    const friendly = instantiate(getMinion("murloc_tidehunter")); // 2/1
    const enemy = instantiate(getMinion("rockpool_hunter")); // 2/1
    const r = simulateCombat([ysera, friendly], [enemy], makeRng(0));
    const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
    expect(transformEvents.length).toBe(1);
    const transformed = r.transcript.find((e) => e.kind === "Transform") as {
      kind: "Transform";
      target: string;
      from: string;
    };
    expect(transformed.from).toBe(ysera.instanceId);
    expect(transformed.target).toBe(enemy.instanceId);
  });

  it("transforms the only enemy minion when Ysera has no other friendlies", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    const enemy = instantiate(getMinion("rockpool_hunter"));
    const r = simulateCombat([ysera], [enemy], makeRng(0));
    const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
    expect(transformEvents.length).toBe(1);
  });

  it("transforms a random enemy minion when multiple enemy minions exist", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    const friendly = instantiate(getMinion("murloc_tidehunter"));
    const enemy1 = instantiate(getMinion("rockpool_hunter"));
    const enemy2 = instantiate(getMinion("venomous_crasher"));
    const targets = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const r = simulateCombat([ysera, friendly], [enemy1, enemy2], makeRng(i));
      const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
      expect(transformEvents.length).toBe(1);
      const target = (transformEvents[0] as { target: string }).target;
      targets.add(target);
    }
    expect(targets.size).toBeGreaterThan(1);
  });

  it("transformed enemy minion has 1 ATK and 1 HP with Taunt and Dragon tribe after combat", () => {
    const ysera = instantiate(getMinion("ysera_the_dreamer"));
    const friendly = defineMinion({
      id: "friendly",
      name: "Friendly",
      tier: 1,
      tribes: [],
      baseAtk: 0,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const enemy = defineMinion({
      id: "strong_enemy",
      name: "Strong Enemy",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 3,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat([ysera, instantiate(friendly)], [instantiate(enemy)], makeRng(0));
    const transformEvents = r.transcript.filter((e) => e.kind === "Transform");
    expect(transformEvents.length).toBe(1);
    const transformEvent = transformEvents[0] as { target: string };
    // The transformed minion was on the enemy side, so check survivorsRight
    const transformedSurvivor = r.survivorsRight.find(
      (m) => m.instanceId === transformEvent.target,
    );
    expect(transformedSurvivor).toBeDefined();
    expect(transformedSurvivor!.atk).toBe(1);
    expect(transformedSurvivor!.hp).toBe(1);
    expect(transformedSurvivor!.keywords.has("taunt")).toBe(true);
    expect(transformedSurvivor!.tribes).toContain("Dragon");
  });
});
