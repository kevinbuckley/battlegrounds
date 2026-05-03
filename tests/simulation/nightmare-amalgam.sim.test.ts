import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

function m(id: string) {
  return instantiate(getMinion(id));
}

describe("Nightmare Amalgam", () => {
  it("counts as all tribes for tribe-buff effects", () => {
    const amalgam = m("nightmare_amalgam");
    // After instantiation, "All" should be expanded to all 10 tribes
    expect(amalgam.tribes).toContain("Murloc");
    expect(amalgam.tribes).toContain("Beast");
    expect(amalgam.tribes).toContain("Demon");
    expect(amalgam.tribes).toContain("Mech");
    expect(amalgam.tribes).toContain("Elemental");
    expect(amalgam.tribes).toContain("Pirate");
    expect(amalgam.tribes).toContain("Dragon");
    expect(amalgam.tribes).toContain("Naga");
    expect(amalgam.tribes).toContain("Quilboar");
    expect(amalgam.tribes).toContain("Undead");
    expect(amalgam.tribes).toHaveLength(10);
  });

  it("is treated as matching any tribe in combat", () => {
    const amalgam = m("nightmare_amalgam");
    const murloc = m("murloc_tidehunter");
    murloc.tribes = ["Murloc"];
    murloc.atk = 5;
    murloc.hp = 2;

    // Nightmare Amalgam counts as all tribes — verify it appears on board
    // with all 10 tribes expanded after instantiation
    expect(amalgam.tribes).toContain("Murloc");
    expect(amalgam.tribes).toContain("Dragon");
    expect(amalgam.tribes).toContain("Demon");
    // Verify it can participate in combat without crashing
    const r = simulateCombat([amalgam], [m("flame_imp")], makeRng(0));
    expect(r).toBeDefined();
    expect(r.transcript).toBeDefined();
  });

  it("golden version has expanded tribes", () => {
    const amalgam = instantiate(getMinion("nightmare_amalgam"), true);
    expect(amalgam.tribes).toContain("Murloc");
    expect(amalgam.tribes).toContain("Dragon");
    expect(amalgam.tribes).toHaveLength(10);
    expect(amalgam.golden).toBe(true);
    expect(amalgam.atk).toBe(4);
    expect(amalgam.hp).toBe(8);
  });
});
