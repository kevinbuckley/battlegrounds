import { describe, expect, it } from "vitest";
import { simulateCombat } from "@/game/combat";
import { makeRng } from "@/lib/rng";

describe("combat simulator", () => {
  it("returns a transcript for empty boards", () => {
    const result = simulateCombat([], [], makeRng(1));
    expect(result.winner).toBe("draw");
    expect(result.transcript.at(-1)).toEqual({ kind: "End", winner: "draw" });
  });
});
