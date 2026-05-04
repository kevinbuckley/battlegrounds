import { defineMinion } from "../define";

export default defineMinion({
  id: "siegebreaker",
  name: "Siegebreaker",
  tier: 4,
  tribes: ["Demon"],
  baseAtk: 5,
  baseHp: 8,
  baseKeywords: ["taunt"],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const ally of allies) {
        if (ally.instanceId !== ctx.self.instanceId && ally.tribes.includes("Demon")) {
          ally.atk += 1;
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
