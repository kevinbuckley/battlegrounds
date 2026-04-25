import { defineMinion } from "../define";

export default defineMinion({
  id: "murloc_warleader",
  name: "Murloc Warleader",
  tier: 2,
  tribes: ["Murloc"],
  baseAtk: 3,
  baseHp: 3,
  baseKeywords: [],
  hooks: {
    // Apply +2 ATK to all friendly Murlocs at start of combat
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const ally of allies) {
        if (ally.instanceId !== ctx.self.instanceId && ally.tribes.includes("Murloc")) {
          ally.atk += 2;
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
