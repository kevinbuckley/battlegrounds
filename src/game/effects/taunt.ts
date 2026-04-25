import type { Rng } from "@/lib/rng";
import type { MinionInstance, Side } from "../types";

/**
 * Implements the taunt keyword:
 * - Minions with taunt must be attacked first
 * - If multiple taunts exist, target one randomly
 */
export function applyTaunt(defenders: MinionInstance[], rng: Rng): MinionInstance {
  const tauntTargets = defenders.filter((m) => m.keywords.has("taunt"));
  const pool = tauntTargets.length > 0 ? tauntTargets : defenders;
  return rng.pick(pool);
}
