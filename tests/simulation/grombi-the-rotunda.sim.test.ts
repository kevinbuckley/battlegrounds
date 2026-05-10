import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { MINIONS } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function plain(atk: number, hp: number) {
  return instantiate(
    defineMinion({
      id: `plain_${atk}_${hp}`,
      name: `${atk}/${hp}`,
      tier: 1,
      tribes: [],
      baseAtk: atk,
      baseHp: hp,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {} as never,
    }),
  );
}

function grombi() {
  const card = MINIONS["grombi_the_rotunda"];
  if (!card) throw new Error("grombi_the_rotunda not in MINIONS");
  return instantiate(card); // 2/3 Murloc, magnetic, onAllyKill +2/+2
}

// ---------------------------------------------------------------------------
// Grombi the Rotunda — onAllyKill fires on ALL allies on attacker's side,
// including Grombi itself, giving +2/+2 per kill (no emit, direct mutation).
// ---------------------------------------------------------------------------

describe("grombi-the-rotunda", () => {
  it("gains +2 ATK when a friendly ally kills a minion", () => {
    // [g(2/3), strong-ally(10/10)] vs [1/1, 1/1]
    // Both enemies die → onAllyKill fires twice → grombi +4 ATK → 6
    const g = grombi();
    const ally = plain(10, 10);
    const r = simulateCombat([g, ally], [plain(1, 1), plain(1, 1)], makeRng(0));

    const after = r.survivorsLeft.find((m) => m.instanceId === g.instanceId);
    expect(after).toBeDefined();
    expect(after!.atk).toBe(6); // 2 + 2 + 2
  });

  it("gains +2 ATK when Grombi itself kills — self is included in ally list", () => {
    // [g(2/3)] vs [1/1] — grombi attacks and kills
    // onAllyKill fires on LEFT side (grombi's side); grombi is included → +2/+2 → 4/x
    const g = grombi();
    const r = simulateCombat([g], [plain(1, 1)], makeRng(0));

    const after = r.survivorsLeft.find((m) => m.instanceId === g.instanceId);
    expect(after).toBeDefined();
    expect(after!.atk).toBe(4); // 2 + 2
  });

  it("stacks — gains +2 ATK per kill across multiple kills", () => {
    // [g(2/3), strong-ally(10/10)] vs [1/1, 1/1, 1/1]
    // 3 enemies die → grombi gains +6 ATK → 8
    const g = grombi();
    const ally = plain(10, 10);
    const r = simulateCombat([g, ally], [plain(1, 1), plain(1, 1), plain(1, 1)], makeRng(0));

    const after = r.survivorsLeft.find((m) => m.instanceId === g.instanceId);
    expect(after).toBeDefined();
    expect(after!.atk).toBe(8); // 2 + 6
  });

  it("works on the right side — gains +2 ATK when right-side ally kills", () => {
    // [1/1 enemy] vs [g(2/3), strong-ally(10/10)]
    // enemy dies (killed by right side) → onAllyKill fires on RIGHT → grombi +2/+2 → 4
    const g = grombi();
    const ally = plain(10, 10);
    const r = simulateCombat([plain(1, 1)], [g, ally], makeRng(0));

    const after = r.survivorsRight.find((m) => m.instanceId === g.instanceId);
    expect(after).toBeDefined();
    expect(after!.atk).toBe(4); // 2 + 2
  });

  it("does not gain when no kills happen (grombi dies without killing)", () => {
    // [g(2/3)] vs [10/10] — grombi dies, 10/10 survives
    const g = grombi();
    const r = simulateCombat([g], [plain(10, 10)], makeRng(0));

    const after = r.survivorsLeft.find((m) => m.instanceId === g.instanceId);
    expect(after).toBeUndefined(); // grombi dead
  });
});
