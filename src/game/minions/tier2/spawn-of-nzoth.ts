import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "spawn_of_nzoth",
  name: "Spawn of N'Zoth",
  tier: 2,
  tribes: ["Mech"],
  baseAtk: 2,
  baseHp: 2,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      for (const minion of allies) {
        if (minion.instanceId === ctx.self.instanceId) continue;
        minion.atk += 2;
        minion.hp += 2;
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
