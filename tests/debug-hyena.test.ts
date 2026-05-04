import { describe, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { instantiate } from "@/game/minions/define";
import { getMinion } from "@/game/minions/index";
import { makeRng } from "@/lib/rng";

describe("debug hyena", () => {
  it("golden hyena test - verify +4/+2 per beast", () => {
    const makeCustom = (atk: number, hp: number) => instantiate({
      id: `custom_${atk}_${hp}`, name: `${atk}/${hp}`, tier: 1, tribes: [],
      baseAtk: atk, baseHp: hp, baseKeywords: [], spellDamage: 0, hooks: {},
    });

    // golden hyena (4/10) + alley_cat(1/1) vs enemy(5/5)
    const hyena = { ...instantiate(getMinion("scavenging_hyena")), golden: true, atk: 4, hp: 10, maxHp: 10 };
    const alley_cat = instantiate(getMinion("alley_cat"));
    const enemy = makeCustom(5, 5);

    const r = simulateCombat([alley_cat, hyena], [enemy], makeRng(0));
    console.log(`Winner: ${r.winner}`);
    console.log(`Left survivors:`, r.survivorsLeft.map(m => `${m.cardId} ${m.golden ? "GOLDEN" : ""} ${m.atk}/${m.hp}`));
    for (const e of r.transcript) console.log(JSON.stringify(e));
  });
});
