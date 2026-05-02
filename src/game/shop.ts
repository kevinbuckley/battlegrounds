import type { Rng } from "@/lib/rng";
import {
  COST_BUY,
  COST_REFRESH,
  POOL_COUNTS,
  SHOP_SIZE_BY_TIER,
  TIER_ODDS,
  TIER_UPGRADE_BASE,
} from "./economy";
import { HEROES } from "./heroes/index";
import { instantiate } from "./minions/define";
import { MINIONS } from "./minions/index";
import type {
  GameState,
  MinionCard,
  MinionCardId,
  MinionInstance,
  PlayerId,
  Tier,
  Tribe,
} from "./types";
import { getPlayer, updatePlayer } from "./utils";

// ---------------------------------------------------------------------------
// Pool management
// ---------------------------------------------------------------------------

export function buildPool(activeTribes: Tribe[]): Record<MinionCardId, number> {
  const pool: Record<MinionCardId, number> = {};
  for (const [id, card] of Object.entries(MINIONS)) {
    if (isTribeEligible(card, activeTribes)) {
      pool[id] = POOL_COUNTS[card.tier] ?? 0;
    }
  }
  return pool;
}

function isTribeEligible(card: MinionCard, activeTribes: Tribe[]): boolean {
  if (card.tribes.length === 0) return true;
  if (card.tribes.includes("All")) return activeTribes.length > 0;
  return card.tribes.some((t) => activeTribes.includes(t));
}

// Pick a card-tier slot using the BG probability table, falling back to any
// available tier if the chosen tier is exhausted in the pool.
function pickCardFromPool(
  pool: Record<MinionCardId, number>,
  playerTier: Tier,
  rng: Rng,
): MinionCardId | null {
  const odds = TIER_ODDS[playerTier];

  // Weighted tier selection via cumulative distribution
  let roll = rng.next() * 100;
  let chosenTier: Tier = 1;
  for (let t = 1 as Tier; t <= playerTier; t++) {
    const weight = odds[t as Tier] ?? 0;
    roll -= weight;
    if (roll <= 0) {
      chosenTier = t as Tier;
      break;
    }
    if (weight > 0) chosenTier = t as Tier; // track last tier with weight as fallback
  }

  // Draw from the chosen tier; if empty fall back to any available tier ≤ playerTier
  const inChosenTier = Object.entries(pool)
    .filter(([id, n]) => n > 0 && MINIONS[id]?.tier === chosenTier)
    .map(([id]) => id);

  if (inChosenTier.length > 0) return rng.pick(inChosenTier) as MinionCardId;

  const anyAvailable = Object.entries(pool)
    .filter(([id, n]) => n > 0 && (MINIONS[id]?.tier ?? 99) <= playerTier)
    .map(([id]) => id);

  return anyAvailable.length > 0 ? (rng.pick(anyAvailable) as MinionCardId) : null;
}

export function drawFromPool(
  pool: Record<MinionCardId, number>,
  playerTier: Tier,
  count: number,
  rng: Rng,
): { instances: MinionInstance[]; pool: Record<MinionCardId, number> } {
  const newPool = { ...pool };
  const instances: MinionInstance[] = [];

  for (let i = 0; i < count; i++) {
    const id = pickCardFromPool(newPool, playerTier, rng);
    if (id === null) break;
    const card = MINIONS[id];
    if (!card) break;
    newPool[id] = (newPool[id] ?? 0) - 1;
    instances.push(instantiate(card));
  }

  return { instances, pool: newPool };
}

export function returnToPool(
  pool: Record<MinionCardId, number>,
  instances: MinionInstance[],
): Record<MinionCardId, number> {
  const newPool = { ...pool };
  for (const inst of instances) {
    newPool[inst.cardId] = (newPool[inst.cardId] ?? 0) + 1;
  }
  return newPool;
}

// ---------------------------------------------------------------------------
// Per-player shop roll (called at turn start or after refresh)
// ---------------------------------------------------------------------------

