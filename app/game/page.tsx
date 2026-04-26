"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getHero, HEROES } from "@/game/heroes/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { GameState } from "@/game/types";

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const heroId = searchParams.get("hero");
    if (!heroId) {
      router.push("/hero-select" as never);
      // ^ TypeScript doesn't know about the new route yet
      return;
    }

    const hero = getHero(heroId);
    if (!hero) {
      setError(`Unknown hero: ${heroId}`);
      return;
    }

    const state = makeInitialState(Date.now());
    const updated = step(
      state,
      { kind: "SelectHero", player: 0, heroId },
      rngForTurn(state, "selectHero"),
    );
    setGameState(updated);
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      {error && (
        <>
          <h2 className="text-2xl font-semibold text-red-400">{error}</h2>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Go back
          </button>
        </>
      )}
      {!gameState && !error && <p className="text-slate-400">Loading...</p>}
      {gameState && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-amber-500 bg-slate-800 text-3xl font-bold text-slate-100">
                {(() => {
                  const p = gameState.players[0] ?? gameState.players.at(-1);
                  const hero = p?.heroId ? HEROES[p.heroId] : undefined;
                  return hero ? hero.name.charAt(0) : "?";
                })()}
              </div>
              <span className="text-sm text-slate-400">Hero</span>
              <span className="text-lg font-semibold">
                {(() => {
                  const p = gameState.players[0] ?? gameState.players.at(-1);
                  const hero = p?.heroId ? HEROES[p.heroId] : undefined;
                  return p?.heroId && hero ? hero.name : (p?.heroId ?? "None");
                })()}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-slate-400">HP</span>
              <span className="text-lg font-semibold text-emerald-400">
                {gameState.players[0]?.hp ?? 0}
              </span>
            </div>
          </div>
          <p className="text-slate-400">
            Phase: {gameState.phase.kind} (Turn {gameState.turn})
          </p>
        </div>
      )}
    </main>
  );
}
