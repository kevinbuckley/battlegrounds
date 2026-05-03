import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import type { MinionInstance } from "@/game/types";
import { makeRng } from "@/lib/rng";

function make(
  atk: number,
  hp: number,
  keywords: string[] = [],
  hooks: Record<string, unknown> = {},
): MinionInstance {
  return instantiate(
    defineMinion({
      id: `test_${atk}_${hp}_${keywords.join("_")}`,
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
    // Summon a demon token during combat by having a deathrattle summon one.
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
    const demonTokenInst = instantiate(demonToken);

    // Create a minion with deathrattle that summons a demon token.
    const summoner = defineMinion({
      id: "demon_summoner",
      name: "Demon Summoner",
      tier: 1,
      tribes: ["Demon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
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
    const summonerInst = instantiate(summoner);

    // Board: [killer] vs [bf, summonerInst]
    // Killer (2/1) attacks bf (1/6), bf counterattacks for 1 (killer dies).
    // Then killer (if it survived) would attack summoner, but it's dead.
    // We need the summoner to die and summon the demon token so Bigfernal's onSummon fires.
    // Use a stronger killer that can kill both.
    const killer = defineMinion({
      id: "big_killer",
      name: "Big Killer",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const killerInst = instantiate(killer);

    // Board: [killer] vs [bf, summonerInst]
    // Right side attacks first (seed 0 with 1v2).
    // killer attacks bf → bf takes 3 damage (now 1/3), counterattacks for 1 (killer 99 HP).
    // killer attacks summoner → summoner dies, deathrattle summons demon token at index 2.
    // fireSummon fires for all minions when demon token is added.
    // Bigfernal's onSummon sees a demon was summoned → gains +2/+2 (now 3/8).
    const r = simulateCombat([killerInst], [bf, summonerInst], makeRng(0));

    // Check that Bigfernal's stats were buffed.
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
    const nonDemonInst = instantiate(nonDemon);

    const summoner = defineMinion({
      id: "mech_summoner",
      name: "Mech Summoner",
      tier: 1,
      tribes: ["Mech"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
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
    const summonerInst = instantiate(summoner);

    const killer = defineMinion({
      id: "big_killer",
      name: "Big Killer",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const killerInst = instantiate(killer);

    const r = simulateCombat([killerInst], [bf, summonerInst], makeRng(0));

    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    // Bigfernal should NOT have been buffed since the summoned minion is a Mech, not a Demon.
    expect(bfSurvivor!.atk).toBe(1);
    expect(bfSurvivor!.hp).toBe(6);
  });

  it("does NOT gain +2/+2 when itself is summoned", () => {
    // Bigfernal's onSummon should not trigger for itself.
    // We test this by having Bigfernal summoned during combat (via deathrattle).
    const bf = instantiate(getMinion("big_fernal")); // 1/6

    const summoner = defineMinion({
      id: "bf_summoner",
      name: "BF Summoner",
      tier: 1,
      tribes: ["Demon"],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          // Summon another Bigfernal — Bigfernal's onSummon should NOT trigger for itself.
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
    const summonerInst = instantiate(summoner);

    const killer = defineMinion({
      id: "big_killer",
      name: "Big Killer",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const killerInst = instantiate(killer);

    const r = simulateCombat([killerInst], [bf, summonerInst], makeRng(0));

    // The original Bigfernal should NOT have been buffed (the summoned minion
    // is also Bigfernal, and the hook checks for self).
    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    expect(bfSurvivor!.atk).toBe(1);
    expect(bfSurvivor!.hp).toBe(6);
  });

  it("stacks: gains +2/+2 for each friendly demon summoned", () => {
    const bf = instantiate(getMinion("big_fernal")); // 1/6

    // Create two demon summoners that each summon a demon token when they die.
    const makeSummoner = (id: string): MinionInstance => {
      const s = defineMinion({
        id,
        name: "Demon Summoner",
        tier: 1,
        tribes: ["Demon"],
        baseAtk: 1,
        baseHp: 1,
        baseKeywords: [],
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

    const killer = defineMinion({
      id: "big_killer",
      name: "Big Killer",
      tier: 1,
      tribes: [],
      baseAtk: 3,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const killerInst = instantiate(killer);

    // Board: [killer] vs [bf, summoner1, summoner2]
    // Right attacks first (seed 0, 1v3). Killer kills bf, then summoner1, then summoner2.
    // Each summoner's deathrattle summons a demon token → Bigfernal gets +2/+2 per token.
    const r = simulateCombat(
      [killerInst],
      [bf, makeSummoner("s1"), makeSummoner("s2")],
      makeRng(0),
    );

    const bfSurvivor = r.survivorsRight.find((m) => m.cardId === "big_fernal");
    expect(bfSurvivor).toBeDefined();
    // Should have gained +4/+4 from two demon summons (2 × +2/+2).
    expect(bfSurvivor!.atk).toBe(5);
    expect(bfSurvivor!.hp).toBe(14);
  });
});
