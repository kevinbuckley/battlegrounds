import { HEROES } from "@/game/heroes/index";
import { TRINKETS } from "@/game/trinkets";
import type { GameState } from "@/game/types";

interface LeaderboardProps {
  state: GameState;
  heroId: string;
}

function getTierColor(tier: number): string {
  const colors: Record<number, string> = {
    1: "from-emerald-600 to-emerald-700",
    2: "from-blue-600 to-blue-700",
    3: "from-purple-600 to-purple-700",
    4: "from-orange-600 to-orange-700",
    5: "from-red-600 to-red-700",
    6: "from-yellow-600 to-yellow-700",
  };
  return colors[tier] ?? "from-gray-600 to-gray-700";
}

export function Leaderboard({ state, heroId }: LeaderboardProps) {
  const players = state.players;
  const playerId = players.findIndex((p) => p.heroId === heroId);
  const currentPlayer = (players[playerId] || {
    tier: 1,
    hp: 0,
    armor: 0,
    board: [] as const,
    trinkets: [],
  }) as (typeof players)[number];
  const opponent = players.find((p) => p.id !== playerId && p.heroId !== "" && !p.eliminated);

  // Build ranking: eliminated first (by placement asc), then alive (by HP desc)
  const ranked = [...players].sort((a, b) => {
    if (a.eliminated && b.eliminated) {
      if (a.placement !== null && b.placement !== null) return a.placement - b.placement;
      if (a.placement !== null) return -1;
      if (b.placement !== null) return 1;
      return a.hp - b.hp;
    }
    if (a.eliminated && !b.eliminated) return -1;
    if (!a.eliminated && b.eliminated) return 1;
    return b.hp - a.hp;
  });

  // Determine current rank of the player
  let currentRank: number | null = null;
  for (let i = 0; i < ranked.length; i++) {
    if (ranked[i]!.id === playerId) {
      currentRank = i + 1;
      break;
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h2 className="mb-3 text-xl font-semibold text-slate-100">Standings</h2>

      <div className="flex flex-col gap-2">
        {/* Current player highlight */}
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/5 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-slate-950">
            {currentRank}
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getTierColor(currentPlayer.tier)} text-sm font-bold text-white`}
          >
            {(() => {
              const hero = HEROES[heroId];
              return hero ? hero.name.charAt(0) : "?";
            })()}
          </div>
          <span className="flex-1 text-sm text-slate-200">
            {(() => {
              const hero = HEROES[heroId];
              return hero ? hero.name : "???";
            })()}
          </span>
          <span className="text-sm font-mono text-emerald-400">{currentPlayer.hp} HP</span>
          {currentPlayer.armor > 0 && (
            <span className="text-xs font-mono text-sky-400">+{currentPlayer.armor} A</span>
          )}
          {currentPlayer.trinkets.length > 0 &&
            (() => {
              const trinket = TRINKETS[currentPlayer.trinkets[0]!.cardId];
              return trinket ? (
                <span className="text-xs font-medium text-amber-400" title={trinket.description}>
                  {trinket.name}
                </span>
              ) : null;
            })()}
        </div>

        {/* Opponent preview */}
        {opponent && opponent.heroId && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-400">
              {(() => {
                let r = 0;
                for (let i = 0; i < ranked.length; i++) {
                  if (ranked[i]!.id === opponent.id) {
                    r = i + 1;
                    break;
                  }
                }
                return r;
              })()}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getTierColor(opponent.tier)} text-sm font-bold text-white`}
            >
              {(() => {
                const hero = HEROES[opponent.heroId];
                return hero ? hero.name.charAt(0) : "?";
              })()}
            </div>
            <span className="flex-1 text-sm text-slate-400">
              {(() => {
                const hero = HEROES[opponent.heroId];
                return hero ? hero.name : "?";
              })()}
            </span>
            <span className="text-sm font-mono text-emerald-400">{opponent.hp} HP</span>
            {opponent.armor > 0 && (
              <span className="text-xs font-mono text-sky-400">+{opponent.armor} A</span>
            )}
          </div>
        )}

        {/* Eliminated players shown as ghosts */}
        {ranked
          .filter((p) => p.id !== playerId)
          .filter((p) => p.eliminated)
          .map((p) => {
            const rank = p.placement ?? "?";
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 opacity-40"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-600">
                  {rank}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-600">
                  {(() => {
                    const hero = HEROES[p.heroId];
                    return hero ? hero.name.charAt(0) : "?";
                  })()}
                </div>
                <span className="flex-1 text-sm text-slate-600">
                  {(() => {
                    const hero = HEROES[p.heroId];
                    return hero ? hero.name : "?";
                  })()}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
