import { defineMinion } from "../define";

export default defineMinion({
  id: "floatingWatcher",
  name: "Floating Watcher",
  tier: 4,
  tribes: ["Demon"],
  baseAtk: 4,
  baseHp: 4,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onHeroDamaged: (ctx) => {
      if (ctx.damage > 0) {
        ctx.self.atk += 2;
        ctx.self.hp += 2;
        ctx.emit({
          kind: "Stat",
          target: ctx.self.instanceId,
          atk: ctx.self.atk,
          hp: ctx.self.hp,
        });
      }
    },
  },
});
