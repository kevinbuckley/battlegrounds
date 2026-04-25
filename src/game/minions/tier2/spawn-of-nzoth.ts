import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "spawn_of_nzoth",
  name: "Spawn of N'Zoth",
  tier: 2,
  tribes: ["Murloc"],
  baseAtk: 1,
  baseHp: 1,
  baseKeywords: [],
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      for (const minion of allies) {
        if (minion.instanceId === ctx.self.instanceId) continue;
        minion.atk += 1;
        minion.hp += 1;
        ctx.emit({
          kind: "Stat",
          target: minion.instanceId,
          atk: minion.atk,
          hp: minion.hp,
        });
      }
    },
  },
});
