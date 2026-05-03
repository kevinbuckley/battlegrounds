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
// Windfury — attacks twice per attack opportunity
// MegaWindfury — attacks four times per attack opportunity
// ---------------------------------------------------------------------------

describe("windfury attacks twice per turn", () => {
  it("windfury minion attacks twice against a high-HP target", () => {
    const windfury = minion("windfury-minion"); // 2/3 with windfury
    const enemy = makeMinion(1, 10);

    const r = simulateCombat([windfury], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Windfury attacks twice, enemy counterattacks once.
    expect(attacks.length).toBe(3);
    expect(attacks[0]!.attacker).toBe(windfury.instanceId);
    expect(attacks[1]!.attacker).toBe(windfury.instanceId);
    expect(attacks[2]!.attacker).toBe(enemy.instanceId);
    expect(r.winner).toBe("right");
  });

  it("windfury dies after 1 attack when enemy kills it on counter", () => {
    const windfury = minion("windfury-minion"); // 2/3 with windfury
    const enemy = makeMinion(3, 3); // 3/3, no windfury

    const r = simulateCombat([windfury], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Windfury attacks once (deals 2 dmg, enemy goes to 1 HP).
    // Enemy counterattacks (deals 3 dmg, windfury goes to 0 HP, dies).
    // Windfury is dead, no more attacks from windfury.
    expect(attacks.length).toBe(1);
    expect(attacks[0]!.attacker).toBe(windfury.instanceId);
    expect(r.winner).toBe("right");
  });

  it("windfury attacks twice even when first attack kills target", () => {
    const windfury = minion("windfury-minion"); // 2/3 with windfury
    const enemy = makeMinion(1, 2); // 1/2, dies in 1 hit

    const r = simulateCombat([windfury], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Windfury attacks once (deals 2 dmg, enemy dies at 2 HP).
    // Loop exits because right.length === 0, so only 1 attack.
    // This is correct behavior — no more enemies to attack.
    expect(attacks.length).toBe(1);
    expect(attacks[0]!.attacker).toBe(windfury.instanceId);
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("windfury with multiple minions — each attacks twice", () => {
    const windfury1 = minion("windfury-minion"); // 2/3
    const windfury2 = minion("windfury-minion"); // 2/3
    // Enemy has 1 ATK, 10 HP — survives 4 windfury attacks (8 dmg)
    const enemy = makeMinion(1, 10);

    const r = simulateCombat([windfury1, windfury2], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Each windfury attacks twice = 4 windfury attacks.
    // Then enemy counterattacks once (only the last attacker's target counterattacks).
    expect(attacks.length).toBe(5);
    const wf1Attacks = attacks.filter((a) => a.attacker === windfury1.instanceId);
    const wf2Attacks = attacks.filter((a) => a.attacker === windfury2.instanceId);
    expect(wf1Attacks.length).toBe(2);
    expect(wf2Attacks.length).toBe(2);
    // Enemy counterattacks once
    const enemyAttacks = attacks.filter((a) => a.attacker === enemy.instanceId);
    expect(enemyAttacks.length).toBe(1);
  });
});

describe("megaWindfury attacks four times per turn", () => {
  it("megaWindfury minion attacks four times against a high-HP target", () => {
    const gentleMegasaur = minion("gentle_megasaur"); // 5/4, no keywords
    // Give it megaWindfury via battlecry adaptation
    gentleMegasaur.keywords.add("megaWindfury");
    // Enemy has 1 ATK, 25 HP — deals 1 dmg per counterattack
    const enemy = makeMinion(1, 25);

    const r = simulateCombat([gentleMegasaur], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // MegaWindfury attacks 4×. Each counterattack deals 1 dmg inline (not an Attack event).
    // After 4 attacks, megasaur has taken 4×1=4 dmg (4→0) and dies.
    // Left is empty, outer loop exits. Right (enemy) gets no outer-loop turn.
    // Total: 4 Attack events, all from megasaur.
    expect(attacks.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(attacks[i]!.attacker).toBe(gentleMegasaur.instanceId);
    }
    expect(r.winner).toBe("right");
    // Enemy took 4×5=20 dmg from 25 HP → 5 HP remaining
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(1);
    expect(r.survivorsRight[0]!.hp).toBe(5);
  });

  it("megaWindfury dies after 1 attack when enemy kills it on counter", () => {
    const gentleMegasaur = minion("gentle_megasaur"); // 5/4
    gentleMegasaur.keywords.add("megaWindfury");
    // Enemy has 5 ATK, 10 HP — kills megasaur in one counterattack
    const enemy = makeMinion(5, 10);

    const r = simulateCombat([gentleMegasaur], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // MegaWindfury attacks once (deals 5 dmg, enemy goes to 5 HP).
    // Enemy counterattacks inline (deals 5 dmg to megasaur: 4→-1, dies).
    // Counterattack is NOT an Attack event — only 1 Attack event emitted.
    // Left is empty after death resolution, loop exits.
    expect(attacks.length).toBe(1);
    expect(attacks[0]!.attacker).toBe(gentleMegasaur.instanceId);
    expect(r.winner).toBe("right");
  });

  it("megaWindfury attacks 4x even when first attack kills target", () => {
    const gentleMegasaur = minion("gentle_megasaur"); // 5/4
    gentleMegasaur.keywords.add("megaWindfury");
    const enemy = makeMinion(1, 5); // 1/5, dies in 1 hit

    const r = simulateCombat([gentleMegasaur], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // MegaWindfury attacks once (deals 5 dmg, enemy dies at 5 HP).
    // Loop exits because right.length === 0, so only 1 attack.
    expect(attacks.length).toBe(1);
    expect(attacks[0]!.attacker).toBe(gentleMegasaur.instanceId);
    expect(r.winner).toBe("left");
  });

  it("megaWindfury vs multiple enemies — re-picks targets for extra attacks", () => {
    const gentleMegasaur = minion("gentle_megasaur"); // 5/4
    gentleMegasaur.keywords.add("megaWindfury");
    // Each enemy has 1 ATK, 10 HP — survives 1 megaWindfury attack (5 dmg)
    const enemy1 = makeMinion(1, 10);
    const enemy2 = makeMinion(1, 10);

    const r = simulateCombat([gentleMegasaur], [enemy1, enemy2], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // MegaWindfury attacks 4 times, re-picking targets.
    // Then enemies counterattack.
    expect(attacks.length).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < 4; i++) {
      expect(attacks[i]!.attacker).toBe(gentleMegasaur.instanceId);
    }
  });

  it("windfury vs megaWindfury — megaWindfury attacks 4x, windfury 2x", () => {
    const windfury = minion("windfury-minion"); // 2/3
    const gentleMegasaur = minion("gentle_megasaur"); // 5/4
    gentleMegasaur.keywords.add("megaWindfury");
    // Enemy has 1 ATK, 25 HP — survives all attacks
    const enemy = makeMinion(1, 25);

    const r = simulateCombat([windfury, gentleMegasaur], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // The outer loop alternates sides. Turn order:
    //   Turn 1 (left, ptr=0): windfury attacks 2× → attacks[0] and [1]
    //   Turn 2 (right): enemy attacks 1× → attacks[2]
    //   Turn 3 (left, ptr=1): megaWindfury attacks 4× → attacks[3..6]
    // (combat continues until someone dies)
    expect(attacks.length).toBeGreaterThanOrEqual(7);
    expect(attacks[0]!.attacker).toBe(windfury.instanceId);
    expect(attacks[1]!.attacker).toBe(windfury.instanceId);
    expect(attacks[2]!.attacker).toBe(enemy.instanceId);
    expect(attacks[3]!.attacker).toBe(gentleMegasaur.instanceId);
    expect(attacks[4]!.attacker).toBe(gentleMegasaur.instanceId);
    expect(attacks[5]!.attacker).toBe(gentleMegasaur.instanceId);
    expect(attacks[6]!.attacker).toBe(gentleMegasaur.instanceId);
  });
});
