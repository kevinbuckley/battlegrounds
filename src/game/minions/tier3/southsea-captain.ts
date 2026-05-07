import { defineMinion } from "../define";

export default defineMinion({
  id: "southsea_captain",
  name: "Southsea Captain",
  tier: 3,
  tribes: ["Pirate"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const ally of allies) {
        if (ally.instanceId !== ctx.self.instanceId && ally.tribes.includes("Pirate")) {
          ally.atk += 1;
          ally.hp += 1;
          ctx.emit({
            kind: "Stat",
            target: ally.instanceId,
            atk: ally.atk,
            hp: ally.hp,
          });
        }
      }
    },
  },
});
