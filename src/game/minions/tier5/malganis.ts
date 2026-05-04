import { defineMinion } from "../define";

export default defineMinion({
  id: "malganis",
  name: "Mal'Ganis",
  tier: 5,
  tribes: ["Demon"],
  baseAtk: 9,
  baseHp: 7,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const ally of allies) {
        if (ally.instanceId === ctx.self.instanceId) continue;
        if (!ally.tribes.includes("Demon")) continue;
        ally.atk += 2;
        ally.hp += 2;
        ally.maxHp += 2;
        ctx.emit({
          kind: "Stat",
          target: ally.instanceId,
          atk: ally.atk,
          hp: ally.hp,
        });
      }
    },
  },
});
