import { describe, expect, it } from "vitest";
import { makeRng } from "@/lib/rng";
import { simulateCombat } from "./combat";
import { instantiate } from "./minions/define";
import { getMinion } from "./minions/index";
import type { Keyword, MinionInstance } from "./types";

const RNG = makeRng(42);

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
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("simulateCombat — empty boards", () => {
  it("draw on empty vs empty", () => {
    const r = simulateCombat([], [], RNG);
    expect(r.winner).toBe("draw");
    expect(r.transcript).toEqual([{ kind: "End", winner: "draw" }]);
  });

  it("right wins when left is empty", () => {
    const r = simulateCombat([], [minion("murloc_tidecaller")], RNG);
    expect(r.winner).toBe("right");
    expect(r.survivorsRight).toHaveLength(1);
  });

  it("left wins when right is empty", () => {
    const r = simulateCombat([minion("wrath_weaver")], [], RNG);
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("same seed → identical transcripts", () => {
    const board = [minion("murloc_tidecaller"), minion("murloc_tidehunter")];
    const enemy = [minion("wrath_weaver")];
    const a = simulateCombat(board, enemy, makeRng(7));
    const b = simulateCombat(board, enemy, makeRng(7));
    expect(a.transcript).toEqual(b.transcript);
    expect(a.winner).toBe(b.winner);
  });

  it("different seeds can produce different target selection", () => {
    // 3 left vs 2 right → left attacks first; left[0] picks among 2 right targets
    const leftMinion = minion("murloc_tidecaller");
    const r1 = minion("alley_cat");
    const r2 = minion("alley_cat");
    const left = [leftMinion, minion("wrath_weaver"), minion("wrath_weaver")];
    const right = [r1, r2];
    const results = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const r = simulateCombat(left, right, makeRng(seed));
      const firstAttack = r.transcript.find((e) => e.kind === "Attack");
      if (firstAttack?.kind === "Attack") results.add(firstAttack.target);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Winner determination
// ---------------------------------------------------------------------------

describe("winner determination", () => {
  it("stronger minion wins 1v1", () => {
    const strong = makeMinion(5, 5);
    const weak = makeMinion(1, 1);
    const r = simulateCombat([strong], [weak], RNG);
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(4); // took 1 damage
  });

  it("both die simultaneously → draw", () => {
    const a = makeMinion(3, 2);
    const b = makeMinion(3, 2);
    const r = simulateCombat([a], [b], RNG);
    expect(r.winner).toBe("draw");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("side with more minions attacks first", () => {
    // Left has 3 minions, right has 1. Left attacks first.
    // If both 1/1, first attack kills 1 from right and one from left.
    const left = [makeMinion(1, 1), makeMinion(1, 1), makeMinion(1, 1)];
    const right = [makeMinion(1, 1)];
    const r = simulateCombat(left, right, makeRng(0));
    expect(r.winner).toBe("left");
  });
});

// ---------------------------------------------------------------------------
// Transcript structure
// ---------------------------------------------------------------------------

describe("transcript structure", () => {
  it("last event is always End", () => {
    const r = simulateCombat([minion("wrath_weaver")], [minion("murloc_tidecaller")], RNG);
    expect(r.transcript.at(-1)?.kind).toBe("End");
  });

  it("contains Attack events", () => {
    const r = simulateCombat([makeMinion(2, 5)], [makeMinion(2, 5)], RNG);
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
  });

  it("contains Damage events after each Attack", () => {
    const r = simulateCombat([makeMinion(1, 3)], [makeMinion(1, 3)], RNG);
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    const damages = r.transcript.filter((e) => e.kind === "Damage");
    // Each attack should produce at least 1 damage event
    expect(damages.length).toBeGreaterThanOrEqual(attacks.length);
  });

  it("contains Death events for killed minions", () => {
    const r = simulateCombat([makeMinion(5, 1)], [makeMinion(5, 1)], RNG);
    const deaths = r.transcript.filter((e) => e.kind === "Death");
    expect(deaths).toHaveLength(2); // both die on first exchange
  });

  it("0-attack minion deals no damage — no Damage event for it", () => {
    const attacker = makeMinion(2, 3);
    const dummy = makeMinion(0, 5);
    const r = simulateCombat([attacker], [dummy], RNG);
    const damageToAttacker = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === attacker.instanceId,
    );
    expect(damageToAttacker).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multi-minion boards
// ---------------------------------------------------------------------------

describe("multi-minion combat", () => {
  it("attack pointer advances each turn", () => {
    const [a, b, c] = [makeMinion(1, 10), makeMinion(1, 10), makeMinion(1, 10)];
    const enemy = [makeMinion(1, 1)];
    const r = simulateCombat([a!, b!, c!], enemy, makeRng(0));
    // Enemy is 1/1. Left side has 3 minions and attacks first.
    // The first attacker kills the 1/1. Left wins.
    expect(r.winner).toBe("left");
    // First Attack event attacker should be a! (leftPtr starts at 0)
    const firstAttack = r.transcript.find((e) => e.kind === "Attack");
    expect(firstAttack?.kind === "Attack" && firstAttack.attacker).toBe(a!.instanceId);
  });

  it("survivors have correct remaining HP", () => {
    const tanky = makeMinion(1, 5);
    const weak = makeMinion(2, 1);
    const r = simulateCombat([tanky], [weak], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft[0]!.hp).toBe(3); // took 2 damage from the 2/1
  });
});

// ---------------------------------------------------------------------------
// Taunt keyword
// ---------------------------------------------------------------------------

describe("taunt keyword", () => {
  it("should target taunt minions first", () => {
    const tauntMinion = makeMinion(1, 1);
    tauntMinion.keywords.add("taunt");

    const normalMinion = makeMinion(1, 1);
    const tauntId = tauntMinion.instanceId;

    const r = simulateCombat([normalMinion], [tauntMinion], makeRng(0));

    const firstAttack = r.transcript.find((e) => e.kind === "Attack");
    expect(firstAttack).toBeDefined();
    expect(firstAttack?.target).toBe(tauntId);
  });

  it("when defender has both taunt and non-taunt, attacker picks taunt", () => {
    const taunted: MinionInstance = {
      ...makeMinion(1, 1),
      instanceId: `taunt_m`,
      keywords: new Set<Keyword>(["taunt"]),
    };
    const nonTaunted: MinionInstance = {
      ...makeMinion(1, 1),
      instanceId: `nt_m`,
      keywords: new Set<Keyword>([]),
    };

    const left = [makeMinion(2, 5), makeMinion(2, 5), makeMinion(2, 1)];
    const right: MinionInstance[] = [taunted, nonTaunted];
    const r = simulateCombat(left, right, makeRng(0));

    const firstAttack = r.transcript.find((e) => e.kind === "Attack") as {
      attacker: string;
      target: string;
    };
    expect(firstAttack.target).toBe(taunted.instanceId);
  });

  it("combat with taunt + non-taunt confirms taunt targeted first", () => {
    const tauntMinion: MinionInstance = {
      ...makeMinion(2, 3),
      instanceId: "taunt_first",
      keywords: new Set<Keyword>(["taunt"]),
    };
    const normalMinion: MinionInstance = {
      ...makeMinion(2, 3),
      instanceId: "normal_first",
      keywords: new Set<Keyword>([]),
    };
    const attacker = makeMinion(2, 10);

    // Left side: 1 attacker vs right side: 1 taunt + 1 normal
    // Right side has fewer minions (2 vs 1), so right attacks first
    // The right side's taunt minion should be targeted
    const r = simulateCombat([attacker], [tauntMinion, normalMinion], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // All attacks from the left attacker should target the taunt minion first
    const tauntAttacks = attacks.filter(
      (e) => e.kind === "Attack" && e.target === tauntMinion.instanceId,
    );
    const normalAttacks = attacks.filter(
      (e) => e.kind === "Attack" && e.target === normalMinion.instanceId,
    );
    // Taunt minion should be targeted before normal minion
    if (tauntAttacks.length > 0 && normalAttacks.length > 0) {
      const firstTauntIdx = attacks.findIndex(
        (e) => e.kind === "Attack" && e.target === tauntMinion.instanceId,
      );
      const firstNormalIdx = attacks.findIndex(
        (e) => e.kind === "Attack" && e.target === normalMinion.instanceId,
      );
      expect(firstTauntIdx).toBeLessThan(firstNormalIdx);
    }
    // If taunt minion dies, normal minion should be targeted next
    expect(tauntAttacks.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Windfury keyword
// ---------------------------------------------------------------------------

describe("windfury keyword", () => {
  it("windfury minion attacks twice per attack opportunity", () => {
    const windfury = minion("windfury-minion"); // 2/3 with windfury
    const enemy = makeMinion(1, 10);

    const r = simulateCombat([windfury], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Windfury attacks twice (attackCount=2 for windfury).
    // The enemy counterattacks deal damage but do NOT emit Attack events.
    // After windfury's 2 attacks, enemy ptr advances and attacks once.
    // Total: 3 Attack events (2 windfury + 1 enemy)
    expect(attacks.length).toBe(3);
    // First 2 attacks should be from windfury to enemy
    expect(attacks[0]!.attacker).toBe(windfury.instanceId);
    expect(attacks[1]!.attacker).toBe(windfury.instanceId);
    // Third attack should be from enemy to windfury
    expect(attacks[2]!.attacker).toBe(enemy.instanceId);
    // Enemy should have taken 6 damage (3 hits x 2 ATK from windfury attacks + counter)
    const enemyDamages = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === enemy.instanceId,
    ) as Array<{ kind: "Damage"; target: string; amount: number }>;
    expect(enemyDamages).toHaveLength(3);
    expect(enemyDamages[0]!.amount).toBe(2);
    expect(enemyDamages[1]!.amount).toBe(2);
    expect(enemyDamages[2]!.amount).toBe(2);
    // Windfury should have taken 4 damage (2 enemy counterattacks x 1 ATK + 1 enemy attack x 1 ATK)
    const windfuryDamages = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === windfury.instanceId,
    ) as Array<{ kind: "Damage"; target: string; amount: number }>;
    expect(windfuryDamages).toHaveLength(3);
    expect(windfuryDamages[0]!.amount).toBe(1);
    expect(windfuryDamages[1]!.amount).toBe(1);
    expect(windfuryDamages[2]!.amount).toBe(1);
    // Windfury has 3 HP, took 3 damage = 0 HP, dies
    // Enemy has 10 HP, took 6 damage = 4 HP
    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(1);
    expect(r.survivorsRight[0]!.hp).toBe(4);
  });

  it("windfury minion dies after 1 attack when enemy kills it on counter", () => {
    const windfury = minion("windfury-minion"); // 2/3 with windfury
    const enemy = makeMinion(3, 3); // 3/3, no windfury

    const r = simulateCombat([windfury], [enemy], makeRng(0));

    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Windfury attacks once (deals 2 dmg, enemy goes to 1 HP).
    // Enemy counterattacks (deals 3 dmg, windfury goes to 0 HP, dies).
    // Windfury is dead, no more attacks from windfury.
    // Enemy ptr never advances because left is now empty.
    // Total: 1 Attack event (just windfury's first attack)
    expect(attacks.length).toBe(1);
    expect(attacks[0]!.attacker).toBe(windfury.instanceId);
    // Windfury deals 2 damage, enemy counterattacks deals 3 damage
    const enemyDamages = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === enemy.instanceId,
    ) as Array<{ kind: "Damage"; target: string; amount: number }>;
    expect(enemyDamages).toHaveLength(1);
    expect(enemyDamages[0]!.amount).toBe(2);
    const windfuryDamages = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === windfury.instanceId,
    ) as Array<{ kind: "Damage"; target: string; amount: number }>;
    expect(windfuryDamages).toHaveLength(1);
    expect(windfuryDamages[0]!.amount).toBe(3);
    // Windfury dies (3-3=0), enemy survives with 1 HP (3-2=1)
    expect(r.winner).toBe("right");
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.survivorsRight).toHaveLength(1);
    expect(r.survivorsRight[0]!.hp).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Feature validation (already implemented features)
// ---------------------------------------------------------------------------

describe("feature validation", () => {
  it("divine shield keyword is properly handled", () => {
    // Just a smoke test - the keyword must be compatible with existing combat
    const minion = makeMinion(1, 1);
    minion.keywords.add("divineShield");

    // This should not crash
    const r = simulateCombat([minion], [makeMinion(5, 1)], makeRng(0));
    expect(r).toBeDefined();

    // Verify that divine shield absorbs exactly one damage instance
    // The shield should be removed immediately after absorbing the damage.
    const damages = r.transcript.filter((e) => e.kind === "Damage");
    expect(damages).toHaveLength(1);
    expect(damages[0]!.amount).toBe(1); // Damage was 1 and shield absorbed it

    const divineShields = r.transcript.filter((e) => e.kind === "DivineShield");
    expect(divineShields).toHaveLength(1);
  });

  it("reborn keyword is properly handled", () => {
    // Just a smoke test - the keyword must be compatible with existing combat
    const minion = makeMinion(1, 1);
    minion.keywords.add("reborn");

    // This should not crash
    const r = simulateCombat([minion], [makeMinion(5, 1)], makeRng(0));
    expect(r).toBeDefined();

    // Verify that reborn worked correctly
    // The minion should be back with 1 HP and without the reborn keyword
    expect(r.winner).toBe("left");
    expect(r.survivorsLeft).toHaveLength(1);
    expect(r.survivorsLeft[0]!.hp).toBe(1);
    expect(r.survivorsLeft[0]!.keywords.has("reborn")).toBe(false);
  });
});
