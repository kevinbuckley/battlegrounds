import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function makeBoardMinion(
  cardId: string,
  atk: number,
  hp: number,
  keywords?: import("@/game/types").Keyword[],
): import("@/game/types").MinionInstance {
  const card = getMinion(cardId);
  const m = instantiate(card);
  return {
    ...m,
    atk,
    hp,
    maxHp: hp,
    keywords: new Set(keywords || []),
  };
}

// ---------------------------------------------------------------------------
// Dormant keyword — minions should not participate in combat
// ---------------------------------------------------------------------------

describe("Dormant keyword in combat", () => {
  it("dormant minion does not attack", () => {
    const enemy = [makeBoardMinion("vulgar_homunculus", 3, 3)];
    const left = [
      makeBoardMinion("murloc_scout", 3, 3, ["dormant"]),
    ] as import("@/game/types").MinionInstance[];

    const result = simulateCombat(left, enemy, makeRng(0));
    // Dormant minion never attacks, so enemy hero takes 0 damage
    const enemyHeroDmg = result.transcript.filter(
      (e) => e.kind === "Damage" && e.target === "hero",
    );
    expect(enemyHeroDmg.length).toBe(0);
  });

  it("dormant minion does not get targeted", () => {
    const enemy = [makeBoardMinion("murloc_scout", 3, 3)];
    const left = [
      makeBoardMinion("murloc_scout", 3, 3),
      makeBoardMinion("murloc_scout", 3, 3, ["dormant"]),
    ] as import("@/game/types").MinionInstance[];

    const result = simulateCombat(left, enemy, makeRng(0));
    // Only the non-dormant minion should be targeted
    const dormantId = left[1]!.instanceId;
    const dormantDamage = result.transcript.filter(
      (e) => e.kind === "Damage" && e.target === dormantId,
    );
    expect(dormantDamage.length).toBe(0);
  });

  it("dormant minion is skipped in rush order", () => {
    const enemy = [makeBoardMinion("vulgar_homunculus", 3, 3)];
    const left = [
      makeBoardMinion("murloc_scout", 3, 3, ["rush", "dormant"]),
    ] as import("@/game/types").MinionInstance[];

    const result = simulateCombat(left, enemy, makeRng(0));
    // Rush dormant minion should not attack even before normal order
    const attacks = result.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBe(0);
  });

  it("non-dormant minion on same side attacks normally", () => {
    const enemy = [makeBoardMinion("vulgar_homunculus", 3, 3)];
    const left = [
      makeBoardMinion("murloc_scout", 3, 3, ["dormant"]),
      makeBoardMinion("murloc_scout", 3, 3),
    ] as import("@/game/types").MinionInstance[];

    const result = simulateCombat(left, enemy, makeRng(0));
    // The non-dormant minion should attack
    const attacks = result.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBeGreaterThan(0);
  });

  it("all minions dormant — no attacks from that side", () => {
    const enemy = [makeBoardMinion("vulgar_homunculus", 3, 3)];
    const left = [
      makeBoardMinion("murloc_scout", 3, 3, ["dormant"]),
      makeBoardMinion("murloc_scout", 3, 3, ["dormant"]),
    ] as import("@/game/types").MinionInstance[];

    const result = simulateCombat(left, enemy, makeRng(0));
    const attacks = result.transcript.filter((e) => e.kind === "Attack");
    expect(attacks.length).toBe(0);
  });
});