import { applyDamageToPlayer } from "./damage";
import { nextInstanceId } from "./minions/define";
import { SPELLS } from "./spells/index";
export function rollShopForPlayer(state: GameState, playerId: PlayerId, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  if (player.shopFrozen) {
    // Frozen: keep shop as-is. Do NOT clear the freeze flag — the shop stays
    // frozen until the player explicitly unfreezes it, matching real
    // Battlegrounds where a frozen shop persists across turns.
    return state;
  }

  const size = SHOP_SIZE_BY_TIER[player.tier];
  // Return current shop to pool
  const poolAfterReturn = returnToPool(state.pool, player.shop);
  // Draw fresh shop
  const { instances, pool } = drawFromPool(poolAfterReturn, player.tier, size, rng);

  // Apply Tavern Discount anomaly: all shop minions cost 1 less (min 1).
  const isTavernDiscount = state.modifierState.anomaly === "tavern_discount";
  const shopWithDiscount = isTavernDiscount
    ? instances.map((m) => ({ ...m, discount: 1 }))
    : instances;

  // Roll spells into the last 1/4 of shop slots (starting at tier 2).
  const spellSlotCount = Math.floor(shopWithDiscount.length * 0.25);
  const finalShop = [...shopWithDiscount];

  if (spellSlotCount > 0) {
    // Filter spells available at the player's tier
    const availableSpellIds = Object.keys(SPELLS).filter((id) => {
      const spell = SPELLS[id as keyof typeof SPELLS];
      return spell && spell.tiers.includes(player.tier);
    }) as string[];

    if (availableSpellIds.length > 0) {
      const shuffled = rng.shuffle(availableSpellIds);
      const picks = shuffled.slice(0, spellSlotCount);

      for (const spellId of picks) {
        const spell = SPELLS[spellId];
        if (spell) {
          finalShop.push({
            instanceId: nextInstanceId(),
            cardId: spellId,
          } as import("./types").MinionInstance);
        }
      }
    }
  }

  return {
    ...updatePlayer(state, playerId, (p) => ({ ...p, shop: finalShop })),
    pool,
  };
}

// ---------------------------------------------------------------------------
// Shop actions — each returns a new GameState or throws on invalid input
// ---------------------------------------------------------------------------

export function buyMinion(state: GameState, playerId: PlayerId, shopIndex: number): GameState {
  const player = getPlayer(state, playerId);

  if (player.hand.length >= 10) throw new Error("Hand is full");

  const minion = player.shop[shopIndex];
  if (!minion) throw new Error(`No minion at shop index ${shopIndex}`);

  // Skip spell items in the shop — they are handled by buySpell instead.
  if (SPELLS[minion.cardId as keyof typeof SPELLS]) {
    return state;
  }

  const card = MINIONS[minion.cardId];
  const bountyCost = card?.bountyCost;
  const baseCost = bountyCost ?? COST_BUY;
  const buyCost = Math.max(1, baseCost - (minion.discount ?? 0));

  if (player.gold < buyCost)
    throw new Error(`Not enough gold to buy (have ${player.gold}, need ${buyCost})`);

  // Apply bounty: if the minion has the bounty keyword, boost its stats
  // by the difference between its bounty cost and the standard buy cost.
  let boughtMinion = minion;
  if (bountyCost && card?.baseKeywords.includes("bounty" as import("./types").Keyword)) {
    const bonus = buyCost - COST_BUY;
    if (bonus > 0) {
      boughtMinion = {
        ...minion,
        atk: minion.atk + bonus,
        hp: minion.hp + bonus,
        maxHp: minion.maxHp + bonus,
      };
    }
  }

  const result = updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - buyCost,
    hand: [...p.hand, boughtMinion],
    shop: p.shop.filter((_, i) => i !== shopIndex),
  }));

  return result;
}

export function sellMinion(
  state: GameState,
  playerId: PlayerId,
  boardIndex: number,
  fromHand?: boolean,
): GameState {
  const player = getPlayer(state, playerId);
  let minion: MinionInstance | undefined;
  let newState: GameState;
  let newPool: Record<import("./types").MinionCardId, number> = state.pool;

  if (fromHand) {
    minion = player.hand[boardIndex];
    if (!minion) throw new Error(`No minion at hand index ${boardIndex}`);
    newPool = returnToPool(state.pool, [minion]);
    const sellValue = minion.golden ? 2 : 1;
    newState = updatePlayer(state, playerId, (p) => ({
      ...p,
      gold: p.gold + sellValue,
      hand: p.hand.filter((_, i) => i !== boardIndex),
    }));
    const hero = HEROES[player.heroId];
    if (hero?.onSell) {
      newState = hero.onSell(newState, playerId);
    }
    return { ...newState, pool: newPool };
  } else {
    minion = player.board[boardIndex];
    if (!minion) throw new Error(`No minion at board index ${boardIndex}`);

    newPool = returnToPool(state.pool, [minion]);
    const sellValue = minion.golden ? 2 : 1;
    newState = updatePlayer(state, playerId, (p) => ({
      ...p,
      gold: p.gold + sellValue,
      board: p.board.filter((_, i) => i !== boardIndex),
    }));
  }

  const hero = HEROES[player.heroId];
  let result = newState;
  if (hero?.onSell) {
    result = hero.onSell(newState, playerId);
  }

  return { ...result, pool: newPool };
}

