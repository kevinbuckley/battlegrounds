import type { MinionCard, MinionHooks, MinionInstance } from "../types";

export function defineMinion(card: MinionCard): MinionCard {
  return card;
}

let nextInstanceId = 0;
export function instantiate(card: MinionCard, golden = false): MinionInstance {
  const atk = golden ? card.baseAtk * 2 : card.baseAtk;
  const hp = golden ? card.baseHp * 2 : card.baseHp;
  nextInstanceId += 1;
  return {
    instanceId: `m${nextInstanceId}`,
    cardId: card.id,
    atk,
    hp,
    maxHp: hp,
    keywords: new Set(card.baseKeywords),
    tribes: card.tribes,
    golden,
    attachments: {},
    hooks: card.hooks,
  };
}

export type { MinionHooks };
