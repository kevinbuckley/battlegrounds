import { describe, expect, it } from "vitest";
import { makeRng } from "./rng";

describe("rng", () => {
  it("is deterministic for a given seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const aSeq = Array.from({ length: 10 }, () => a.next());
    const bSeq = Array.from({ length: 10 }, () => b.next());
    expect(aSeq).toEqual(bSeq);
  });

  it("produces different sequences for different seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it("fork is deterministic and distinct", () => {
    const parent = makeRng(42);
    const c1 = parent.fork("combat").next();
    const c2 = parent.fork("combat").next();
    const shop = parent.fork("shop").next();
    expect(c1).toEqual(c2);
    expect(c1).not.toEqual(shop);
  });

  it("pick respects array bounds", () => {
    const r = makeRng(7);
    const pool = [1, 2, 3, 4, 5] as const;
    for (let i = 0; i < 100; i++) {
      expect(pool).toContain(r.pick(pool));
    }
  });
});
