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
        {ranked.map((p) => {
          const isCurrentPlayer = p.id === playerId;
          const hero = HEROES[p.heroId];
          const heroName = hero ? hero.name : p.heroId ? p.heroId : "???";
          const rank = p.placement ?? (isCurrentPlayer ? currentRank : null);

          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isCurrentPlayer
                  ? "border border-amber-500/50 bg-amber-500/5"
                  : p.eliminated
                    ? "border border-slate-800 bg-slate-900/50 opacity-40"
                    : "border border-slate-700 bg-slate-800/50"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                  isCurrentPlayer
                    ? "bg-amber-500 text-slate-950"
                    : p.eliminated
                      ? "bg-slate-800 text-slate-600"
                      : "bg-slate-700 text-slate-400"
                }`}
              >
                {rank ?? "?"}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getTierColor(p.tier)} text-sm font-bold text-white`}
              >
                {hero ? hero.name.charAt(0) : "?"}
              </div>
              <span
                className={`flex-1 text-sm ${
                  isCurrentPlayer
                    ? "text-slate-200"
                    : p.eliminated
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {heroName}
              </span>
              {!p.eliminated && (
                <>
                  <span className="text-sm font-mono text-emerald-400">{p.hp} HP</span>
                  {p.armor > 0 && (
                    <span className="text-xs font-mono text-sky-400">+{p.armor} A</span>
                  )}
                  {p.trinkets.length > 0 &&
                    (() => {
                      const trinket = TRINKETS[p.trinkets[0]!.cardId];
                      return trinket ? (
                        <span
                          className="text-xs font-medium text-amber-400"
                          title={trinket.description}
                        >
                          {trinket.name}
                        </span>
                      ) : null;
                    })()}
                </>
              )}
              {p.eliminated && <span className="text-xs font-medium text-red-500">Eliminated</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
