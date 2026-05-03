import { defineMinion } from "../define";

export default defineMinion({
  id: "old_murk_eye",
  name: "Old Murk-Eye",
  tier: 4,
  tribes: ["Murloc"],
  baseAtk: 4,
  baseHp: 1,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Give +1 ATK to all other friendly Murlocs at start of combat.
    // Unlike Murloc Warleader (+2 ATK), Old Murk-Eye gives +1 ATK.
    // The key difference: Old Murk-Eye counts murlocs on BOTH sides
    // of the battlefield (its own side + enemy side), while Warleader
    // only counts its own side.
    onStartOfCombat: (ctx) => {
      const allies = ctx.selfSide === "left" ? ctx.left : ctx.right;
      const enemies = ctx.selfSide === "left" ? ctx.right : ctx.left;
      // Count all murlocs on the battlefield excluding Old Murk-Eye itself
      const allMinions = [...allies, ...enemies];
      const otherMurlocCount = allMinions.filter(
        (m) => m.instanceId !== ctx.self.instanceId && m.tribes.includes("Murloc"),
      ).length;

      // Give +1 ATK to each other friendly murloc (not +N)
      for (const ally of allies) {
        if (ally.instanceId !== ctx.self.instanceId && ally.tribes.includes("Murloc")) {
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
