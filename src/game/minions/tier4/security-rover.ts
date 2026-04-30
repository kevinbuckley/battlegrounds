import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "security_rover",
  name: "Security Rover",
  tier: 4,
  tribes: ["Mech"],
  baseAtk: 1,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onDamageTaken: (ctx) => {
      const bot = defineMinion({
        id: "security_rover_bot",
        name: "Security Bot",
        tier: 4,
        tribes: ["Mech"],
        baseAtk: 2,
        baseHp: 3,
        baseKeywords: ["divineShield"],
        spellDamage: 0,
        hooks: {},
      });
      const spawned = instantiate(bot);
      const side = ctx.selfSide;
      if (side === "left") {
        ctx.left.push(spawned);
      } else {
        ctx.right.push(spawned);
      }
      ctx.emit({
        kind: "Summon",
        card: spawned.cardId,
        side,
        position: (side === "left" ? ctx.left : ctx.right).length - 1,
      });
    },
  },
});
