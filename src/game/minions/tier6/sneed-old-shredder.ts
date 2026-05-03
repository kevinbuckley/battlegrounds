import { defineMinion, instantiate } from "../define";
import { getMinion } from "../index";

const LEGENDARY_POOL = [
  "foe_reaper_4000",
  "friggent_northvalley",
  "gentle_megasaur",
  "ghastcoiler",
  "kalecgos_arcane_aspect",
  "mama_bear",
  "terestian_manferris",
  "zixor_project_hope",
] as const;

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
      const board = side === "left" ? ctx.left : ctx.right;
      const randomId = ctx.rng.pick(LEGENDARY_POOL);
      const template = getMinion(randomId as never);
      const newMinion = instantiate(template, false);
      board.push(newMinion);
      ctx.emit({
        kind: "Summon",
        card: newMinion.cardId,
        side,
        position: board.length - 1,
      });
    },
  },
});