export function playMinionToBoard(
  state: GameState,
  playerId: PlayerId,
  handIndex: number,
  boardIndex: number,
  rng: Rng,
): GameState {
  const player = getPlayer(state, playerId);
  if (player.board.length >= 7) throw new Error("Board is full (max 7 minions)");

  const minion = player.hand[handIndex];
  if (!minion) throw new Error(`No minion at hand index ${handIndex}`);

  const newHand = player.hand.filter((_, i) => i !== handIndex);
  const newBoard = [...player.board];
  const clamped = Math.min(boardIndex, newBoard.length);
  newBoard.splice(clamped, 0, minion);

  let afterPlay = updatePlayer(state, playerId, (p) => ({ ...p, hand: newHand, board: newBoard }));

  // Handle magnetic: stack on top of a friendly minion of the same tribe
  const card = MINIONS[minion.cardId];
  const hasMagnetic = card && (card.magnetic || card.baseKeywords.includes("magnetic"));
  if (hasMagnetic) {
    const magneticBoardIndex = clamped;
    const sameTribe = newBoard.findLastIndex(
      (m) => m.tribes.some((t) => minion.tribes.includes(t)) && m.cardId !== minion.cardId,
    );
    if (sameTribe !== -1) {
      const baseMinion = newBoard[sameTribe]!;
      const combinedAtk = Math.max(minion.atk, baseMinion.atk) + minion.atk;
      const combinedHp = Math.max(minion.hp, baseMinion.hp) + minion.hp;
      const combinedKeywords = new Set<import("./types").Keyword>([
        ...baseMinion.keywords,
        ...minion.keywords,
      ]);
      const combinedSpellDamage =
        Math.max(baseMinion.spellDamage, minion.spellDamage) + minion.spellDamage;
      const combined: MinionInstance = {
        ...baseMinion,
        atk: combinedAtk,
        hp: combinedHp,
        maxHp: combinedHp,
        keywords: combinedKeywords,
        spellDamage: combinedSpellDamage,
        magnetic: false,
      };
      newBoard[sameTribe] = combined;
      // Remove the magnetic minion that was just added (it's consumed by the stack)
      newBoard.splice(magneticBoardIndex, 1);
      afterPlay = updatePlayer(afterPlay, playerId, (p) => ({ ...p, board: newBoard }));
    }
  }

  // Handle collateralDamage: deal damage to the player's own hero
  if (card) {
    const collateralMatch = card.baseKeywords.find(
      (k: string): k is `collateralDamage${number}` =>
        typeof k === "string" && k.startsWith("collateralDamage"),
    );
    if (collateralMatch) {
      const amount = parseInt(collateralMatch.slice("collateralDamage".length), 10);
      if (amount > 0) {
        afterPlay = applyDamageToPlayer(afterPlay, playerId, amount);
      }
    }
  }

  // Fire battlecry after collateral damage
  const battlecry = minion.hooks?.onBattlecry;
  // Brann Bronzebeard on board causes battlecries to trigger twice
  const hasBrann = player.board.some((m) => m.cardId === "brann_bronzebeard");
  const isGolden = minion.golden;
  if (battlecry) {
    const spellDamage = player.board.reduce((sum, m) => sum + (m.spellDamage ?? 0), 0);
    afterPlay = battlecry({ self: minion, playerId, state: afterPlay, rng, spellDamage });
    if (hasBrann || isGolden) {
      afterPlay = battlecry({ self: minion, playerId, state: afterPlay, rng, spellDamage });
    }
  }

  // Fire onPlay: fires when a minion is played from hand to board
  const onPlay = minion.hooks?.onPlay;
  if (onPlay) {
    const spellDamage = player.board.reduce((sum, m) => sum + (m.spellDamage ?? 0), 0);
    afterPlay = onPlay({ self: minion, playerId, state: afterPlay, rng, spellDamage });
  }

  // Apply combo: all friendly minions with combo gain +2/+2 when a card is played
  const afterCombo = applyComboToBoard(afterPlay, playerId);

  // Fire onShopSummon: notify all minions with the hook when a new minion
  // is summoned to the player's board during the recruit phase.
  const afterSummon = fireShopSummon(afterCombo, playerId, minion, rng);

  // Fire onRecruitSummon: notify all minions with the hook when a friendly
  // minion is summoned to the player's board during the recruit phase.
  const afterRecruitSummon = fireRecruitSummon(afterSummon, playerId, minion, rng);

  return afterRecruitSummon;
}

