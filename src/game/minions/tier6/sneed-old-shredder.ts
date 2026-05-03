import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

const LEGENDARY_TIER6: string[] = [
  "foe_reaper_4000",
  "friggent_northvalley",
  "gentle_megasaur",
  "ghastcoiler",
  "kalecgos_arcane_aspect",
  "mama_bear",
  "terestian_manferris",
  "ysera_the_dreamer",
  "zixor_project_hope",
  "murozond",
  "alexstrasza",
  "blingtron_5000",
  "bigfernal",
  "baron_rivendare",
  "brann_bronzebeard",
  "junkbot",
  "lightfang_enforcer",
  "mogor_the_curse_golem",
  "strongshell_scavenger",
  "tide_razor",
];

export default defineMinion({
  id: "sneed_old_shredder",
  name: "Sneed's Old Shredder",
  tier: 6,
  tribes: ["Mech"],
  baseAtk: 5,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;

      // Collect all legendary tier 6+ minions from both boards
      const legendaryCandidates: string[] = [];
      for (const board of [ctx.left, ctx.right]) {
        for (const m of board) {
          const card = MINIONS[m.cardId];
          if (card && card.tier >= 6 && LEGENDARY_TIER6.includes(m.cardId)) {
            if (!legendaryCandidates.includes(m.cardId)) {
              legendaryCandidates.push(m.cardId);
            }
          }
        }
      }

      if (legendaryCandidates.length === 0) return;

      const chosenId = ctx.rng.pick(legendaryCandidates) as string;
      const card = MINIONS[chosenId];
      if (!card) return;

      const spawned = instantiate(card);
      if (allies.length >= 7) return;

      allies.push(spawned);
      ctx.emit({
        kind: "Summon",
        card: spawned.cardId,
        side,
        position: allies.length - 1,
      });
    },
  },
});
