import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  return instantiate(getMinion(id));
}

describe("Murozond combat", () => {
  it("1v1: murozond (4/5) vs 3/3 — murozond wins", () => {
    const result = simulateCombat([m("murozond")], [m("murloc_scout")], makeRng(1), undefined, 1);
    expect(result.winner).toBe("left");
  });

  it("1v1: murozond (4/5) vs arm_of_the_empire (4/5) — draw", () => {
    const result = simulateCombat(
      [m("murozond")],
      [m("arm_of_the_empire")],
      makeRng(1),
      undefined,
      1,
    );
    expect(result.winner).toBe("draw");
  });

  it("1v1: murozond (4/5) vs 6/6 — murozond loses", () => {
    const result = simulateCombat([m("murozond")], [m("dreadscale")], makeRng(1), undefined, 1);
    expect(result.winner).toBe("right");
  });

  it("murozond has no combat hooks — battlecry does NOT fire in combat", () => {
    const result = simulateCombat([m("murozond")], [m("murloc_scout")], makeRng(1), undefined, 1);
    // Murozond's battlecry only fires during shop play, not combat.
    // If it fired, the opponent's murloc_scout would be copied to hand.
    // The transcript should only contain Attack + Death events, no Summon.
    const summons = result.transcript.filter((e) => e.kind === "Summon");
    expect(summons).toHaveLength(0);
  });
});
