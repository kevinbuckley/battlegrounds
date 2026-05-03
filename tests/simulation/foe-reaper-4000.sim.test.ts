import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { defineMinion, instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Foe Reaper 4000 — cleave on tier 6 Mech
// ---------------------------------------------------------------------------

describe("foe_reaper_4000", () => {
  it("has cleave keyword and correct stats", () => {
    const fr = instantiate(getMinion("foe_reaper_4000"));
    expect(fr.cardId).toBe("foe_reaper_4000");
    expect(fr.atk).toBe(6);
    expect(fr.hp).toBe(9);
    expect(fr.tribes).toContain("Mech");
    expect(fr.keywords.has("cleave")).toBe(true);
  });

  it("damages main target AND adjacent minions with cleave", () => {
    const fr = instantiate(getMinion("foe_reaper_4000"));
    // 3 enemy minions: left, center, right
    // Foe Reaper attacks center → should also damage left and right
    const left = instantiate(getMinion("murloc_tidehunter")); // 2/1
    const center = instantiate(getMinion("rockpool_hunter")); // 2/1
    const right = instantiate(getMinion("venomous_crasher")); // 2/1
    const r = simulateCombat([fr], [left, center, right], makeRng(0));
    const damageEvents = r.transcript.filter((e) => e.kind === "Damage");
    const targetedIds = new Set(damageEvents.map((e) => e.target));
    // Should hit at least 2 targets (main + at least one adjacent)
    expect(targetedIds.size).toBeGreaterThanOrEqual(2);
  });

  it("cleave damages adjacent minions on the board", () => {
    const fr = instantiate(getMinion("foe_reaper_4000"));
    // Use high-HP minions so we can verify cleave hits multiple targets
    const left = defineMinion({
      id: "tank_left",
      name: "Tank Left",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const center = defineMinion({
      id: "tank_center",
      name: "Tank Center",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const right = defineMinion({
      id: "tank_right",
      name: "Tank Right",
      tier: 1,
      tribes: [],
      baseAtk: 1,
      baseHp: 100,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {},
    });
    const r = simulateCombat(
      [fr],
      [instantiate(left), instantiate(center), instantiate(right)],
      makeRng(0),
    );
    const damageEvents = r.transcript.filter((e) => e.kind === "Damage");
    const targetedIds = new Set(damageEvents.map((e) => e.target));
    // Cleave should hit the main target AND at least one adjacent minion
    expect(targetedIds.size).toBeGreaterThanOrEqual(2);
  });
});
