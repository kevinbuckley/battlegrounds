import type { MinionCard, MinionHooks, MinionInstance } from "../types";

export function defineMinion(card: MinionCard): MinionCard {
  return card;
}

let nextInstanceIdCounter = 0;
export function instantiate(card: MinionCard, golden = false): MinionInstance {
  const atk = golden ? card.baseAtk * 2 : card.baseAtk;
  const hp = golden ? card.baseHp * 2 : card.baseHp;
  const spellDamage = golden ? card.spellDamage * 2 : card.spellDamage;
  nextInstanceIdCounter += 1;
  return {
    instanceId: `m${nextInstanceIdCounter}`,
    cardId: card.id,
    atk,
    hp,
    maxHp: hp,
    keywords: new Set(card.baseKeywords),
    tribes: card.tribes,
    golden,
    spellDamage,
    attachments: {},
    hooks: card.hooks,
  };
}

export function nextInstanceId(): string {
  nextInstanceIdCounter += 1;
  return `m${nextInstanceIdCounter}`;
}

export type { MinionHooks };
