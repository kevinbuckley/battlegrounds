import { getPlayer, updatePlayer } from "../../utils";
import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

export default defineMinion({
  id: "murozond",
  name: "Murozond",
  tier: 5,
  tribes: ["Dragon"],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);

      // Find all enemy players (not the current player)
      const enemies = ctx.state.players.filter((e) => e.id !== ctx.playerId);

      // Collect all alive minions from all enemy boards
      const enemyMinions: import("../../types").MinionInstance[] = [];
      for (const enemy of enemies) {
        for (const m of enemy.board) {
          if (m.hp > 0) {
            enemyMinions.push(m);
          }
        }
      }

      if (enemyMinions.length === 0) {
        return ctx.state;
      }

      // Pick a random enemy minion
      const idx = Math.floor(ctx.rng.next() % enemyMinions.length);
      const chosen = enemyMinions[idx];
      if (!chosen) {
        return ctx.state;
      }

      // Instantiate a copy of the chosen minion's card
      const card = MINIONS[chosen.cardId];
      if (!card) {
        return ctx.state;
      }

      const copy = instantiate(card);

      return updatePlayer(ctx.state, ctx.playerId, (p) => ({
        ...p,
        hand: [...p.hand, copy],
      }));
    },
  },
});
