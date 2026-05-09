import { defineMinion } from "../define";

export default defineMinion({
  id: "goldrinn",
  name: "Goldrinn the Great Wolf",
  tier: 5,
  tribes: ["Beast"],
  baseAtk: 4,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDeath: (ctx) => {
      const side = ctx.selfSide;
      const allies = side === "left" ? ctx.left : ctx.right;
      for (const minion of allies) {
        if (minion.instanceId === ctx.self.instanceId) continue;
        if (!minion.tribes.includes("Beast")) continue;
        minion.atk += 5;
        minion.hp += 5;
        minion.maxHp += 5;
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
