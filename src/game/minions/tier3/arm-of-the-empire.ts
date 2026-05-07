import { defineMinion, instantiate } from "../define";

export default defineMinion({
  id: "arm_of_the_empire",
  name: "Arm of the Empire",
  tier: 3,
  tribes: ["Dragon"],
  baseAtk: 4,
  baseHp: 5,
  baseKeywords: [],
  spellDamage: 0,
  hooks: {
    onAllyAttacked: ({ self, left, right, emit, target }) => {
      const board = left.includes(self) ? left : right;
      for (const minion of board) {
        if (minion !== self && minion.keywords.has("taunt")) {
          minion.atk += 3;
          minion.hp += 2;
          if (minion.hp > minion.maxHp) {
            minion.maxHp += 2;
          }
          emit({
            kind: "Stat",
            target: minion.instanceId,
            atk: minion.atk,
            hp: minion.hp,
          });
        }
      }
    },
  },
});
