import type { Rng } from "@/lib/rng";

export type Tribe =
  | "Beast"
  | "Murloc"
  | "Demon"
  | "Mech"
  | "Elemental"
  | "Pirate"
  | "Dragon"
  | "Naga"
  | "Quilboar"
  | "Undead"
  | "All";

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

export type Keyword = "taunt" | "divineShield" | "windfury" | "poisonous" | "reborn" | "venomous";

export type MinionCardId = string;
export type MinionInstanceId = string;

export interface MinionCard {
  id: MinionCardId;
  name: string;
  tier: Tier;
  tribes: Tribe[];
  baseAtk: number;
  baseHp: number;
  baseKeywords: Keyword[];
  hooks: MinionHooks;
}

// ---------------------------------------------------------------------------
// Hook contexts
// ---------------------------------------------------------------------------

// Recruit-phase hooks are pure: receive context, return new GameState.
export interface RecruitCtx {
  self: MinionInstance;
  playerId: PlayerId;
  state: GameState;
  rng: Rng;
}

// Combat-phase hooks mutate in place via mutable arrays + emit.
export interface CombatCtx {
  self: MinionInstance;
  selfSide: Side;
  left: MinionInstance[];
  right: MinionInstance[];
  emit: (event: CombatEvent) => void;
  rng: Rng;
}

export interface AttackCombatCtx extends CombatCtx {
  target: MinionInstance;
}

export interface AllyDeathCombatCtx extends CombatCtx {
  /** The minion that just died. */
  dead: MinionInstance;
}

export interface SummonCombatCtx extends CombatCtx {
  summoned: MinionInstance;
}

export interface MinionHooks {
  onBattlecry?: (ctx: RecruitCtx) => GameState;
  onSell?: (ctx: RecruitCtx) => GameState;
  onBuy?: (ctx: RecruitCtx) => GameState;
  onTurnStart?: (ctx: RecruitCtx) => GameState;
  onTurnEnd?: (ctx: RecruitCtx) => GameState;
  onStartOfCombat?: (ctx: CombatCtx) => void;
  onAttack?: (ctx: AttackCombatCtx) => void;
  onDeath?: (ctx: CombatCtx) => void;
  onAllyDeath?: (ctx: AllyDeathCombatCtx) => void;
  onSummon?: (ctx: SummonCombatCtx) => void;
}

// ---------------------------------------------------------------------------
// Minion instances
// ---------------------------------------------------------------------------

export interface MinionInstance {
  instanceId: MinionInstanceId;
  cardId: MinionCardId;
  atk: number;
  hp: number;
  maxHp: number;
  keywords: Set<Keyword>;
  tribes: Tribe[];
  golden: boolean;
  attachments: Record<string, unknown>;
  /** Hook functions copied from the card definition at instantiation time. */
  hooks: MinionHooks;
}

// ---------------------------------------------------------------------------
// Heroes
// ---------------------------------------------------------------------------

export type HeroId = string;

export interface Hero {
  id: HeroId;
  name: string;
  /** One-line description shown in the hero-selection UI. */
  description: string;
  startHp: number; // 25–60; Patchwerk starts at 60
  startArmor: 0 | 3 | 5 | 7 | 9 | 11;
  power: HeroPower;
  /**
   * Called when the player uses the hero power (active powers only).
   * Returns the new game state. `target` is hero-specific (e.g. board index).
   */
  onHeroPower?: (state: GameState, playerId: PlayerId, target: unknown, rng: Rng) => GameState;
}

export type HeroPower =
  | { kind: "passive" }
  | { kind: "active"; cost: number; usesPerTurn: number }
  | { kind: "start_of_game" }
  | { kind: "quest"; progress: number; target: number };

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export type PlayerId = number;

export interface PlayerState {
  id: PlayerId;
  name: string;
  heroId: HeroId;
  hp: number;
  armor: number;
  gold: number;
  tier: Tier;
  upgradeCost: number;
  board: MinionInstance[];
  hand: MinionInstance[];
  shop: MinionInstance[];
  shopFrozen: boolean;
  upgradedThisTurn: boolean;
  heroPowerUsed: boolean;
  eliminated: boolean;
  placement: number | null;
  aiMemo: Record<string, unknown>;
  spells: SpellInstance[];
  /** Active discover offers (triples, hero powers, etc). */
  discoverOffer: { offers: DiscoverOffer[]; title?: string } | null;
  /** Trinket instances granted to this player by the trinket modifier. */
  trinkets: TrinketInstance[];
}

