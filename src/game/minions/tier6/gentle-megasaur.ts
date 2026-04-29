import type { Keyword } from "../../types";
import { getPlayer } from "../../utils";
import { defineMinion } from "../define";

const ADAPT_KEYWORDS: Keyword[] = [
  "taunt",
  "divineShield",
  "windfury",
  "megaWindfury",
  "poisonous",
  "reborn",
  "venomous",
  "cleave",
  "lifesteal",
  "rush",
  "magnetic",
];

export default defineMinion({
  id: "gentle_megasaur",
  name: "Gentle Megasaur",
  tier: 6,
  tribes: ["Beast"],
  baseAtk: 5,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self, rng }) => {
      const player = getPlayer(state, playerId);
      const murlocs = player.board.filter(
        (m) => m.tribes.includes("Murloc") && m.instanceId !== self.instanceId,
      );
      for (const murloc of murlocs) {
        const chosen = rng.pick(ADAPT_KEYWORDS);
        murloc.keywords.add(chosen);
      }
      return state;
    },
  },
});