export function reorderBoard(
  state: GameState,
  playerId: PlayerId,
  from: number,
  to: number,
): GameState {
  const player = getPlayer(state, playerId);
  if (!player.board[from]) throw new Error(`No minion at board index ${from}`);
  const board = [...player.board];
  const [moved] = board.splice(from, 1) as [MinionInstance];
  board.splice(to, 0, moved);
  return updatePlayer(state, playerId, (p) => ({ ...p, board }));
}

export function refreshShop(state: GameState, playerId: PlayerId, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  if (player.shopFrozen) {
    return state;
  }
  if (player.gold < COST_REFRESH)
    throw new Error(`Not enough gold to refresh (have ${player.gold}, need ${COST_REFRESH})`);

  const afterGold = updatePlayer(state, playerId, (p) => ({ ...p, gold: p.gold - COST_REFRESH }));
  // Return shop to pool, draw fresh
  const poolAfterReturn = returnToPool(afterGold.pool, player.shop);
  const size = SHOP_SIZE_BY_TIER[player.tier];
  const { instances, pool } = drawFromPool(poolAfterReturn, player.tier, size, rng);

  return {
    ...updatePlayer(afterGold, playerId, (p) => ({ ...p, shop: instances })),
    pool,
  };
}

export function freezeShop(state: GameState, playerId: PlayerId): GameState {
  const player = getPlayer(state, playerId);
  return updatePlayer(state, playerId, (p) => ({ ...p, shopFrozen: !p.shopFrozen }));
}

export function upgradeTier(state: GameState, playerId: PlayerId): GameState {
  const player = getPlayer(state, playerId);
  if (player.tier >= 6) throw new Error("Already at max tier");
  if (player.gold < player.upgradeCost)
    throw new Error(`Not enough gold to upgrade (have ${player.gold}, need ${player.upgradeCost})`);

  const newTier = (player.tier + 1) as Tier;
  const nextUpgradeCost =
    newTier < 6 ? (TIER_UPGRADE_BASE[(newTier + 1) as Exclude<Tier, 1>] ?? 0) : 0;

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - p.upgradeCost,
    tier: newTier,
    upgradeCost: nextUpgradeCost,
    upgradedThisTurn: true,
  }));
}

/** Apply combo: all friendly minions with the combo keyword gain +2/+2. */
export function applyComboToBoard(state: GameState, playerId: PlayerId): GameState {
  return updatePlayer(state, playerId, (p) => {
    const newBoard = p.board.map((m) => {
      if (!m.keywords.has("combo" as import("./types").Keyword)) return m;
      return {
        ...m,
        atk: m.atk + 2,
        hp: m.hp + 2,
        maxHp: m.maxHp + 2,
      };
    });
    return { ...p, board: newBoard };
  });
}

/** Fire onShopSummon hooks when a minion is summoned to the player's board. */
function fireShopSummon(
  state: GameState,
  playerId: PlayerId,
  summoned: MinionInstance,
  rng: Rng,
): GameState {
  const player = getPlayer(state, playerId);
  let result = state;
  for (const m of player.board) {
    const hook = m.hooks?.onShopSummon;
    if (!hook) continue;
    result = hook({ self: m, playerId, state: result, rng, spellDamage: 0, summoned });
  }
  return result;
}

/** Fire onRecruitSummon hooks when a friendly minion is summoned to the player's board. */
function fireRecruitSummon(
  state: GameState,
  playerId: PlayerId,
  summoned: MinionInstance,
  rng: Rng,
): GameState {
  const player = getPlayer(state, playerId);
  let result = state;
  for (const m of player.board) {
    const hook = m.hooks?.onRecruitSummon;
    if (!hook) continue;
    result = hook({
      self: m,
      playerId,
      state: result,
      rng,
      spellDamage: 0,
      summoned,
    });
  }
  return result;
}
