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
// Zapp Slywick — rush + lowest-ATK target selection
// ---------------------------------------------------------------------------

describe("zapp-slywick — lowest-ATK target selection", () => {
  it("attacks lowest-ATK enemy instead of random", () => {
    const zapp = minion("zapp_slywick");
    const enemy1 = makeMinion(10, 10);
    const enemy2 = makeMinion(3, 10);
    const enemy3 = makeMinion(7, 10);

    const r = simulateCombat([zapp], [enemy1, enemy2, enemy3], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
    // First attack should target the lowest-ATK enemy (enemy2 atk=3)
    expect(attacks[0]!.target).toBe(enemy2.instanceId);
  });

  it("prioritizes taunt over lowest-ATK", () => {
    const zapp = minion("zapp_slywick");
    const enemyTaunt = makeMinion(8, 8);
    enemyTaunt.keywords.add("taunt");
    const enemyNoTaunt = makeMinion(2, 10);

    const r = simulateCombat([zapp], [enemyTaunt, enemyNoTaunt], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
    // Should target the taunt minion even though it has higher ATK
    expect(attacks[0]!.target).toBe(enemyTaunt.instanceId);
  });

  it("works during rush phase — attacks before normal cycle", () => {
    const zapp = minion("zapp_slywick");
    const enemy = makeMinion(5, 5);

    const r = simulateCombat([zapp], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
    // First attack should be from zapp during rush phase
    expect(attacks[0]!.attacker).toBe(zapp.instanceId);
  });

  it("golden zapp also uses lowest-ATK targeting", () => {
    const zapp = instantiate(getMinion("zapp_slywick"));
    const goldenZapp = {
      ...zapp,
      golden: true,
      atk: zapp.atk * 2,
      hp: zapp.hp * 2,
      maxHp: zapp.maxHp * 2,
    };
    const enemy1 = makeMinion(10, 10);
    const enemy2 = makeMinion(3, 10);
    const enemy3 = makeMinion(7, 10);

    const r = simulateCombat([goldenZapp], [enemy1, enemy2, enemy3], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
    expect(attacks[0]!.target).toBe(enemy2.instanceId);
  });
});
