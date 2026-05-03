import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

const MURLOC_CARD_IDS: string[] = [
  "murloc_tidehunter",
  "murloc_tidecaller",
  "murloc_tinyfin",
  "rockpool_hunter",
  "venomous_crasher",
  "murloc_warleader",
  "coldlight_seer",
  "toxfin",
  "old_murk_eye",
  "brann_bronzebeard",
  "grombi_the_rotunda",
  "markku",
];

export default defineMinion({
  id: "tide_razor",
  name: "Tide-Razor",
  tier: 5,
  tribes: ["Murloc"],
  baseAtk: 3,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      if (allies.length >= 7) return;

      for (let i = 0; i < 3; i++) {
        if (allies.length >= 7) break;
        const chosenId = ctx.rng.pick(MURLOC_CARD_IDS) as string;
        const card = MINIONS[chosenId];
        if (!card) continue;
        const spawned = instantiate(card);
        allies.push(spawned);
        ctx.emit({
          kind: "Summon",
          card: spawned.cardId,
          side,
          position: allies.length - 1,
        });
      }
    },
  },
});
