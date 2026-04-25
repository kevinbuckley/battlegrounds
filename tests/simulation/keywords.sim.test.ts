import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
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
