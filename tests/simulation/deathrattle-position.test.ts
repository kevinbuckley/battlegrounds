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

describe("deathrattle summon position", () => {
  it("summoned minion appears at the dead minion's board index, not appended", () => {
    // Board: [drMinion, ally1, ally2] vs [killer]
    // drMinion dies → deathrattle summons a token.
    // The token should appear at index 0 (where drMinion was),
    // NOT at the end (index 3).

    const drMinion = defineMinion({
      id: "dr_position_test",
      name: "DR Position Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          const token = defineMinion({
            id: "dr_token",
            name: "DR Token",
            tier: 1,
            tribes: [],
            baseAtk: 1,
            baseHp: 1,
            baseKeywords: [],
            spellDamage: 0,
            hooks: {},
          });
          const tokenInst = instantiate(token);
          // Append to the board (this is what real deathrattles do).
          // The combat system should reposition it to the dead minion's index.
          ctx.left.push(tokenInst);
          ctx.emit({
            kind: "Summon",
            card: tokenInst.cardId,
            side: "left",
            position: ctx.left.length - 1,
          });
        },
      },
    });

    const drInst = instantiate(drMinion);
    const ally1 = make(1, 5);
    const ally2 = make(1, 5);
    const killer = make(2, 10);

    // Board: [drMinion(0), ally1(1), ally2(2)] vs [killer]
    const r = simulateCombat([drInst, ally1, ally2], [killer], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents).toHaveLength(1);

    // The summoned minion should be at position 0 (where drMinion was),
    // NOT at position 3 (appended to end).
    const summonEvent = summonEvents[0] as {
      kind: "Summon";
      position: number;
      card: string;
    };
    expect(summonEvent.position).toBe(0);
  });

  it("summoned minion from middle position goes to middle index", () => {
    // Board: [ally1, drMinion, ally2] vs [killer]
    // drMinion is at index 1. When it dies and summons a token,
    // the token should go to index 1, not index 3.

    const drMinion = defineMinion({
      id: "dr_middle_test",
      name: "DR Middle Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          const token = defineMinion({
            id: "dr_middle_token",
            name: "DR Middle Token",
            tier: 1,
            tribes: [],
            baseAtk: 1,
            baseHp: 1,
            baseKeywords: [],
            spellDamage: 0,
            hooks: {},
          });
          const tokenInst = instantiate(token);
          // Append to the board (this is what real deathrattles do).
          ctx.left.push(tokenInst);
          ctx.emit({
            kind: "Summon",
            card: tokenInst.cardId,
            side: "left",
            position: ctx.left.length - 1,
          });
        },
      },
    });

    const drInst = instantiate(drMinion);
    const ally1 = make(1, 5);
    const ally2 = make(1, 5);
    const killer = make(2, 10);

    // Board: [ally1(0), drMinion(1), ally2(2)] vs [killer]
    const r = simulateCombat([ally1, drInst, ally2], [killer], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents).toHaveLength(1);

    const summonEvent = summonEvents[0] as {
      kind: "Summon";
      position: number;
    };
    // The dead minion was at index 1, so the token should be at position 1
    expect(summonEvent.position).toBe(1);
  });

  it("Harvest Golem's summoned mech appears at the dead minion's position", () => {
    // Harvest Golem (2/2, deathrattle: summon 2/1 Mech) dies and summons a mech.
    // The mech should appear at Harvest Golem's board index, not appended.
    const hg = instantiate(getMinion("harvest_golem"));
    const ally = make(1, 5);
    const killer = make(3, 10);

    // Board: [HarvestGolem(0), ally(1)] vs [killer]
    const r = simulateCombat([hg, ally], [killer], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents).toHaveLength(1);

    const summonEvent = summonEvents[0] as {
      kind: "Summon";
      position: number;
      card: string;
    };
    expect(summonEvent.card).toBe("small_mech");
    // Harvest Golem was at index 0, so the mech should be at position 0
    expect(summonEvent.position).toBe(0);
  });

  it("deathrattle summon on right side goes to correct index", () => {
    // Board: [killer] vs [drMinion, ally1, ally2]
    // drMinion is on the right side at index 0.
    // When it dies, the summoned token should go to index 0 on the right.

    const drMinion = defineMinion({
      id: "dr_right_test",
      name: "DR Right Test",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 1,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {
        onDeath: (ctx) => {
          const token = defineMinion({
            id: "dr_right_token",
            name: "DR Right Token",
            tier: 1,
            tribes: [],
            baseAtk: 1,
            baseHp: 1,
            baseKeywords: [],
            spellDamage: 0,
            hooks: {},
          });
          const tokenInst = instantiate(token);
          ctx.right.push(tokenInst);
          ctx.emit({
            kind: "Summon",
            card: tokenInst.cardId,
            side: "right",
            position: ctx.right.length - 1,
          });
        },
      },
    });

    const drInst = instantiate(drMinion);
    const ally1 = make(1, 5);
    const ally2 = make(1, 5);
    const killer = make(2, 10);

    // Board: [killer] vs [drMinion(0), ally1(1), ally2(2)]
    // Right side attacks first (seed 0 with 1v3).
    const r = simulateCombat([killer], [drInst, ally1, ally2], makeRng(0));

    const summonEvents = r.transcript.filter((e) => e.kind === "Summon");
    expect(summonEvents).toHaveLength(1);

    const summonEvent = summonEvents[0] as {
      kind: "Summon";
      position: number;
    };
    expect(summonEvent.position).toBe(0);
  });
});
