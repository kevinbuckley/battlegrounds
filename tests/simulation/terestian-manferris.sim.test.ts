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

function mech(atk: number, hp: number) {
  return instantiate(
    defineMinion({
      id: `mech_${atk}_${hp}`,
      name: `Mech ${atk}/${hp}`,
      tier: 1,
      tribes: ["Mech"],
      baseAtk: atk,
      baseHp: hp,
      baseKeywords: [],
      spellDamage: 0,
      hooks: {} as never,
    }),
  );
}

describe("terestian-manferris", () => {
  it("buffs the only other friendly Mech +3/+3 on death (deterministic — 1 target)", () => {
    // [terestian 5/5, mech 2/100] vs [killer 6/6]
    // turn=1: terestian attacks killer → terestian takes 6 (dies), killer takes 5 (6/1)
    // deathrattle: only other Mech is mech → mech 2/100 → 5/103
    // mech attacks killer 6/1 → killer takes 5 → dies
    // left wins with mech 5/97
    const tm = instantiate(MINIONS["terestian_manferris"]!);
    const ally = mech(2, 100);
    const killer = plain(6, 6);

    const r = simulateCombat([tm, ally], [killer], makeRng(0), undefined, 1);

    expect(r.winner).toBe("left");
    const buffedAlly = r.survivorsLeft.find((m) => m.instanceId === ally.instanceId);
    expect(buffedAlly).toBeDefined();
    expect(buffedAlly!.atk).toBe(5); // 2 + 3
  });

  it("does NOT buff self when terestian is the only Mech on the side", () => {
    // [terestian 5/5, beast 2/100] vs [killer 6/6]
    // terestian dies → deathrattle excludes self → mechs list is empty → no buff
    // beast unchanged at 2/100, kills killer alone
    const tm = instantiate(MINIONS["terestian_manferris"]!);
    const beast = plain(2, 100); // plain has no tribes — no accidental buff
    const killer = plain(6, 6);

    const r = simulateCombat([tm, beast], [killer], makeRng(0), undefined, 1);

    expect(r.winner).toBe("left");
    const beastSurvivor = r.survivorsLeft.find((m) => m.instanceId === beast.instanceId);
    expect(beastSurvivor).toBeDefined();
    expect(beastSurvivor!.atk).toBe(2); // no buff — no Mechs other than self
  });

  it("does not buff non-Mech allies", () => {
    // [terestian 5/5, non-Mech 10/100] vs [killer 6/6]
    // deathrattle: non-Mech filtered out → no buff
    const tm = instantiate(MINIONS["terestian_manferris"]!);
    const nonMech = plain(10, 100);
    const killer = plain(6, 6);

    const r = simulateCombat([tm, nonMech], [killer], makeRng(0), undefined, 1);

    expect(r.winner).toBe("left");
    const nonMechSurvivor = r.survivorsLeft.find((m) => m.instanceId === nonMech.instanceId);
    expect(nonMechSurvivor).toBeDefined();
    expect(nonMechSurvivor!.atk).toBe(10); // unchanged
  });
});
