import { defineMinion } from "../define";

export default defineMinion({
  id: "bolvar_fireblood",
  name: "Bolvar, Fireblood",
  tier: 4,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 4,
  baseKeywords: ["divineShield"],
  spellDamage: 0,
  hooks: {
    // Whenever a friendly divine shield pops, gain +2 ATK.
    onDivineShieldPop: (ctx) => {
      // Only trigger when a friendly shield pops (same side as self).
      const poppedSide = ctx.left.includes(ctx.self) ? "left" : "right";
      if (poppedSide !== ctx.selfSide) return;

      // Find Bolvar on the board and buff him.
      const board = ctx.selfSide === "left" ? ctx.left : ctx.right;
      for (const m of board) {
        if (m.cardId === "bolvar_fireblood") {
          m.atk += 2;
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
