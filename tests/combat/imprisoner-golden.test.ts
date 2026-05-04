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

function goldenMinion(id: string): MinionInstance {
  const m = instantiate(getMinion(id));
  return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
}

// ---------------------------------------------------------------------------
// Imprisoner — deathrattle summons 2/2 Imp
// ---------------------------------------------------------------------------

describe("imprisoner", () => {
  it("non-golden Imprisoner summons one 2/2 Imp on death", () => {
    const imp = minion("imprisoner");
    const enemy = makeMinion(2, 10);

    const r = simulateCombat([imp], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const impSummons = summonEvents.filter((e) => e.card === "small_imp");
    expect(impSummons).toHaveLength(1);
  });

  it("golden Imprisoner summons two 2/2 Imps on death", () => {
    const goldenImp = goldenMinion("imprisoner");
    const enemy = makeMinion(6, 10);

    const r = simulateCombat([goldenImp], [enemy], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    const impSummons = summonEvents.filter((e) => e.card === "small_imp");
    expect(impSummons).toHaveLength(2);
  });
});
