import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCustom(atk: number, hp: number) {
  return instantiate({
    id: `custom_${atk}_${hp}`,
    name: `${atk}/${hp}`,
    tier: 1,
    tribes: [],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

function makeNonBeast(atk: number, hp: number) {
  return instantiate({
    id: `demon_${atk}_${hp}`,
    name: `Demon ${atk}/${hp}`,
    tier: 1,
    tribes: ["Demon"],
    baseAtk: atk,
    baseHp: hp,
    baseKeywords: [],
    spellDamage: 0,
    hooks: {},
  });
}

// ---------------------------------------------------------------------------
// Scavenging Hyena — onAllyDeath buff (+2/+1 normal, +4/+2 golden per Beast)
// ---------------------------------------------------------------------------

describe("scavenging hyena", () => {
  it("gains +2 ATK / +1 HP when a friendly Beast dies", () => {
    // [alley_cat(1/1), hyena(2/10)] vs [enemy(5/5)], seed 0
    // Round 1 (left, alley_cat attacks): alley_cat → enemy. Cat takes 5 → dies. Enemy takes 1 → 5/4.
    // onAllyDeath: hyena gains +2/+1 → 4/11.
    // Round 2 (right, enemy attacks hyena): hyena takes 5 → 4/6. Hyena counterattacks → 5/-1 (dies).
    // Winner: left. Hyena survives at 4/6.
    const hyena = { ...instantiate(getMinion("scavenging_hyena")), hp: 10, maxHp: 10 };
    const alley_cat = instantiate(getMinion("alley_cat"));
    const enemy = makeCustom(5, 5);

    const r = simulateCombat([alley_cat, hyena], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    const hyenaResult = r.survivorsLeft.find((m) => m.cardId === "scavenging_hyena");
    expect(hyenaResult).toBeDefined();
    expect(hyenaResult!.atk).toBe(4);
    expect(hyenaResult!.hp).toBe(6);
  });

  it("stacks +2/+1 for each Beast that dies (two deaths → +4/+2 total)", () => {
    // [cat1(1/1), cat2(1/1), hyena(2/10)] vs [enemy(5/10)], seed 0
    // Round 1: cat1 attacks, dies → hyena → 4/11. Enemy at 5/9.
    // Round 2: enemy attacks cat2, cat2 dies → hyena → 6/12. Enemy at 5/8.
    // Round 3: hyena (6/12) attacks enemy (5/8) → enemy at 5/2, hyena at 6/7.
    // Round 4: enemy (5/2) attacks hyena (6/7) → hyena at 6/2, enemy at 5/-4 dies.
    // Winner: left. Hyena at 6/2.
    const hyena = { ...instantiate(getMinion("scavenging_hyena")), hp: 10, maxHp: 10 };
    const cat1 = instantiate(getMinion("alley_cat"));
    const cat2 = instantiate(getMinion("alley_cat"));
    const enemy = makeCustom(5, 10);

    const r = simulateCombat([cat1, cat2, hyena], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    const hyenaResult = r.survivorsLeft.find((m) => m.cardId === "scavenging_hyena");
    expect(hyenaResult).toBeDefined();
    expect(hyenaResult!.atk).toBe(6);
    expect(hyenaResult!.hp).toBe(2);
  });

  it("does not gain stats when a non-Beast ally dies", () => {
    // [demon(1/1), hyena(2/10)] vs [enemy(3/5)], seed 0
    // Demon attacks and dies. Hyena gets onAllyDeath but Demon is not a Beast → no buff.
    // Hyena (still 2 atk) eventually kills the enemy.
    // Winner: left. Hyena at 2 ATK (no buff).
    const hyena = { ...instantiate(getMinion("scavenging_hyena")), hp: 10, maxHp: 10 };
    const demon = makeNonBeast(1, 1);
    const enemy = makeCustom(3, 5);

    const r = simulateCombat([demon, hyena], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    const hyenaResult = r.survivorsLeft.find((m) => m.cardId === "scavenging_hyena");
    expect(hyenaResult).toBeDefined();
    expect(hyenaResult!.atk).toBe(2); // no buff — Demon death doesn't trigger Hyena
  });

  it("golden Scavenging Hyena gains +4 ATK / +2 HP per Beast death", () => {
    // [alley_cat(1/1), goldenHyena(4/10)] vs [enemy(5/5)], seed 0
    // Round 1: alley_cat attacks, dies → golden hyena gains +4/+2 → 8/12. Enemy at 5/4.
    // Round 2: enemy attacks hyena (8/12) → hyena takes 5 → 8/7. Hyena counterattacks → 5/-1 dies.
    // Winner: left. Golden hyena at 8/7.
    const goldenHyena = {
      ...instantiate(getMinion("scavenging_hyena")),
      golden: true,
      atk: 4,
      hp: 10,
      maxHp: 10,
    };
    const alley_cat = instantiate(getMinion("alley_cat"));
    const enemy = makeCustom(5, 5);

    const r = simulateCombat([alley_cat, goldenHyena], [enemy], makeRng(0));

    expect(r.winner).toBe("left");
    const hyenaResult = r.survivorsLeft.find((m) => m.cardId === "scavenging_hyena");
    expect(hyenaResult).toBeDefined();
    expect(hyenaResult!.atk).toBe(8); // 4 + 4 (golden buff for one Beast death)
    expect(hyenaResult!.hp).toBe(7); // 12 - 5 (enemy counterattack)
  });
});
