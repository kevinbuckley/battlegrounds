import type { MinionCard, MinionHooks, MinionInstance, Tribe } from "../types";

export function defineMinion(card: MinionCard): MinionCard {
  return card;
}

const ALL_CONCRETE_TRIBES: Tribe[] = [
  "Beast",
  "Murloc",
  "Demon",
  "Mech",
  "Elemental",
  "Pirate",
  "Dragon",
  "Naga",
  "Quilboar",
  "Undead",
];

let nextInstanceIdCounter = 0;
export function instantiate(card: MinionCard, golden = false): MinionInstance {
  const atk = golden ? card.baseAtk * 2 : card.baseAtk;
  const hp = golden ? card.baseHp * 2 : card.baseHp;
  const spellDamage = golden ? card.spellDamage * 2 : card.spellDamage;
  nextInstanceIdCounter += 1;
  const tribes = card.tribes.includes("All") ? [...ALL_CONCRETE_TRIBES] : card.tribes;
  return {
    instanceId: `m${nextInstanceIdCounter}`,
    cardId: card.id,
    baseAtk: atk,
    baseHp: hp,
    atk,
    hp,
    maxHp: hp,
    keywords: new Set(card.baseKeywords),
    tribes,
    golden,
    spellDamage,
    magnetic: card.magnetic ?? card.baseKeywords.includes("magnetic"),
    baronRivendare: card.baronRivendare ?? false,
    attachments: {},
    hooks: card.hooks,
  };
}

export function nextInstanceId(): string {
  nextInstanceIdCounter += 1;
  return `m${nextInstanceIdCounter}`;
}

export type { MinionHooks };
