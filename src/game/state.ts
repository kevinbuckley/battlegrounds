import { makeRng, type Rng } from "@/lib/rng";
import { goldenTouch, pickAnomaly } from "./anomalies";
import { baseGoldForTurn, TIER_UPGRADE_BASE } from "./economy";
import { HEROES } from "./heroes/index";
import {
  buildPool,
  buyMinion,
  freezeShop,
  playMinionToBoard,
  refreshShop,
  reorderBoard,
  rollShopForPlayer,
  sellMinion,
  upgradeTier,
} from "./shop";
import { SPELLS } from "./spells/index";
import { pickTrinket, pickTrinketForPlayer, TRINKETS } from "./trinkets";
import { checkAndProcessTriples } from "./triples";
import type {
  Action,
  AnomalyCard,
  GameState,
  ModifierId,
  PlayerState,
  Tier,
  Tribe,
  TrinketCard,
  TrinketInstance,
} from "./types";
import { getPlayer, updatePlayer } from "./utils";

// ---------------------------------------------------------------------------
// Hero power
// ---------------------------------------------------------------------------

function useHeroPower(state: GameState, playerId: number, target: unknown, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  const hero = HEROES[player.heroId];
  if (!hero || hero.power.kind !== "active") return state;

  const cost = hero.power.cost;
  if (player.gold < cost) throw new Error(`Not enough gold for hero power (need ${cost})`);
  if (player.heroPowerUsed) throw new Error("Hero power already used this turn");

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - cost,
    heroPowerUsed: true,
  }));

  if (hero.onHeroPower) {
    next = hero.onHeroPower(next, playerId, target, rng);
  }

  return next;
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Spell helpers
// ------->-->-->-->-->-->-->-->-->-->-->-->

function buySpell(state: GameState, playerId: number, shopIndex: number, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  // Spells are in the shop slots after shop size
  const shopItems = player.shop;
  const shopSize = Math.floor(shopItems.length * 0.25); // 1/4 of slots are spells
  const spellSlots = shopItems.slice(-shopSize);

  if (shopIndex < 0 || shopIndex >= spellSlots.length) {
    throw new Error(`No spell at shop index ${shopIndex}`);
  }

  const spellInstance = spellSlots[shopIndex]!;
  const spellCard = SPELLS[spellInstance.cardId];
  if (!spellCard) throw new Error(`Unknown spell: ${spellInstance.cardId}`);

  if (player.gold < spellCard.cost) {
    throw new Error(`Not enough gold to buy spell (need ${spellCard.cost})`);
  }

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    gold: p.gold - spellCard.cost,
    spells: [...p.spells, spellInstance] as import("./types").SpellInstance[],
  }));
}

function playSpell(state: GameState, playerId: number, spellIndex: number, rng: Rng): GameState {
  const player = getPlayer(state, playerId);
  const spellInstance = player.spells[spellIndex];
  if (!spellInstance) throw new Error(`No spell at index ${spellIndex}`);

  const spellCard = SPELLS[spellInstance.cardId];
  if (!spellCard) throw new Error(`Unknown spell: ${spellInstance.cardId}`);

  if (spellCard.effects.onPlay) {
    const ctx = {
      self: {
        instanceId: spellInstance.instanceId,
        cardId: spellInstance.cardId,
        atk: 0,
        hp: 0,
        maxHp: 0,
        keywords: new Set(),
        tribes: [] as string[],
        golden: false,
        attachments: {},
        hooks: {},
      } as unknown as import("./types").MinionInstance,
      playerId,
      state,
      rng,
    };
    return spellCard.effects.onPlay(ctx);
  }

  return state;
}

