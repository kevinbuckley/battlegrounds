import type { Rng } from "@/lib/rng";
import type { GameState, PlayerId, Tier, TrinketCard } from "../types";

/** Grants +2 max HP to all friendly minions. */
export const ironCladdagh: TrinketCard = {
  id: "iron_claddagh",
  name: "Ironcladdagh",
  description: "Your minions have +2 max HP.",
  cost: 0,
  tiers: [2, 3, 4, 5, 6],
  onApply: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = state.players[playerId];
    if (!player) return state;

    return {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              board: p.board.map((m) => ({
                ...m,
                hp: m.hp + 2,
                maxHp: m.maxHp + 2,
              })),
            }
          : p,
      ),
    };
  },
};

/** Grants +3/+3 to a random friendly minion. */
export const rallyingBanner: TrinketCard = {
  id: "rallying_banner",
  name: "Rallying Banner",
  description: "Give a random friendly minion +3/+3.",
  cost: 0,
  tiers: [1, 2, 3, 4, 5, 6],
  onApply: (state: GameState, playerId: PlayerId, rng: Rng): GameState => {
    const player = state.players[playerId];
    if (!player || player.board.length === 0) return state;

    const target = rng.pick(player.board);
    if (!target) return state;

    const idx = player.board.indexOf(target);
    const newBoard = [...player.board];
    if (idx >= 0) {
      newBoard[idx] = {
        ...target,
        atk: target.atk + 3,
        hp: target.hp + 3,
        maxHp: target.maxHp + 3,
      };
    }
    return {
      ...state,
      players: state.players.map((p) => (p.id === playerId ? { ...p, board: newBoard } : p)),
    };
  },
};

/** Grants +1/+1 to all friendly minions. */
export const scalingSoul: TrinketCard = {
  id: "scaling_soul",
  name: "Scaling Soul",
  description: "Your minions have +1/+1 permanently.",
  cost: 0,
  tiers: [3, 4, 5, 6],
  onApply: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = state.players[playerId];
    if (!player) return state;

    return {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              board: p.board.map((m) => ({
                ...m,
                atk: m.atk + 1,
                hp: m.hp + 1,
                maxHp: m.maxHp + 1,
              })),
            }
          : p,
      ),
    };
  },
};

/** Grants +3/+3 to a random friendly minion and divineShield. */
export const goldenScales: TrinketCard = {
  id: "golden_scales",
  name: "Golden Scales",
  description: "Give a random friendly minion +3/+3 and Divine Shield.",
  cost: 0,
  tiers: [2, 3, 4, 5, 6],
  onApply: (state: GameState, playerId: PlayerId, rng: Rng): GameState => {
    const player = state.players[playerId];
    if (!player || player.board.length === 0) return state;

    const target = rng.pick(player.board);
    if (!target) return state;

    const idx = player.board.indexOf(target);
    const newBoard = [...player.board];
    if (idx >= 0) {
      newBoard[idx] = {
        ...target,
        atk: target.atk + 3,
        hp: target.hp + 3,
        maxHp: target.maxHp + 3,
        keywords: new Set(target.keywords).add("divineShield"),
      };
    }
    return {
      ...state,
      players: state.players.map((p) => (p.id === playerId ? { ...p, board: newBoard } : p)),
    };
  },
};

/** Grants +1 ATK to all friendly Demons. */
export const demonicPact: TrinketCard = {
  id: "demonic_pact",
  name: "Demonic Pact",
  description: "Your Demons have +1 ATK.",
  cost: 0,
  tiers: [3, 4, 5, 6],
  onApply: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = state.players[playerId];
    if (!player) return state;

    return {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              board: p.board.map((m) =>
                m.tribes.includes("Demon") ? { ...m, atk: m.atk + 1 } : m,
              ),
            }
          : p,
      ),
    };
  },
};

/** Grants +2 ATK to all friendly Beasts. */
export const beastlyTooth: TrinketCard = {
  id: "beastly_tooth",
  name: "Beastly Tooth",
  description: "Your Beasts have +2 ATK.",
  cost: 0,
  tiers: [2, 3, 4, 5, 6],
  onApply: (state: GameState, playerId: PlayerId, _rng: Rng): GameState => {
    const player = state.players[playerId];
    if (!player) return state;

    return {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              board: p.board.map((m) =>
                m.tribes.includes("Beast") ? { ...m, atk: m.atk + 2 } : m,
              ),
            }
          : p,
      ),
    };
  },
};

export const TRINKETS: Record<string, TrinketCard> = {
  [ironCladdagh.id]: ironCladdagh,
  [rallyingBanner.id]: rallyingBanner,
  [scalingSoul.id]: scalingSoul,
  [goldenScales.id]: goldenScales,
  [demonicPact.id]: demonicPact,
  [beastlyTooth.id]: beastlyTooth,
};

export function getTrinket(id: string): TrinketCard {
  const trinket = TRINKETS[id];
  if (!trinket) throw new Error(`Unknown trinket: ${id}`);
  return trinket;
}

export function getAllTrinketIds(): string[] {
  return Object.keys(TRINKETS);
}

export function pickTrinket(rng: Rng): TrinketCard {
  return rng.pick(getAllTrinketIds().map(getTrinket));
}

export function pickTrinketForPlayer(
  state: GameState,
  playerId: PlayerId,
  rng: Rng,
): TrinketCard | null {
  const player = state.players[playerId];
  if (!player) return null;
  const eligible = getAllTrinketIds().filter((id) =>
    TRINKETS[id as keyof typeof TRINKETS]?.tiers.includes(player.tier),
  );
  if (eligible.length === 0) return null;
  return rng.pick(eligible.map(getTrinket));
}
