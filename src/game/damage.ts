import { MINIONS } from "./minions/index";
import { updatePlayer } from "./utils";
import type { GameState, MinionInstance, PlayerId } from "./types";

/**
 * Calculate how much damage the WINNER deals to the LOSER.
 * Formula: loserTier + sum(tiers of winning survivors).
 */
export function calcDamage(
  loserTier: number,
  winnerSurvivors: MinionInstance[],
): number {
  const survivorTierSum = winnerSurvivors.reduce((sum, m) => {
    return sum + (MINIONS[m.cardId]?.tier ?? 1);
  }, 0);
  return loserTier + survivorTierSum;
}

/**
 * Apply `amount` damage to a player: armor absorbs first, then HP.
 * Sets `eliminated = true` if HP drops to 0 or below.
 */
export function applyDamageToPlayer(
  state: GameState,
  playerId: PlayerId,
  amount: number,
): GameState {
  return updatePlayer(state, playerId, (p) => {
    const armorAbsorb = Math.min(p.armor, amount);
    const hpLoss = amount - armorAbsorb;
    const newHp = p.hp - hpLoss;
    return {
      ...p,
      armor: p.armor - armorAbsorb,
      hp: newHp,
      eliminated: newHp <= 0,
    };
  });
}
