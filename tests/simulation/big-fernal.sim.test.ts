import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Bigfernal — onSummon buff when another demon is summoned
// ---------------------------------------------------------------------------

describe("big_fernal", () => {
  it("has correct base stats and demon tribe", () => {
    const bf = instantiate(getMinion("big_fernal"));
    expect(bf.cardId).toBe("big_fernal");
    expect(bf.atk).toBe(1);
    expect(bf.hp).toBe(6);
    expect(bf.tribes).toContain("Demon");
  });

  it("gains +2/+2 when another friendly demon is summoned during combat", () => {
    const bf = instantiate(getMinion("big_fernal")); // 1/6

    const demonToken = defineMinion({
      id: "demon_token",
      name: "Demon Token",
      tier: 1,
      tribes: ["Demon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    // Summoner has Taunt so the killer always targets it, never touching bf.
    // Both summoner and killer (1/1) die on first contact, triggering the deathrattle.
    const summoner = defineMinion({
      id: "demon_summoner",
      name: "Demon Summoner",
      tier: 1,
      tribes: ["Demon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: ["taunt"],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          const token = instantiate(demonToken);
          ctx.right.push(token);
          ctx.emit({
            kind: "Summon",
            card: token.cardId,
            side: "right",
            position: ctx.right.length - 1,
          });
        },
      },
    });

    // killer (1/1): left attacks first (seed 0). Targets summoner (taunt).
    // Both die simultaneously → deathrattle fires → demon token spawns →
    // fireSummon → bf gains +2/+2. No enemies remain → bf survives.
    const killer = defineMinion({
      id: "killer",
      name: "Killer",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const r = simulateCombat(
      [instantiate(killer)],
      [instantiate(summoner), bf],
      makeRng(0),
    );

    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    expect(bfSurvivor!.atk).toBe(3);
    expect(bfSurvivor!.hp).toBe(8);
  });

  it("does NOT gain +2/+2 when a non-demon is summoned", () => {
    const bf = instantiate(getMinion("big_fernal")); // 1/6

    const nonDemon = defineMinion({
      id: "non_demon_token",
      name: "Non-Demon Token",
      tier: 1,
      tribes: ["Mech"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const summoner = defineMinion({
      id: "mech_summoner",
      name: "Mech Summoner",
      tier: 1,
      tribes: ["Mech"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: ["taunt"],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          const token = instantiate(nonDemon);
          ctx.right.push(token);
          ctx.emit({
            kind: "Summon",
            card: token.cardId,
            side: "right",
            position: ctx.right.length - 1,
          });
        },
      },
    });

    const killer = defineMinion({
      id: "killer",
      name: "Killer",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const r = simulateCombat(
      [instantiate(killer)],
      [instantiate(summoner), bf],
      makeRng(0),
    );

    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    expect(bfSurvivor!.atk).toBe(1);
    expect(bfSurvivor!.hp).toBe(6);
  });

  it("does NOT gain +2/+2 when itself is summoned", () => {
    const bf = instantiate(getMinion("big_fernal")); // 1/6

    // Summoner summons another Bigfernal — the cardId check in the hook prevents triggering.
    const summoner = defineMinion({
      id: "bf_summoner",
      name: "BF Summoner",
      tier: 1,
      tribes: ["Demon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: ["taunt"],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          const bfCopy = instantiate(getMinion("big_fernal"));
          ctx.right.push(bfCopy);
          ctx.emit({
            kind: "Summon",
            card: bfCopy.cardId,
            side: "right",
            position: ctx.right.length - 1,
          });
        },
      },
    });

    const killer = defineMinion({
      id: "killer",
      name: "Killer",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });

    const r = simulateCombat(
      [instantiate(killer)],
      [instantiate(summoner), bf],
      makeRng(0),
    );

    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    expect(bfSurvivor!.atk).toBe(1);
    expect(bfSurvivor!.hp).toBe(6);
  });

  it("stacks: gains +2/+2 for each friendly demon summoned", () => {
    const bf = instantiate(getMinion("big_fernal")); // 1/6

    const makeSummoner = (id: string): MinionInstance => {
      const s = defineMinion({
        id,
        name: "Demon Summoner",
        tier: 1,
        tribes: ["Demon"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: ["taunt"],
        spellDamage: 0,
        hooks: {
          onDeath: (ctx) => {
            const token = instantiate(
              defineMinion({
                id: "demon_token",
                name: "Demon Token",
                tier: 1,
                tribes: ["Demon"],
                baseAtk: 1,
                baseHp: 1,
                baseKeywords: [],
                spellDamage: 0,
                hooks: {},
              }),
            );
            ctx.right.push(token);
            ctx.emit({
              kind: "Summon",
              card: token.cardId,
              side: "right",
              position: ctx.right.length - 1,
            });
          },
        },
      });
      return instantiate(s);
    };

    const makeKiller = (id: string): MinionInstance =>
      instantiate(
        defineMinion({
          id,
          name: "Killer",
          tier: 1,
          tribes: [],
          baseAtk: 1,
          baseHp: 1,
          baseKeywords: [],
          spellDamage: 0,
          hooks: {},
        }),
      );

    // 2 killers vs [s1 (taunt), s2 (taunt), bf].
    // Seed 1: right attacks first. s1 targets k1 (random, picks index 0) →
    // both die → demon token1 spawns → bf gains +2/+2 (3/8).
    // Then left: k2 targets s2 (forced by taunt) → both die → demon token2
    // spawns → bf gains +2/+2 (5/10). No enemies remain.
    const r = simulateCombat(
      [makeKiller("k1"), makeKiller("k2")],
      [makeSummoner("s1"), makeSummoner("s2"), bf],
      makeRng(1),
    );

    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    // Two demon summons → 2 × +2/+2 = +4/+4 total.
    expect(bfSurvivor!.atk).toBe(5);
    expect(bfSurvivor!.hp).toBe(10);
  });
});
