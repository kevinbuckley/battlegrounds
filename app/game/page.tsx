"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { COST_BUY } from "@/game/economy";
import { getHero, HEROES } from "@/game/heroes/index";
import { MINIONS } from "@/game/minions/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { GameState } from "@/game/types";

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  const handleBuyMinion = useCallback(
    (shopIndex: number) => {
      if (!gameState) return;
      const player = gameState.players[0];
      if (!player) return;

      if (player.gold < COST_BUY) {
        setError(`Need ${COST_BUY} gold, have ${player.gold}`);
        return;
      }
      if (player.hand.length >= 10) {
        setError("Hand is full");
        return;
      }

      const minion = player.shop[shopIndex];
      if (!minion) return;

      try {
        const next = step(
          gameState,
          { kind: "BuyMinion", player: 0, shopIndex },
          rngForTurn(gameState, "buy"),
        );
        setGameState(next);
        setError(null);
      } catch {
        setError("Could not buy minion");
      }
    },
    [gameState],
  );

  const handleEndTurn = useCallback(() => {
    if (!gameState) return;
    const next = step(gameState, { kind: "EndTurn", player: 0 }, rngForTurn(gameState, "endTurn"));
    setGameState(next);
  }, [gameState]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-950/50 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {!gameState && !error && <p className="text-slate-400">Loading...</p>}
      {gameState && (
        <div className="flex w-full max-w-2xl flex-col gap-6">
          {/* HUD */}
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

          {/* Phase info */}
          <p className="text-center text-sm text-slate-400">
            Phase: {gameState.phase.kind} (Turn {gameState.turn})
          </p>

          {/* Hand */}
          {gameState.players[0]?.hand.length ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="mb-3 text-xl font-semibold text-slate-100">
                Hand ({gameState.players[0].hand.length}/10)
              </h2>
              <div className="flex gap-3">
                {gameState.players[0].hand.map((minion, i) => {
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
                      className="flex min-w-[120px] flex-col gap-2 rounded-lg border-2 border-amber-500/50 bg-slate-800 px-4 py-3 opacity-90"
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
                          {minion.atk}
                          <span>⚔</span>
                        </span>
                        <span className="flex items-center gap-1 text-orange-400">
                          {minion.hp}
                          <span>❤</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Board */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">
              Board ({gameState.players[0]?.board.length ?? 0}/7)
            </h2>
            <div className="flex gap-3">
              {[...Array(7)].map((_, targetIdx) => {
                const minion = gameState.players[0]?.board[targetIdx];
                if (minion) {
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
                  const isDragging = dragIndex === targetIdx;
                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: drag and drop board slot
                    <div
                      key={minion.instanceId}
                      draggable
                      onDragStart={() => setDragIndex(targetIdx)}
                      onDragEnd={() => setDragIndex(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragIndex !== null && dragIndex !== targetIdx && gameState) {
                          const next = step(
                            gameState,
                            { kind: "ReorderBoard", player: 0, from: dragIndex, to: targetIdx },
                            rngForTurn(gameState, "reorder"),
                          );
                          setGameState(next);
                        }
                        setDragIndex(null);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (dragIndex !== null) {
                          const target = e.currentTarget as HTMLElement;
                          target.style.borderColor = "rgba(251,191,36,0.8)";
                        }
                      }}
                      onDragLeave={(e) => {
                        if (dragIndex !== null) {
                          const target = e.currentTarget as HTMLElement;
                          target.style.borderColor = "rgba(59,130,246,0.5)";
                        }
                      }}
                      className={`flex min-w-[120px] flex-col gap-2 rounded-lg border-2 border-blue-500/50 bg-slate-800 px-4 py-3 transition ${
                        isDragging ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white ${tierColor}`}
                        >
                          T{card.tier}
                        </span>
                        <span className="text-xs text-slate-400">{card.tribes.join("/")}</span>
                      </div>
                      <span className="cursor-grab text-[11px] font-medium leading-tight text-slate-300">
                        {card.name}
                      </span>
                      <div className="flex gap-3 text-sm font-bold">
                        <span className="flex items-center gap-1 text-red-400">
                          {minion.atk}
                          <span>⚔</span>
                        </span>
                        <span className="flex items-center gap-1 text-orange-400">
                          {minion.hp}
                          <span>❤</span>
                        </span>
                      </div>
                      {minion.keywords.size > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(minion.keywords).map((kw) => (
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
                } else {
                  return (
                    <div
                      key={`empty-${targetIdx}`}
                      className={`flex min-w-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-3 transition ${
                        dragIndex !== null ? "border-amber-500/60 bg-amber-500/5" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const handMinion = gameState?.players[0]?.hand[dragIndex ?? -1];
                        if (dragIndex !== null && handMinion !== undefined && gameState) {
                          const next = step(
                            gameState,
                            {
                              kind: "PlayMinion",
                              player: 0,
                              handIndex: dragIndex,
                              boardIndex: targetIdx,
                            },
                            rngForTurn(gameState, "playMinion"),
                          );
                          setGameState(next);
                        }
                        setDragIndex(null);
                      }}
                      onDragEnter={(e) => {
                        if (dragIndex !== null) {
                          const target = e.currentTarget as HTMLElement;
                          target.classList.add("scale-105");
                        }
                      }}
                      onDragLeave={(e) => {
                        const target = e.currentTarget as HTMLElement;
                        target.classList.remove("scale-105");
                      }}
                    >
                      <span className="text-2xl text-slate-700">+</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Tavern / Shop */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">Tavern</h2>
            <div className="flex gap-3">
              {(gameState.players[0]?.shop ?? []).map((minion, idx) => {
                const card = MINIONS[minion.cardId];
                if (!card) return null;
                const canBuy =
                  (gameState.players[0]?.gold ?? 0) >= COST_BUY &&
                  gameState.phase.kind === "Recruit";
                const handFull = (gameState.players[0]?.hand.length ?? 0) >= 10;
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
                  <button
                    key={minion.instanceId}
                    type="button"
                    onClick={() => handleBuyMinion(idx)}
                    disabled={!canBuy || handFull}
                    className={`flex min-w-[120px] flex-col gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 transition ${
                      canBuy && !handFull
                        ? "cursor-pointer hover:border-amber-400 hover:bg-slate-750 active:scale-95"
                        : "cursor-not-allowed opacity-50"
                    }`}
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
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-400">
                      <span>⧉</span>
                      <span>{COST_BUY}</span>
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
                  </button>
                );
              })}
              {!(gameState.players[0]?.shop ?? []).length && (
                <p className="text-slate-500">Shop is empty</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {gameState.phase.kind === "Recruit" && (
            <button
              type="button"
              onClick={handleEndTurn}
              className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              End Turn
            </button>
          )}
        </div>
      )}
    </main>
  );
}