export type Phase =
  | { kind: "HeroSelection" }
  | { kind: "Recruit"; turn: number }
  | { kind: "Combat"; turn: number }
  | { kind: "GameOver"; winner: PlayerId };

export type ModifierId = "trinkets" | "spells" | "anomalies" | "quests" | "buddies";

export type AnomalyId = string;

export interface AnomalyCard {
  id: AnomalyId;
  name: string;
  description: string;
  /** Called once when the anomaly is selected at lobby start. Can mutate GameState in place. */
  onSetup: (state: GameState, rng: Rng) => void;
}

export type TrinketId = string;

export interface TrinketCard {
  id: TrinketId;
  name: string;
  description: string;
  /** Cost in gold to purchase (0 = free between-round grant). */
  cost: number;
  /** Tiers at which this trinket can appear. */
  tiers: Tier[];
  /** Applied immediately when the trinket is given to the player. Returns new GameState. */
  onApply: (state: GameState, playerId: PlayerId, rng: Rng) => GameState;
}

export interface TrinketInstance {
  instanceId: string;
  cardId: TrinketId;
  /** Whether this trinket has been applied yet. */
  applied: boolean;
}

export interface GameState {
  seed: number;
  phase: Phase;
  turn: number;
  players: PlayerState[];
  tribesInLobby: Tribe[];
  pool: Record<MinionCardId, number>;
  pairingsHistory: Array<[PlayerId, PlayerId]>;
  /** Active lobby modifiers for this session. */
  modifiers: ModifierId[];
  modifierState: {
    anomaly?: AnomalyId;
    trinkets?: TrinketInstance[];
  };
}

// ---------------------------------------------------------------------------
// Spells
// ---------------------------------------------------------------------------

export type SpellId = string;

export interface SpellEffects {
  onPlay?: (ctx: RecruitCtx) => GameState;
}

export interface SpellCard {
  id: SpellId;
  name: string;
  description: string;
  cost: number;
  tiers: Tier[];
  effects: SpellEffects;
}

export interface SpellInstance {
  instanceId: string;
  cardId: SpellId;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action =
  | { kind: "SelectHero"; player: PlayerId; heroId: HeroId }
  | { kind: "BuyMinion"; player: PlayerId; shopIndex: number }
  | { kind: "BuySpell"; player: PlayerId; shopIndex: number }
  | { kind: "PlaySpell"; player: PlayerId; spellIndex: number }
  | { kind: "SellMinion"; player: PlayerId; boardIndex: number }
  | { kind: "PlayMinion"; player: PlayerId; handIndex: number; boardIndex: number }
  | { kind: "ReorderBoard"; player: PlayerId; from: number; to: number }
  | { kind: "RefreshShop"; player: PlayerId }
  | { kind: "FreezeShop"; player: PlayerId }
  | { kind: "UpgradeTier"; player: PlayerId }
  | { kind: "HeroPower"; player: PlayerId; target?: unknown }
  | { kind: "EndTurn"; player: PlayerId }
  | { kind: "DismissDiscover"; player: PlayerId }
  | { kind: "PickDiscover"; player: PlayerId; index: number };

export interface DiscoverOffer {
  /** The instance of the minion being offered (from the discover pool). */
  minion: MinionInstance;
  /** A unique id to track this offer entry independently of the minion's instance. */
  offerId: string;
}

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

export type Side = "left" | "right";

export type CombatEvent =
  | { kind: "StartOfCombat"; source: MinionInstanceId }
  | { kind: "Attack"; attacker: MinionInstanceId; target: MinionInstanceId }
  | { kind: "Damage"; target: MinionInstanceId; amount: number }
  | { kind: "DivineShield"; target: MinionInstanceId }
  | { kind: "Death"; source: MinionInstanceId }
  | { kind: "Summon"; card: MinionCardId; side: Side; position: number }
  | { kind: "Stat"; target: MinionInstanceId; atk: number; hp: number }
  | { kind: "End"; winner: Side | "draw" };

export interface CombatResult {
  transcript: CombatEvent[];
  survivorsLeft: MinionInstance[];
  survivorsRight: MinionInstance[];
  winner: Side | "draw";
}
