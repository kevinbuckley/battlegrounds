import type { Rng } from "@/lib/rng";
import { nextInstanceId } from "../minions/define";
import type { GameState, MinionHooks, MinionInstance, SpellCard, Tier, Tribe } from "../types";
import { getPlayer, updatePlayer } from "../utils";

const EMPTY_HOOKS: MinionHooks = {};

/** Deal 4 damage to a random enemy minion. */
export const poisonDartShield: SpellCard = {
  id: "poison_dart_shield",
  name: "Poison Dart Shield",
  description: "Deal 4 damage to a random enemy minion.",
  cost: 2,
  tiers: [1, 2, 3, 4, 5, 6],
  effects: {
    onPlay: (ctx) => {
      const enemies: { playerId: number; boardIndex: number }[] = [];
      for (const p of ctx.state.players) {
        if (p.eliminated) continue;
        for (let i = 0; i < p.board.length; i++) {
          if (p.board[i]) enemies.push({ playerId: p.id, boardIndex: i });
        }
      }
      if (enemies.length === 0) return ctx.state;

      const idx = ctx.rng.next() % enemies.length;
      const target = enemies[idx]!;
      const targetPlayer = getPlayer(ctx.state, target.playerId);
      const targetMinion = targetPlayer.board[target.boardIndex];
      if (!targetMinion) return ctx.state;

      return updatePlayer(ctx.state, target.playerId, (p) => {
        const newBoard = [...p.board];
        const mi = newBoard[target.boardIndex]!;
        newBoard[target.boardIndex] = { ...mi, hp: mi.hp - 4 };
        return { ...p, board: newBoard };
      });
    },
  },
};

/** Give a friendly minion +2/+2 and Taunt. */
export const duskrayBuff: SpellCard = {
  id: "duskray_buff",
  name: "Duskray Buff",
  description: "Give a friendly minion +2/+2 and Taunt.",
  cost: 3,
  tiers: [3, 4, 5, 6],
  effects: {
    onPlay: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      if (player.board.length === 0) return ctx.state;

      const boardIndex = ctx.rng.next() % player.board.length;
      const minion = player.board[boardIndex];
      if (!minion) return ctx.state;

      return updatePlayer(ctx.state, ctx.playerId, (p) => {
        const newBoard = [...p.board];
        const mi = newBoard[boardIndex]!;
        newBoard[boardIndex] = {
          ...mi,
          atk: mi.atk + 2,
          hp: mi.hp + 2,
          maxHp: mi.maxHp + 2,
          keywords: new Set([...mi.keywords, "taunt" as const]),
        };
        return { ...p, board: newBoard };
      });
    },
  },
};

/** Summon two 1/1 Whelps with Reborn to your board. */
export const pancakeSpell: SpellCard = {
  id: "pancake",
  name: "Pancake",
  description: "Summon two 1/1 Whelps with Reborn.",
  cost: 1,
  tiers: [1, 2, 3, 4, 5, 6],
  effects: {
    onPlay: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      const availableSlots = 7 - player.board.length;
      const count = Math.min(2, availableSlots);
      if (count === 0) return ctx.state;

      let state = ctx.state;
      for (let i = 0; i < count; i++) {
        const whelm: MinionInstance = {
          instanceId: nextInstanceId(),
          cardId: "dredgrot_whelp",
          atk: 1,
          hp: 1,
          maxHp: 1,
          keywords: new Set(["reborn" as const]),
          tribes: ["Beast", "Elemental"] as Tribe[],
          golden: false,
          spellDamage: 0,
          attachments: {},
          hooks: EMPTY_HOOKS,
        };
        state = updatePlayer(state, ctx.playerId, (p) => ({
          ...p,
          board: [...p.board, whelm],
        }));
      }
      return state;
    },
  },
};

/** Give a friendly minion +2/+1. */
export const tavernBrawler: SpellCard = {
  id: "tavern_brawler",
  name: "Tavern Brawler",
  description: "Give a friendly minion +2/+1.",
  cost: 2,
  tiers: [3, 4, 5, 6],
  effects: {
    onPlay: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      if (player.board.length === 0) return ctx.state;

      const boardIndex = ctx.rng.next() % player.board.length;
      const minion = player.board[boardIndex];
      if (!minion) return ctx.state;

      return updatePlayer(ctx.state, ctx.playerId, (p) => {
        const newBoard = [...p.board];
        const mi = newBoard[boardIndex]!;
        newBoard[boardIndex] = {
          ...mi,
          atk: mi.atk + 2,
          hp: mi.hp + 1,
          maxHp: mi.maxHp + 1,
        };
        return { ...p, board: newBoard };
      });
    },
  },
};

/** Give a friendly minion +1/+2. */
export const brawl: SpellCard = {
  id: "brawl",
  name: "Brawl",
  description: "Give a friendly minion +1/+2.",
  cost: 2,
  tiers: [3, 4, 5, 6],
  effects: {
    onPlay: (ctx) => {
      const player = getPlayer(ctx.state, ctx.playerId);
      if (player.board.length === 0) return ctx.state;

      const boardIndex = ctx.rng.next() % player.board.length;
      const minion = player.board[boardIndex];
      if (!minion) return ctx.state;

      return updatePlayer(ctx.state, ctx.playerId, (p) => {
        const newBoard = [...p.board];
        const mi = newBoard[boardIndex]!;
        newBoard[boardIndex] = {
          ...mi,
          atk: mi.atk + 1,
          hp: mi.hp + 2,
          maxHp: mi.maxHp + 2,
        };
        return { ...p, board: newBoard };
      });
    },
  },
};

export const SPELLS: Record<string, SpellCard> = {
  [poisonDartShield.id]: poisonDartShield,
  [duskrayBuff.id]: duskrayBuff,
  [pancakeSpell.id]: pancakeSpell,
  [tavernBrawler.id]: tavernBrawler,
  [brawl.id]: brawl,
};

export function getSpell(id: string): SpellCard {
  const spell = SPELLS[id];
  if (!spell) throw new Error(`Unknown spell: ${id}`);
  return spell;
}

export function getAllSpellIds(): string[] {
  return Object.keys(SPELLS);
}
