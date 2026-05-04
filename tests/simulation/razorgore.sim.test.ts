import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Razorgore the Untamed — onStartOfCombat gains +2/+2 per friendly Dragon
// ---------------------------------------------------------------------------

describe("razorgore_the_untamed", () => {
  it("has correct base stats and dragon tribe", () => {
    const card = getMinion("razorgore_the_untamed");
    expect(card.baseAtk).toBe(2);
    expect(card.baseHp).toBe(4);
    expect(card.tier).toBe(6);
    expect(card.tribes).toContain("Dragon");
  });

  function getStartOfCombatStats(
    transcript: import("@/game/types").CombatEvent[],
    instanceId: string,
  ): { atk: number; hp: number } | undefined {
    const events = transcript.filter((e) => e.kind === "Stat" && e.target === instanceId) as Array<{
      kind: "Stat";
      target: string;
      atk: number;
      hp: number;
    }>;
    // First Stat event is from onStartOfCombat; later ones are from combat damage.
    return events[0];
  }

  it("gains +2/+2 per friendly Dragon on board at start of combat", () => {
    const rg = instantiate(getMinion("razorgore_the_untamed"));
    const dragon1 = instantiate(getMinion("alexstrasza"));
    const dragon2 = instantiate(getMinion("murozond"));
    const r = simulateCombat(
      [rg, dragon1, dragon2, instantiate(getMinion("murloc_tidehunter"))],
      [instantiate(getMinion("murloc_tidehunter"))],
      makeRng(0),
    );
    // 2 other dragons → +4/+4 → 6/8
    const stats = getStartOfCombatStats(r.transcript, rg.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(6);
    expect(stats!.hp).toBe(8);
  });

  it("no other dragons → no buff", () => {
    const rg = instantiate(getMinion("razorgore_the_untamed"));
    const r = simulateCombat([rg], [instantiate(getMinion("murloc_tidehunter"))], makeRng(0));
    const stats = getStartOfCombatStats(r.transcript, rg.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(2);
    expect(stats!.hp).toBe(4);
  });

  it("counts dragons on the same side (right side)", () => {
    const rg = instantiate(getMinion("razorgore_the_untamed"));
    const r = simulateCombat(
      [instantiate(getMinion("murloc_tidehunter"))],
      [rg, instantiate(getMinion("alexstrasza"))],
      makeRng(0),
    );
    // 1 other dragon → +2/+2 → 4/6
    const stats = getStartOfCombatStats(r.transcript, rg.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(4);
    expect(stats!.hp).toBe(6);
  });

  it("golden razorgore gets double stats then buffs", () => {
    const rg = instantiate(getMinion("razorgore_the_untamed"), true);
    // Golden: 4/8 base
    const r = simulateCombat(
      [rg, instantiate(getMinion("alexstrasza"))],
      [instantiate(getMinion("murloc_tidehunter"))],
      makeRng(0),
    );
    // 1 other dragon → +2/+2 → 6/10
    const stats = getStartOfCombatStats(r.transcript, rg.instanceId);
    expect(stats).toBeDefined();
    expect(stats!.atk).toBe(6);
    expect(stats!.hp).toBe(10);
  });
});
