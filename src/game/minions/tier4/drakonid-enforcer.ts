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
      const board = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const m of board) {
        if (m.cardId === "drakonid_enforcer") {
          m.atk += 2;
          m.hp += 2;
          m.maxHp += 2;
          ctx.emit({
            kind: "Stat",
            target: m.instanceId,
            atk: m.atk,
            hp: m.hp,
          });
        }
      }
    },
  },
});
