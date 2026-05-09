import { defineMinion } from "../define";

export default defineMinion({
  id: "zapp_slywick",
  name: "Zapp Slywick",
  tier: 5,
  tribes: ["Mech"],
  baseAtk: 7,
  baseHp: 10,
  baseKeywords: ["rush"],
  description: "Rush. Always attacks the lowest-ATK enemy minion.",
  spellDamage: 0,
  hooks: {
    getTarget: (ctx) => {
      const defenders = (ctx.left.includes(ctx.self) ? ctx.right : ctx.left).filter(
        (d) => d.hp > 0,
      );
      if (defenders.length === 0) return undefined;
      const tauntTargets = defenders.filter((m) => m.keywords.has("taunt"));
      const pool = tauntTargets.length > 0 ? tauntTargets : defenders;
      return pool.reduce((lowest, m) => (m.atk < lowest.atk ? m : lowest));
    },
  },
});
