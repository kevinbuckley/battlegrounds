import { defineMinion, instantiate } from "../define";
import { MINIONS } from "../index";

// Fixed pool of legendary card IDs Sneed can summon. Only IDs that exist in
// the registry are eligible — others are filtered out at runtime.
const LEGENDARY_POOL: string[] = [
  "foe_reaper_4000",
  "gentle_megasaur",
  "ghastcoiler",
  "kalecgos_arcane_aspect",
  "mama_bear",
  "ysera_the_dreamer",
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
  baseAtk: 1,
  baseHp: 7,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      if (allies.length >= 7) return;

      // Pick from the fixed legendary pool, filtering to only registered cards.
      const eligible = LEGENDARY_POOL.filter((id) => id in MINIONS);
      if (eligible.length === 0) return;

      const chosenId = ctx.rng.pick(eligible) as string;
      const card = MINIONS[chosenId];
      if (!card) return;

      const spawned = instantiate(card);
      const position = allies.length;
      allies.push(spawned);
      ctx.emit({
        kind: "Summon",
        card: spawned.cardId,
        side,
        position,
      });
    },
  },
});
