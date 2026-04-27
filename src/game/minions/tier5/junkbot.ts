import { defineMinion } from "../define";

export default defineMinion({
  id: "junkbot",
  name: "Junkbot",
  tier: 5,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    // Whenever a friendly Mech dies, gain +2/+2.
    onAllyDeath: (ctx) => {
      if (ctx.dead.instanceId === ctx.self.instanceId) return;
      if (!ctx.dead.tribes.includes("Mech")) return;
      // selfSide is the side the dead minion was on; if self is on the same side, it's friendly.
      // (The dead minion is already filtered from left/right arrays by this point.)
      const deadIsFriendly = ctx.deadSide === ctx.selfSide;
      if (!deadIsFriendly) return;
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
