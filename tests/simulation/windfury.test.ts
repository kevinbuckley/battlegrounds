import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { makeRng } from "@/lib/rng";

function make(
  atk: number,
  hp: number,
  keywords: string[] = [],
  hooks: Record<string, unknown> = {},
) {
  return instantiate(
    defineMinion({
      id: `wf_${atk}_${hp}_${keywords.join("_")}`,
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
// Windfury — attacks twice per turn
// ---------------------------------------------------------------------------

describe("windfury", () => {
  it("attacks exactly twice per turn", () => {
    // 1v2 with seed 0 → left attacks first. Windfury minion (left[0])
    // should attack twice before switching sides.
    const wf = make(3, 10, ["windfury"]);
    const e1 = make(1, 3);
    const e2 = make(1, 3);
    const r = simulateCombat([wf], [e1, e2], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    const wfAttacks = attacks.filter((e) => e.kind === "Attack" && e.attacker === wf.instanceId);
    expect(wfAttacks.length).toBe(2);
  });

  it("windfury can kill 2 enemies in one turn", () => {
    const wf = make(3, 5, ["windfury"]);
    const e1 = make(1, 2);
    const e2 = make(1, 2);
    const r = simulateCombat([wf], [e1, e2], makeRng(0));
    expect(r.winner).toBe("left");
  });
});

// ---------------------------------------------------------------------------
// Mega-windfury — attacks four times per turn
// ---------------------------------------------------------------------------

describe("mega_windfury", () => {
  it("attacks exactly four times per turn", () => {
    // 1v4 with seed 0 → left attacks first. Mega windfury (left[0])
    // should attack 4 times before switching sides.
    const mwf = make(3, 20, ["megaWindfury"]);
    const [e1, e2, e3, e4] = [make(1, 3), make(1, 3), make(1, 3), make(1, 3)];
    const r = simulateCombat([mwf], [e1, e2, e3, e4], makeRng(0));
    const attacks = r.transcript.filter((e) => e.kind === "Attack");
    const mwfAttacks = attacks.filter((e) => e.kind === "Attack" && e.attacker === mwf.instanceId);
    expect(mwfAttacks.length).toBe(4);
  });

  it("megaWindfury can kill 4 enemies in one turn", () => {
    const mwf = make(3, 20, ["megaWindfury"]);
    const [e1, e2, e3, e4] = [make(1, 2), make(1, 2), make(1, 2), make(1, 2)];
    const r = simulateCombat([mwf], [e1, e2, e3, e4], makeRng(0));
    expect(r.winner).toBe("left");
  });
});