const ALL_TRIBES: Tribe[] = [
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

const LOBBY_TRIBE_COUNT = 5;

// ---------------------------------------------------------------------------
// Top-level reducer
// ---------------------------------------------------------------------------

export function step(state: GameState, action: Action, rng: Rng): GameState {
  switch (state.phase.kind) {
    case "HeroSelection":
      return stepHeroSelection(state, action, rng);
    case "Recruit":
      return stepRecruit(state, action, rng);
    case "Combat":
      return stepCombat(state, action, rng);
    case "GameOver":
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hero selection phase
// ---------------------------------------------------------------------------

function stepHeroSelection(state: GameState, action: Action, rng: Rng): GameState {
  if (action.kind !== "SelectHero") return state;

  const hero = HEROES[action.heroId];
  if (!hero) throw new Error(`Unknown hero: ${action.heroId}`);

  const afterSelect = updatePlayer(state, action.player, (p) => ({
    ...p,
    heroId: action.heroId,
    hp: hero.startHp,
    armor: hero.startArmor,
  }));

  const allSelected = afterSelect.players.every((p) => p.heroId !== "");
  if (!allSelected) return afterSelect;

  return beginRecruitTurn(afterSelect, rng);
}

// ---------------------------------------------------------------------------
// Recruit phase
// ---------------------------------------------------------------------------

function stepRecruit(state: GameState, action: Action, rng: Rng): GameState {
  switch (action.kind) {
    case "BuyMinion":
      return buyMinion(state, action.player, action.shopIndex, rng);
    case "BuySpell":
      return buySpell(state, action.player, action.shopIndex, rng);
    case "PlaySpell":
      return playSpell(state, action.player, action.spellIndex, rng);
    case "SellMinion":
      return sellMinion(state, action.player, action.boardIndex);
    case "PlayMinion":
      return playMinionToBoard(state, action.player, action.handIndex, action.boardIndex, rng);
    case "ReorderBoard":
      return reorderBoard(state, action.player, action.from, action.to);
    case "RefreshShop":
      return refreshShop(state, action.player, rng);
    case "FreezeShop":
      return freezeShop(state, action.player);
    case "UpgradeTier":
      return upgradeTier(state, action.player);
    case "HeroPower":
      return useHeroPower(state, action.player, action.target, rng);
    case "EndTurn":
      return endTurn(state, action.player, rng);
    case "PickDiscover":
      return pickDiscover(state, action.player, action.index);
    case "DismissDiscover":
      return dismissDiscover(state, action.player);
    default:
      return state;
  }
}

function endTurn(state: GameState, playerId: number, rng: Rng): GameState {
  const nextTurn = state.turn + 1;
  let result = { ...state, turn: nextTurn };

  // Check for triples at end of turn (between rounds)
  result = checkAndProcessTriples(result, playerId, rng);

  return beginRecruitTurn(result, rng);
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Discover handlers
// ------->-->-->-->-->-->-->-->-->-->-->-->

function pickDiscover(state: GameState, playerId: number, index: number): GameState {
  const player = getPlayer(state, playerId);
  const offer = player.discoverOffer?.offers[index];
  if (!offer) return state;

  return updatePlayer(state, playerId, (p) => ({
    ...p,
    hand: [...p.hand, offer.minion],
    discoverOffer: null,
  }));
}

function dismissDiscover(state: GameState, playerId: number): GameState {
  const player = getPlayer(state, playerId);
  if (!player.discoverOffer) return state;

  return updatePlayer(state, playerId, (p) => ({ ...p, discoverOffer: null }));
}

// ---------------------------------------------------------------------------
// Combat phase (stub for future multi-player expansion)
// ---------------------------------------------------------------------------

function stepCombat(state: GameState, _action: Action, _rng: Rng): GameState {
  return state;
}

// ---------------------------------------------------------------------------
// Turn transitions
// ---------------------------------------------------------------------------

export function beginRecruitTurn(state: GameState, rng: Rng): GameState {
  const turn = state.turn === 0 ? 1 : state.turn;
  const gold = baseGoldForTurn(turn);

  let next: GameState = {
    ...state,
    phase: { kind: "Recruit", turn },
    turn,
  };

  for (const player of state.players) {
    if (player.eliminated) continue;

    const discountedCost =
      !player.upgradedThisTurn && player.tier < 6
        ? Math.max(0, player.upgradeCost - 1)
        : player.upgradeCost;

    next = updatePlayer(next, player.id, (p) => ({
      ...p,
      gold,
      upgradeCost: discountedCost,
      upgradedThisTurn: false,
      heroPowerUsed: false,
    }));

    next = rollShopForPlayer(next, player.id, rng.fork(`shop:${player.id}:${turn}`));
  }

  return next;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function makeInitialState(seed: number): GameState {
  const rng = makeRng(seed);
  const tribesInLobby = rng.shuffle(ALL_TRIBES).slice(0, LOBBY_TRIBE_COUNT) as Tribe[];
  const pool = buildPool(tribesInLobby);

  const players: PlayerState[] = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    name: i === 0 ? "You" : `AI ${i}`,
    heroId: "",
    hp: 0,
    armor: 0,
    gold: 0,
    tier: 1,
    upgradeCost: TIER_UPGRADE_BASE[2],
    board: [],
    hand: [],
    shop: [],
    shopFrozen: false,
    upgradedThisTurn: false,
    heroPowerUsed: false,
    eliminated: false,
    placement: null,
    aiMemo: {},
    spells: [],
    discoverOffer: null,
    trinkets: [],
  }));

  // Roll for modifiers per 10-lobby-modifiers.md spec
  const allModifiers: ModifierId[] = ["trinkets", "spells", "anomalies", "quests", "buddies"];
  const activeModifiers: ModifierId[] = [];
  for (const mod of allModifiers) {
    if (rng.next() < 0.5) activeModifiers.push(mod as ModifierId);
  }

  let modifiersState: GameState["modifierState"] = {};

  if (activeModifiers.includes("anomalies")) {
    const anomaly = pickAnomaly(rng);
    const game: GameState = {
      seed,
      phase: { kind: "HeroSelection" },
      turn: 0,
      players,
      tribesInLobby,
      pool,
      pairingsHistory: [],
      modifiers: activeModifiers,
      modifierState: {},
    };
    anomaly.onSetup(game, rng);
    modifiersState = { anomaly: anomaly.id };
  }

  if (activeModifiers.includes("trinkets")) {
    modifiersState = { ...modifiersState, trinkets: [] as TrinketInstance[] };
    const trinketState: GameState = {
      seed,
      phase: { kind: "HeroSelection" },
      turn: 0,
      players,
      tribesInLobby,
      pool,
      pairingsHistory: [],
      modifiers: activeModifiers,
      modifierState: { ...modifiersState },
    };
    for (const player of trinketState.players) {
      const picked = pickTrinketForPlayer(trinketState, player.id, rng);
      if (!picked) continue;
      const instance: TrinketInstance = {
        instanceId: `trinket_${player.id}`,
        cardId: picked.id,
        applied: false,
      };
      trinketState.players[player.id] = {
        ...player,
        trinkets: [
          ...((player as PlayerState & { trinkets?: TrinketInstance[] }).trinkets ?? []),
          instance,
        ],
      };
      modifiersState = {
        ...modifiersState,
        trinkets: [...((modifiersState.trinkets as TrinketInstance[]) ?? []), instance],
      };
    }
  }

  return {
    seed,
    phase: { kind: "HeroSelection" },
    turn: 0,
    players,
    tribesInLobby,
    pool,
    pairingsHistory: [],
    modifiers: activeModifiers,
    modifierState: modifiersState,
  };
}

export function rngForTurn(state: GameState, label: string): Rng {
  return makeRng(state.seed).fork(`turn:${state.turn}:${label}`);
}
