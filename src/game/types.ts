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

export type Keyword =
  | "taunt"
  | "divineShield"
  | "windfury"
  | "megaWindfury"
  | "poisonous"
  | "reborn"
  | "venomous"
  | "cleave"
  | "lifesteal"
  | "rush"
  | "freeze"
  | `collateralDamage${number}`
  | "magnetic"
  | "combo"
  | "bounty";

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
  /** Bonus to spell damage provided by this minion. */
  spellDamage: number;
  /** When true, this minion can be played on top of a friendly minion of the same tribe. */
  magnetic?: boolean;
  /** When set, this minion has the bounty keyword and costs this much gold. */
  bountyCost?: number;
  /** When true, deathrattles on this minion trigger twice. */
  baronRivendare?: boolean;
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
  /** Total spell damage from all board minions. */
  spellDamage: number;
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
  /** Which side the dead minion was on. */
  deadSide: Side;
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
  /** Fires when a minion is played from hand to board (recruit phase). */
  onPlay?: (ctx: RecruitCtx) => GameState;
  onStartOfCombat?: (ctx: CombatCtx) => void;
  onAttack?: (ctx: AttackCombatCtx) => void;
  onDeath?: (ctx: CombatCtx) => void;
  onAllyDeath?: (ctx: AllyDeathCombatCtx) => void;
  onSummon?: (ctx: SummonCombatCtx) => void;
  /** Fires when a friendly divine shield is removed (popped) during combat. */
  onDivineShieldPop?: (ctx: CombatCtx) => void;
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
  spellDamage: number;
  magnetic?: boolean;
  baronRivendare?: boolean;
  attachments: Record<string, unknown>;
  /** Hook functions copied from the card definition at instantiation time. */
  hooks: MinionHooks;
  /** Gold discount applied at purchase time (e.g. from anomalies). */
  discount?: number;
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
  /**
   * Called when the player sells a minion. Returns the new game state.
   */
  onSell?: (state: GameState, playerId: PlayerId) => GameState;
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
  extraLifeUsed: boolean;
  placement: number | null;
  aiMemo: Record<string, unknown>;
  spells: SpellInstance[];
  /** Active discover offers (triples, hero powers, etc). */
  discoverOffer: { offers: DiscoverOffer[]; title?: string } | null;
  /** Trinket instances granted to this player by the trinket modifier. */
  trinkets: TrinketInstance[];
  /** Active quest for this player (if the quests modifier is active). */
  quests: QuestInstance[];
  /** Buddy instances for this player (if the buddies modifier is active). */
  buddies: BuddyInstance[];
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

export type QuestId = string;

export interface QuestCard {
  id: QuestId;
  name: string;
  description: string;
  /** Returns the new game state after this quest's progress is updated. */
  onProgress: (state: GameState, playerId: PlayerId, rng: Rng) => GameState;
  /** Whether this quest is complete. Called after onProgress. */
  isComplete: (state: GameState, playerId: PlayerId) => boolean;
  /** Reward given when the quest is completed. */
  onReward: (state: GameState, playerId: PlayerId, rng: Rng) => GameState;
}

export interface QuestInstance {
  instanceId: string;
  cardId: QuestId;
  /** Current progress toward the quest goal. */
  progress: number;
  /** The target number of progress points needed to complete the quest. */
  target: number;
  /** Whether the quest has been completed and reward claimed. */
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Buddies
// ---------------------------------------------------------------------------

export type BuddyId = string;

export interface BuddyCard {
  id: BuddyId;
  name: string;
  description: string;
  /** Hero this buddy belongs to (empty = all heroes). */
  heroId: string;
  /** Minion card to summon when the buddy is activated. */
  minionCardId: string;
  /** Number of turns before the buddy activates. */
  activationTurn: number;
}

export interface BuddyInstance {
  instanceId: string;
  cardId: BuddyId;
  /** Whether this buddy has been activated (minion added to hand). */
  activated: boolean;
  /** The turn at which this buddy activates. */
  activationTurn: number;
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
    quests?: Record<PlayerId, QuestInstance>;
    buddies?: Record<PlayerId, BuddyInstance[]>;
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
  | { kind: "Lifesteal"; target: MinionInstanceId; amount: number }
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
