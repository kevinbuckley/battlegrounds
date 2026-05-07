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
  id: "amalgadon",
  name: "Amalgadon",
  tier: 6,
  tribes: [],
  baseAtk: 6,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onBattlecry: ({ state, playerId, self, rng }) => {
      const player = getPlayer(state, playerId);
      const otherMinions = player.board.filter((m) => m.instanceId !== self.instanceId);

      // Collect distinct tribes from other minions
      const tribesSet = new Set<string>();
      for (const m of otherMinions) {
        for (const tribe of m.tribes) {
          if (tribe !== "All") {
            tribesSet.add(tribe);
          }
        }
      }

      // Gain one random keyword per distinct tribe
      for (const _ of tribesSet) {
        const chosen = rng.pick(ADAPT_KEYWORDS);
        self.keywords.add(chosen);
      }

      return state;
    },
  },
});
