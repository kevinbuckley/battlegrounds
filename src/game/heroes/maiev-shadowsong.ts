import type { Hero } from "../types";
import { getPlayer, updatePlayer } from "../utils";

/**
 * Maiev Shadowsong: Hero Power (1) — put a shop minion to "Dormant" for 2 turns,
 * then awaken it with +3/+3. In real Battlegrounds, Maiev's hero power
 * dormants a shop minion for 2 turns, awakening it with +3/+3.
 */
export const maievShadowsong: Hero = {
  id: "maiev_shadowsong",
  name: "Maiev Shadowsong",
  description:
    'Hero Power (1): Put a shop minion "Dormant" for 2 turns, then awaken it with +3/+3.',
  startHp: 40,
  startArmor: 0,
  power: { kind: "active", cost: 1, usesPerTurn: 1 },

  onHeroPower: (state, playerId, target) => {
    const boardIndex = typeof target === "number" ? target : 0;
    const player = getPlayer(state, playerId);
    const shopMinion = player.shop[boardIndex];
    if (!shopMinion) return state;

    return updatePlayer(state, playerId, (p) => ({
      ...p,
      shop: p.shop.map((m, i) => {
        if (i !== boardIndex) return m;
        const newKeywords = new Set(m.keywords);
        newKeywords.add("dormant" as import("../types").Keyword);
        return {
          ...m,
          keywords: newKeywords,
          attachments: { ...m.attachments, dormantTurnsLeft: 2 },
        };
      }),
    }));
  },
};
