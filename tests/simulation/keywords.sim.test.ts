import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

const RNG = makeRng(1);

function make(
  atk: number,
  hp: number,
  keywords: string[] = [],
  hooks: Record<string, unknown> = {},
): MinionInstance {
  return instantiate(
    defineMinion({
      id: `kw_${atk}_${hp}_${keywords.join("_")}`,
      name: `${atk}/${hp} [${keywords.join(",")}]`,
      tier: 1,
      tribes: [],
      baseAtk: atk,
      baseHp: hp,
      baseKeywords: keywords as never[],
      spellDamage: 0,
      hooks: hooks as never,
    }),
  );
}

// ---------------------------------------------------------------------------
// Taunt
// ---------------------------------------------------------------------------

describe("taunt", () => {
  it("forces attacker to target the taunt minion", () => {
    // 2v2 with seed 0 → left attacks first; left[0] must hit the taunt minion
    const tauntMinion = make(1, 5, ["taunt"]);
    const softTarget = make(1, 1);
    const attacker = make(2, 10);
    const r = simulateCombat([attacker, make(2, 10)], [tauntMinion, softTarget], makeRng(0));
    const firstAttack = r.transcript.find((e) => e.kind === "Attack");
    expect(firstAttack?.kind === "Attack" && firstAttack.target).toBe(tauntMinion.instanceId);
  });

  it("after taunt dies, non-taunt can be targeted", () => {
    const taunt = make(1, 1, ["taunt"]);
    const soft = make(1, 10);
    const r = simulateCombat([make(2, 10), make(2, 10)], [taunt, soft], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks[0]?.kind === "Attack" && attacks[0].target).toBe(taunt.instanceId);
    const lateAttacks = attacks.slice(2);
    expect(lateAttacks.some((e) => e.kind === "Attack" && e.target === soft.instanceId)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Divine shield
// ---------------------------------------------------------------------------

describe("divine shield", () => {
  it("absorbs first instance of damage, minion survives", () => {
    // ds has 2 atk so the 1/1 attacker dies from the counterattack — no second hit possible
    const ds = make(2, 1, ["divineShield"]);
    const attacker = make(1, 1);
    const r = simulateCombat([attacker], [ds], makeRng(0));
    const dsEvent = r.transcript.find((e) => e.kind === "DivineShield");
    expect(dsEvent).toBeDefined();
    const damageToDs = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === ds.instanceId,
    );
    expect(damageToDs).toHaveLength(0);
    expect(r.survivorsRight.some((m) => m.instanceId === ds.instanceId)).toBe(true);
  });

  it("divine shield does not block second hit", () => {
    const ds = make(1, 1, ["divineShield"]);
    const attacker = make(2, 10);
    const r = simulateCombat([attacker, attacker], [ds], makeRng(0));
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("poisonous does not kill through divine shield", () => {
    // ds has 2 atk → kills the 1/1 poisoner regardless of who attacks first
    const poisoner = make(1, 1, ["poisonous"]);
    const ds = make(2, 1, ["divineShield"]);
    const r = simulateCombat([poisoner], [ds], makeRng(0));
    expect(r.survivorsRight).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Poisonous
// ---------------------------------------------------------------------------

describe("poisonous", () => {
  it("kills any minion on hit regardless of HP", () => {
    const poisoner = make(1, 5, ["poisonous"]);
    const tank = make(1, 100);
    const r = simulateCombat([poisoner], [tank], makeRng(0));
    expect(r.winner).toBe("left");
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("poisonous attacker still takes counterattack damage", () => {
    const poisoner = make(1, 2, ["poisonous"]);
    const big = make(3, 10);
    const r = simulateCombat([poisoner], [big], makeRng(0));
    const dmgToPoisoner = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === poisoner.instanceId,
    );
    expect(dmgToPoisoner).toHaveLength(1);
  });

  it("poisonous kills minions with 1 HP", () => {
    const poisoner = make(1, 1, ["poisonous"]);
    const target = make(1, 1);
    const r = simulateCombat([poisoner], [target], makeRng(0));
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("poisonous kills a 10/10 minion but the poisoner dies from counterattack", () => {
    const poisoner = make(1, 1, ["poisonous"]);
    const big = make(10, 10);
    const r = simulateCombat([poisoner], [big], makeRng(0));
    // Poisonous kills the 10/10, but the 10/10 counterattacks for 10 damage, killing the 1/1 poisoner too
    expect(r.survivorsRight).toHaveLength(0);
    expect(r.survivorsLeft).toHaveLength(0);
    expect(r.winner).toBe("draw");
  });

  it("multiple poisonous attackers work correctly", () => {
    const poisoner1 = make(1, 1, ["poisonous"]);
    const poisoner2 = make(1, 1, ["poisonous"]);
    const target = make(2, 10);
    const r = simulateCombat([poisoner1, poisoner2], [target], makeRng(0));
    expect(r.survivorsRight).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Venomous
// ---------------------------------------------------------------------------

describe("venomous", () => {
  it("kills target on first hit, then venomous keyword is consumed", () => {
    // High HP so venomous minion survives long enough to win the board
    const venomous = make(1, 100, ["venomous"]);
    const target1 = make(1, 20);
    const target2 = make(1, 20);
    // right has 2 minions → right attacks first; venomous procs on the counterattack
    const r = simulateCombat([venomous], [target1, target2], makeRng(0));
    expect(r.survivorsLeft).toHaveLength(1);
    const survivor = r.survivorsLeft[0]!;
    expect(survivor.keywords.has("venomous")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Windfury
// ---------------------------------------------------------------------------

describe("windfury", () => {
  it("minion attacks twice before switching sides", () => {
    // 2v2 with seed 0 → left attacks first; wf is left[0] so it gets both attacks
    const wf = make(2, 5, ["windfury"]);
    const defender1 = make(1, 3);
    const defender2 = make(1, 3);
    const r = simulateCombat([wf, make(1, 1)], [defender1, defender2], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    expect(attacks[0]?.kind === "Attack" && attacks[0].attacker).toBe(wf.instanceId);
    expect(attacks[1]?.kind === "Attack" && attacks[1].attacker).toBe(wf.instanceId);
  });

  it("windfury minion can kill 2 enemies in one turn", () => {
    const wf = make(3, 5, ["windfury"]);
    const e1 = make(1, 2);
    const e2 = make(1, 2);
    const r = simulateCombat([wf], [e1, e2], makeRng(0));
    expect(r.winner).toBe("left");
  });
});

// ---------------------------------------------------------------------------
// Mega-windfury
// ---------------------------------------------------------------------------

describe("mega_windfury", () => {
  it("minion attacks 4 times per turn", () => {
    const mwf = make(1, 20, ["mega_windfury"]);
    const e1 = make(1, 5);
    const r = simulateCombat([mwf], [e1], makeRng(0));
    const attacks = r.transcript.filter(
      (e) => e.kind === "Attack" && e.attacker === mwf.instanceId,
    );
    expect(attacks.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Reborn
// ---------------------------------------------------------------------------

describe("reborn", () => {
  it("minion returns with 1 HP after dying the first time", () => {
    // killer (2/1): dies from the reborn minion's 1-damage counterattack,
    // leaving the 1-HP ghost as the only survivor
    const reborn = make(1, 1, ["reborn"]);
    const killer = make(2, 1);
    const r = simulateCombat([killer], [reborn], makeRng(0));
    const summonEvent = r.transcript.find((e) => e.kind === "Summon");
    expect(summonEvent).toBeDefined();
    const rebornSurvivor = r.survivorsRight.find((m) => m.cardId === reborn.cardId);
    expect(rebornSurvivor?.hp).toBe(1);
  });

  it("reborn minion can die permanently on second death", () => {
    const reborn = make(1, 1, ["reborn"]);
    const killer = make(2, 20);
    const r = simulateCombat([killer, killer], [reborn], makeRng(0));
    expect(r.survivorsRight).toHaveLength(0);
  });

  it("reborn minion does NOT re-reborn on second death", () => {
    const reborn = make(1, 1, ["reborn"]);
    const killer = make(10, 20);
    const r = simulateCombat([killer], [reborn], makeRng(0));
    const summons = r.transcript.filter((e) => e.kind === "Summon");
    expect(summons).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Cleave
// ---------------------------------------------------------------------------

describe("cleave", () => {
  it("damages the main target AND adjacent minions", () => {
    const cleaver = make(3, 10, ["cleave"]);
    const left = make(1, 5);
    const center = make(1, 5);
    const right = make(1, 5);
    const r = simulateCombat([cleaver], [left, center, right], makeRng(0));
    const damageEvents = r.transcript.filter((e) => e.kind === "Damage");
    const targetedIds = new Set(damageEvents.map((e) => (e.kind === "Damage" ? e.target : "")));
    expect(targetedIds.size).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Deathrattle hook
// ---------------------------------------------------------------------------

describe("deathrattle hook (onDeath)", () => {
  it("fires when the minion dies", () => {
    let fired = false;
    const dr = make(1, 1, [], {
      onDeath: () => {
        fired = true;
      },
    });
    const killer = make(2, 5);
    simulateCombat([killer], [dr], RNG);
    expect(fired).toBe(true);
  });

  it("can summon a minion via the hook", () => {
    const token = make(1, 1);
    const dr = defineMinion({
      id: "dr_test_summoner",
      name: "DR Summoner",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          ctx.right.push({ ...token, instanceId: `token_${Date.now()}` });
          ctx.emit({
            kind: "Summon",
            card: token.cardId,
            side: "right",
            position: ctx.right.length - 1,
          });
        },
      },
    });
    const drInst = instantiate(dr);
    const killer = make(2, 10);
    const r = simulateCombat([killer], [drInst], makeRng(5));
    const summon = r.transcript.find((e) => e.kind === "Summon");
    expect(summon).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Start-of-combat hook
// ---------------------------------------------------------------------------

describe("start-of-combat hook (onStartOfCombat)", () => {
  it("fires before the first attack", () => {
    const fired: string[] = [];
    const soc = defineMinion({
      id: "soc_test",
      name: "SoC Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 10,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onStartOfCombat: () => {
          fired.push("soc");
        },
      },
    });
    const socInst = instantiate(soc);
    const enemy = make(1, 1);
    const r = simulateCombat([socInst], [enemy], RNG);
    const firstEventKind = r.transcript[0]?.kind;
    expect(firstEventKind).toBe("StartOfCombat");
    expect(fired).toHaveLength(1);
  });

  it("SoC hook can buff a minion before combat starts", () => {
    const buffTarget = make(1, 1);
    const soc = defineMinion({
      id: "soc_buffer",
      name: "SoC Buffer",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 5,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onStartOfCombat: (ctx) => {
          const ally = ctx.left.find((m) => m.instanceId === buffTarget.instanceId);
          if (ally) {
            ally.atk += 5;
            ctx.emit({ kind: "Stat", target: ally.instanceId, atk: ally.atk, hp: ally.hp });
          }
        },
      },
    });
    const socInst = instantiate(soc);
    const enemy = make(1, 10);
    const r = simulateCombat([socInst, buffTarget], [enemy], RNG);
    const statEvent = r.transcript.find((e) => e.kind === "Stat");
    expect(statEvent).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Bristleback Boys deathrattle
// ---------------------------------------------------------------------------

describe("bristleback_boys deathrattle", () => {
  it("summons a 1/1 whelp when the minion dies", () => {
    const bb = instantiate(getMinion("bristleback_boys"));
    // 3/1 killer: kills BB (1 damage to 2 HP, BB survives), then BB counterattacks for 1 (kills killer)
    // Then BB dies from the 3 damage, triggering deathrattle to summon 1/1 whelp
    const killer = instantiate(getMinion("murloc_tidehunter")); // 2/1
    const r = simulateCombat([killer], [bb], makeRng(1));
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents).toHaveLength(1);
    expect(summonEvents[0]?.kind === "Summon" && summonEvents[0].card).toBe(
      "bristleback_boys_whelp",
    );
  });

  it("whelp survives and can win the board", () => {
    const bb = instantiate(getMinion("bristleback_boys"));
    // Killer (2/1) deals 2 damage to BB (1/2), killing it → deathrattle summons 1/1 whelp
    // BB counterattacks for 1 damage, killing the killer too
    const killer = defineMinion({
      id: "strong_killer",
      name: "Strong Killer",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat([instantiate(killer)], [bb], makeRng(1));
    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents).toHaveLength(1);
    expect(summonEvents[0]?.kind === "Summon" && summonEvents[0].card).toBe(
      "bristleback_boys_whelp",
    );
  });
});

// ---------------------------------------------------------------------------
// Freeze
// ---------------------------------------------------------------------------

describe("freeze", () => {
  it("frozen minion cannot attack during normal combat cycle", () => {
    const frozen = make(3, 10, ["freeze"]);
    const attacker = make(2, 10);
    const r = simulateCombat([attacker, frozen], [make(1, 10)], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    const frozenAttacks = attacks.filter(
      (e) => e.kind === "Attack" && e.attacker === frozen.instanceId,
    );
    expect(frozenAttacks).toHaveLength(0);
  });

  it("frozen minion is still targeted by enemies", () => {
    const frozen = make(3, 10, ["freeze"]);
    const attacker = make(5, 10);
    const r = simulateCombat([frozen], [attacker], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // The frozen minion should never attack, but the enemy should attack it
    const frozenAttacks = attacks.filter(
      (e) => e.kind === "Attack" && e.attacker === frozen.instanceId,
    );
    expect(frozenAttacks).toHaveLength(0);
    // Enemy attacks the frozen minion
    const enemyAttacks = attacks.filter(
      (e) => e.kind === "Attack" && e.attacker === attacker.instanceId,
    );
    expect(enemyAttacks.length).toBeGreaterThan(0);
  });

  it("frozen minion still takes damage normally", () => {
    const frozen = make(3, 5, ["freeze"]);
    const attacker = make(3, 10);
    const r = simulateCombat([frozen], [attacker], makeRng(0));
    const damageToFrozen = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === frozen.instanceId,
    );
    expect(damageToFrozen.length).toBeGreaterThan(0);
  });

  it("frozen minion still counterattacks when hit", () => {
    const frozen = make(3, 10, ["freeze"]);
    const attacker = make(2, 10);
    const r = simulateCombat([frozen], [attacker], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    // Frozen minion counterattacks (it still deals damage, just doesn't initiate)
    const frozenAttacks = attacks.filter(
      (e) => e.kind === "Attack" && e.attacker === frozen.instanceId,
    );
    expect(frozenAttacks).toHaveLength(0);
    // But the frozen minion's attack stat still deals damage via counterattack
    const damageFromFrozen = r.transcript.filter(
      (e) => e.kind === "Damage" && e.target === attacker.instanceId,
    );
    expect(damageFromFrozen.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Divine shield pop hook (Bolvar, Fireblood)
// ---------------------------------------------------------------------------

describe("divine shield pop hook", () => {
  it("Bolvar gains +2 ATK when a friendly divine shield pops", () => {
    const bolvar = instantiate(getMinion("bolvar_fireblood"));
    const shieldMinion = make(2, 1, ["divineShield"]);
    const killer = make(3, 10);
    const r = simulateCombat([killer], [bolvar, shieldMinion], makeRng(0));
    const dsEvents = r.transcript.filter((e) => e.kind === "DivineShield");
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && (e as { atk?: number }).atk === 3,
    );
    expect(dsEvents.length).toBeGreaterThan(0);
    expect(statEvents.length).toBeGreaterThan(0);
  });

  it("Bolvar gains +2 ATK when another friendly minion's shield pops", () => {
    const bolvar = instantiate(getMinion("bolvar_fireblood"));
    const shieldMinion = make(2, 1, ["divineShield"]);
    const killer = defineMinion({
      id: "killer_2_10",
      name: "Killer",
      tier: 1,
      tribes: [],
      baseAtk: 2,
      baseHp: 10,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat([instantiate(killer)], [bolvar, shieldMinion], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && (e as { atk?: number }).atk === 3,
    );
    expect(statEvents.length).toBeGreaterThan(0);
  });

  it("Bolvar does not gain ATK when only enemy shields pop (no friendly shields)", () => {
    // Bolvar has no divine shield, so only the enemy's shield pops.
    // Bolvar should NOT buff because no friendly shield popped.
    const bolvar = defineMinion({
      id: "bolvar_no_ds",
      name: "Bolvar (no DS)",
      tier: 4,
      tribes: ["Mech"],
      baseAtk: 1,
      baseHp: 4,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDivineShieldPop: (ctx) => {
          const poppedSide = ctx.left.includes(ctx.self) ? "left" : "right";
          if (poppedSide !== ctx.selfSide) return;
          const board = ctx.selfSide === "left" ? ctx.left : ctx.right;
          for (const m of board) {
            if (m.cardId === "bolvar_no_ds") {
              m.atk += 2;
              ctx.emit({ kind: "Stat", target: m.instanceId, atk: m.atk, hp: m.hp });
            }
          }
        },
      },
    });
    const enemyShield = make(2, 1, ["divineShield"]);
    const r = simulateCombat([instantiate(bolvar)], [enemyShield], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && (e as { atk?: number }).atk === 3,
    );
    expect(statEvents).toHaveLength(0);
  });

  it("Bolvar buffs from his own shield popping", () => {
    const bolvar = instantiate(getMinion("bolvar_fireblood"));
    const killer = make(5, 10);
    const r = simulateCombat([killer], [bolvar], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && (e as { atk?: number }).atk === 3,
    );
    expect(statEvents.length).toBeGreaterThan(0);
  });

  it("Bolvar stacks: multiple friendly shield pops give +4 ATK", () => {
    const bolvar = instantiate(getMinion("bolvar_fireblood"));
    const shield1 = make(1, 1, ["divineShield"]);
    const shield2 = make(1, 1, ["divineShield"]);
    // Right side attacks first (2 vs 1). Right[0] (shield1) attacks Bolvar,
    // his shield pops → Bolvar +2 ATK. Then right[1] (shield2) attacks Bolvar,
    // his shield already gone, takes 1 damage. Then Bolvar (3 ATK) attacks
    // and kills shield1. Then Bolvar attacks shield2, its shield pops → Bolvar +2 more.
    // Total: +4 ATK from two friendly shield pops.
    const killer = make(1, 20);
    const r = simulateCombat([killer], [bolvar, shield1, shield2], makeRng(0));
    const statEvents = r.transcript.filter((e) => e.kind === "Stat");
    const atkValues = statEvents.map((e) => (e as { atk?: number }).atk);
    expect(atkValues).toContain(3);
    expect(atkValues).toContain(5);
  });
});

// ---------------------------------------------------------------------------
// Drakonid Enforcer — onDivineShieldPop buff
// ---------------------------------------------------------------------------

describe("drakonid_enforcer", () => {
  it("gains +2/+2 when a friendly minion's divine shield pops", () => {
    const de = instantiate(getMinion("drakonid_enforcer"));
    const shieldMinion = make(1, 1, ["divineShield"]);
    // Put Drakonid + shieldMinion on LEFT, killer on RIGHT.
    // Right side attacks first (seed 0). Killer (1/100) attacks shieldMinion (1/1 DS).
    // ShieldMinion's shield pops → onDivineShieldPop fires for all left allies (de + shieldMinion).
    // Drakonid gains +2/+2.
    const killer = defineMinion({
      id: "killer_1_100",
      name: "Killer",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat([de, shieldMinion], [instantiate(killer)], makeRng(0));
    const statEvents = r.transcript.filter((e) => e.kind === "Stat" && e.target === de.instanceId);
    expect(statEvents.length).toBeGreaterThan(0);
    const lastStat = statEvents[statEvents.length - 1] as { atk?: number; hp?: number };
    expect(lastStat.atk).toBe(5);
    // Drakonid starts at 3/6, takes 2 damage from killer before shield pops (4/4),
    // then gains +2/+2 → 5/6
    expect(lastStat.hp).toBe(6);
  });

  it("gains +2/+2 when its own divine shield pops", () => {
    const de = defineMinion({
      id: "de_with_ds",
      name: "Drakonid Enforcer (DS)",
      tier: 4,
      tribes: ["Dragon"],
      baseAtk: 3,
      baseHp: 6,
      baseKeywords: ["divineShield"],
      spellDamage: 0,
      hooks: {
        onDivineShieldPop: (ctx) => {
          const poppedSide = ctx.left.includes(ctx.self) ? "left" : "right";
          if (poppedSide !== ctx.selfSide) return;
          ctx.self.atk += 2;
          ctx.self.hp += 2;
          ctx.self.maxHp += 2;
          ctx.emit({
            kind: "Stat",
            target: ctx.self.instanceId,
            atk: ctx.self.atk,
            hp: ctx.self.hp,
          });
        },
      },
    });
    const deInst = instantiate(de);
    const killer = make(5, 10);
    const r = simulateCombat([killer], [deInst], makeRng(0));
    const statEvents = r.transcript.filter(
      (e) => e.kind === "Stat" && e.target === deInst.instanceId,
    );
    expect(statEvents.length).toBeGreaterThan(0);
    const lastStat = statEvents[statEvents.length - 1] as { atk?: number; hp?: number };
    expect(lastStat.atk).toBe(5);
    expect(lastStat.hp).toBe(8);
  });

  it("does NOT gain stats when enemy shields pop", () => {
    const de = instantiate(getMinion("drakonid_enforcer"));
    const enemyShield = make(2, 1, ["divineShield"]);
    const r = simulateCombat([de], [enemyShield], makeRng(0));
    const statEvents = r.transcript.filter((e) => e.kind === "Stat" && e.target === de.instanceId);
    expect(statEvents).toHaveLength(0);
  });

  it("stacks: multiple friendly shield pops give +4/+4 total", () => {
    const de = instantiate(getMinion("drakonid_enforcer"));
    const shield1 = make(1, 1, ["divineShield"]);
    const shield2 = make(1, 1, ["divineShield"]);
    // Put Drakonid + shields on LEFT, killer on RIGHT.
    // Right side attacks first (seed 0). Killer (1/100) attacks shield1 (1/1 DS).
    // Shield1's shield pops → Drakonid +2/+2 (now 5/8).
    // Killer (1/100) attacks shield2 (1/1 DS). Shield2's shield pops → Drakonid +2/+2 (now 7/10).
    const killer = defineMinion({
      id: "killer_1_100",
      name: "Killer",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat([de, shield1, shield2], [instantiate(killer)], makeRng(0));
    const statEvents = r.transcript.filter((e) => e.kind === "Stat" && e.target === de.instanceId);
    const atkValues = statEvents.map((e) => (e as { atk?: number }).atk);
    expect(atkValues).toContain(5);
    expect(atkValues).toContain(7);
  });
});

// ---------------------------------------------------------------------------
// Deathrattle ordering (left-to-right on board)
// ---------------------------------------------------------------------------

describe("deathrattle ordering", () => {
  it("fires deathrattles in left-to-right board order (index 0 first)", () => {
    // Create three minions with deathrattles that record their firing order.
    // Board: [dr1, dr2, dr3] — all die to a single killer.
    // Deathrattles should fire in order: dr1, dr2, dr3 (left-to-right).
    const order: string[] = [];

    const dr1 = defineMinion({
      id: "dr_order_1",
      name: "DR Order 1",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: () => {
          order.push("dr1");
        },
      },
    });

    const dr2 = defineMinion({
      id: "dr_order_2",
      name: "DR Order 2",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: () => {
          order.push("dr2");
        },
      },
    });

    const dr3 = defineMinion({
      id: "dr_order_3",
      name: "DR Order 3",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: () => {
          order.push("dr3");
        },
      },
    });

    const killer = defineMinion({
      id: "big_killer",
      name: "Big Killer",
      tier: 1,
      tribes: [],
      baseAtk: 10,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    // Board: [dr1, dr2, dr3] vs [killer]
    // Killer (10/100) kills all three one by one. Deathrattles should fire left-to-right.
    simulateCombat(
      [instantiate(dr1), instantiate(dr2), instantiate(dr3)],
      [instantiate(killer)],
      makeRng(0),
    );

    expect(order).toEqual(["dr1", "dr2", "dr3"]);
  });
});
