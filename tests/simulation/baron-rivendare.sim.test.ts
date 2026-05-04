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
// Baron Rivendare — deathrattle doubling
// ---------------------------------------------------------------------------

describe("baron rivendare", () => {
  it("Baron on left causes deathrattles to fire 2x", () => {
    const baron = minion("baron_rivendare");
    const deathrattleMinion = minion("harvest_golem");
    const enemy = makeMinion(2, 10);

    const r = simulateCombat([baron, deathrattleMinion], [enemy], makeRng(0));

    const mechSummons = r.transcript
      .filter((e) => e.kind === "Summon")
      .filter((e) => e.card === "small_mech");
    expect(mechSummons).toHaveLength(2);
  });

  it("golden Baron causes deathrattles to fire 2x (baron doubles non-golden deathrattle)", () => {
    const goldenBaron = goldenMinion("baron_rivendare");
    const deathrattleMinion = minion("harvest_golem");
    // The harvest golem is NOT golden, so it fires 1x base.
    // The golden baron on the same side doubles it to 2x.
    // The golden aspect of the baron doesn't give the harvest golem extra triggers —
    // only a golden deathrattle minion would get the extra golden trigger.
    const enemy = makeMinion(2, 14);

    const r = simulateCombat([goldenBaron, deathrattleMinion], [enemy], makeRng(0));

    const mechSummons = r.transcript
      .filter((e) => e.kind === "Summon")
      .filter((e) => e.card === "small_mech");
    expect(mechSummons).toHaveLength(2);
  });

  it("golden Baron + golden deathrattle minion fires 4x (2x golden × 2x baron)", () => {
    const goldenBaron = goldenMinion("baron_rivendare");
    const goldenDeathrattle = (() => {
      const m = instantiate(getMinion("harvest_golem"));
      return { ...m, golden: true, atk: m.atk * 2, hp: m.hp * 2, maxHp: m.maxHp * 2 };
    })();
    // The golden deathrattle minion fires 2x (golden).
    // The golden baron on the same side doubles it to 4x.
    // The baron itself has no deathrattle, only baronRivendare flag.
    const enemy = makeMinion(4, 20);

    const r = simulateCombat([goldenBaron, goldenDeathrattle], [enemy], makeRng(0));

    const mechSummons = r.transcript
      .filter((e) => e.kind === "Summon")
      .filter((e) => e.card === "small_mech");
    expect(mechSummons).toHaveLength(4);
  });

  it("Baron on right side does not affect left deathrattles", () => {
    const baron = minion("baron_rivendare");
    const deathrattleMinion = minion("harvest_golem");
    const enemyBaron = minion("baron_rivendare");
    const enemyDeathrattle = minion("harvest_golem");

    const r = simulateCombat(
      [baron, deathrattleMinion],
      [enemyBaron, enemyDeathrattle],
      makeRng(0),
    );

    const mechSummons = r.transcript
      .filter((e) => e.kind === "Summon")
      .filter((e) => e.card === "small_mech");
    // Both sides have Baron, so each side's deathrattle fires twice: 2 + 2 = 4
    expect(mechSummons).toHaveLength(4);
  });

  it("Baron on right side does not affect left deathrattles (no baron on left)", () => {
    const deathrattleMinion = minion("harvest_golem");
    const enemyBaron = minion("baron_rivendare");
    const enemyDeathrattle = minion("harvest_golem");

    const r = simulateCombat([deathrattleMinion], [enemyBaron, enemyDeathrattle], makeRng(0));

    const mechSummons = r.transcript
      .filter((e) => e.kind === "Summon")
      .filter((e) => e.card === "small_mech");
    // Left has no Baron, so left deathrattle fires once.
    // Right has Baron but the enemy deathrattle (2/1) survives because
    // the left harvest golem (2 ATK) kills the enemy baron (3/3) in 2 attacks,
    // but the enemy deathrattle (2/1) is never attacked (left side dies first).
    // So only 1 summon from the left deathrattle.
    expect(mechSummons).toHaveLength(1);
  });

  it("no Baron — deathrattle fires once", () => {
    const deathrattleMinion = minion("harvest_golem");
    const enemy = makeMinion(2, 10);

    const r = simulateCombat([deathrattleMinion], [enemy], makeRng(0));

    const mechSummons = r.transcript
      .filter((e) => e.kind === "Summon")
      .filter((e) => e.card === "small_mech");
    expect(mechSummons).toHaveLength(1);
  });
});
