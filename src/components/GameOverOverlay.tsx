"use client";

import { useRouter } from "next/navigation";
import { HEROES } from "@/game/heroes/index";
import type { GameState } from "@/game/types";

export function GameOverOverlay({ state }: { state: GameState }) {
  const router = useRouter();
  const winnerId = state.phase.kind === "GameOver" ? state.phase.winner : -1;
  const winner = state.players.find((p) => p.id === winnerId);
  const winnerHero = winner?.heroId ? HEROES[winner.heroId] : undefined;

  const winnerName = winnerHero?.name ?? "Unknown";
  const isPlayerWinner = winnerId === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-amber-500/40 bg-slate-950 px-12 py-10 shadow-2xl">
        <h1 className="text-4xl font-bold text-amber-400">
          {isPlayerWinner ? "Victory!" : "Defeat"}
        </h1>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xl text-slate-200">
            {isPlayerWinner ? "You won!" : `${winnerName} won!`}
          </span>
          {!isPlayerWinner && winner && (
            <span className="text-sm text-slate-400">Placement: {winner.placement ?? "?"}</span>
          )}
          {isPlayerWinner && <span className="text-sm text-slate-400">Placement: 1st</span>}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {state.players.map((p) => {
            const hero = p.heroId ? HEROES[p.heroId] : undefined;
            const isWinner = p.id === winnerId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  isWinner ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-900"
                }`}
              >
                <span className="text-sm text-slate-300">{hero?.name ?? "?"}</span>
                <span className="text-xs text-slate-500">
                  {p.eliminated ? `#${p.placement ?? "?"}` : "Alive"}
                </span>
                {isWinner && <span className="text-lg">{"\u{1F3C6}"}</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/hero-select" as never)}
            className="rounded-lg bg-amber-500 px-8 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
