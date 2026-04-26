"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getHero, HEROES } from "@/game/heroes/index";
import { MINIONS } from "@/game/minions/index";
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
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
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
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div className="flex items-center justify-between">
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
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-sm text-slate-400">Gold</span>
                <span className="text-lg font-semibold text-amber-400">
                  {gameState.players[0]?.gold ?? 0}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-slate-400">Tier</span>
                <span className="text-lg font-semibold text-blue-400">
                  {gameState.players[0]?.tier ?? 1}
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400">
            Phase: {gameState.phase.kind} (Turn {gameState.turn})
          </p>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">Tavern</h2>
            <div className="flex gap-3">
              {(gameState.players[0]?.shop ?? []).map((minion) => {
                const card = MINIONS[minion.cardId];
                if (!card) return null;
                const tierColor =
                  card.tier === 1
                    ? "bg-emerald-600"
                    : card.tier === 2
                      ? "bg-blue-600"
                      : card.tier === 3
                        ? "bg-purple-600"
                        : card.tier === 4
                          ? "bg-orange-600"
                          : card.tier === 5
                            ? "bg-red-600"
                            : "bg-yellow-600";
                return (
                  <div
                    key={minion.instanceId}
                    className="flex min-w-[120px] flex-col gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white ${tierColor}`}
                      >
                        T{card.tier}
                      </span>
                      <span className="text-xs text-slate-400">{card.tribes.join("/")}</span>
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-slate-300">
                      {card.name}
                    </span>
                    <div className="flex gap-3 text-sm font-bold">
                      <span className="flex items-center gap-1 text-red-400">
                        {card.baseAtk}
                        <span>⚔</span>
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        {card.baseHp}
                        <span>❤</span>
                      </span>
                    </div>
                    {card.baseKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Array.from(card.baseKeywords).map((kw) => (
                          <span
                            key={kw}
                            className="rounded bg-slate-700 px-1 py-0.5 text-[10px] text-slate-300"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!(gameState.players[0]?.shop ?? []).length && (
                <p className="text-slate-500">Shop is empty</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
