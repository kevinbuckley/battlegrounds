import { defineMinion } from "../define";

export default defineMinion({
  id: "drakonid_enforcer",
  name: "Drakonid Enforcer",
  tier: 4,
  tribes: ["Dragon"],
  baseAtk: 3,
  baseHp: 6,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Whenever a friendly minion loses its divine shield, gain +2/+2.
    onDivineShieldPop: (ctx) => {
      const poppedSide = ctx.left.includes(ctx.self) ? "left" : "right";
      if (poppedSide !== ctx.selfSide) return;

      ctx.self.atk += 2;
      ctx.self.hp += 2;
      ctx.self.maxHp += 2;
      ctx.emit({
        kind: "Stat",
        target: ctx.self.instanceId,
        atk: ctx.self.atk,
        hp: ctx.self.hp,
      });
    },
  },
});
