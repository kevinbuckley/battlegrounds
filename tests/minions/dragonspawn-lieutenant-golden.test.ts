import { describe, expect, it } from "vitest";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";

describe("dragonspawn_lieutenant golden", () => {
  it("golden version has 4/6 stats (base 2/3 doubled)", () => {
    const base = instantiate(getMinion("dragonspawn_lieutenant"));
    expect(base.atk).toBe(2);
    expect(base.hp).toBe(3);
    expect(base.golden).toBe(false);

    const golden = instantiate(getMinion("dragonspawn_lieutenant"), true);
    expect(golden.atk).toBe(4);
    expect(golden.hp).toBe(6);
    expect(golden.maxHp).toBe(6);
    expect(golden.golden).toBe(true);
    expect(golden.keywords.has("taunt")).toBe(true);
  });
});
