import { MINIONS } from "./minions/index";
import type { GameState, MinionInstance, PlayerId } from "./types";
import { updatePlayer } from "./utils";

/**
 * Calculate how much damage the WINNER deals to the LOSER.
 * Formula: loserTier + sum(tiers of winning survivors).
 */
export function calcDamage(loserTier: number, winnerSurvivors: MinionInstance[]): number {
  const survivorTierSum = winnerSurvivors.reduce((sum, m) => {
    return sum + (MINIONS[m.cardId]?.tier ?? 1);
  }, 0);
  return loserTier + survivorTierSum;
}

/**
 * Apply `amount` damage to a player: armor absorbs first, then HP.
 * Sets `eliminated = true` if HP drops to 0 or below.
 * Also updates `totalDamageTaken` on Annihilan Battlemaster minions.
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
    const updatedBoard = p.board.map((m) => {
      if (m.cardId === "annihilan_battlemaster") {
        const existing = (m.attachments as { totalDamageTaken?: number }).totalDamageTaken ?? 0;
        return {
          ...m,
          attachments: { ...m.attachments, totalDamageTaken: existing + amount },
        } as MinionInstance;
      }
      return m;
    });
    return {
      ...p,
      armor: p.armor - armorAbsorb,
      hp: newHp,
      eliminated: newHp <= 0,
      board: updatedBoard,
    };
  });
}

/** Heal a player's hero by `amount`. Does not exceed max HP (no armor gain). */
export function healHero(state: GameState, playerId: PlayerId, amount: number): GameState {
  return updatePlayer(state, playerId, (p) => {
    const newHp = Math.min(p.hp + amount, 60); // max HP cap is 60 (Patchwerk)
    return {
      ...p,
      hp: newHp,
    };
  });
}
