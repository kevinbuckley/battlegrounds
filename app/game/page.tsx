"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoverOverlay } from "@/components/DiscoverOverlay";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { Leaderboard } from "@/components/Leaderboard";
import { simulateCombat } from "@/game/combat";
import { applyDamageToPlayer, calcDamage } from "@/game/damage";
import { baseGoldForTurn, COST_BUY, COST_FREEZE, COST_REFRESH } from "@/game/economy";
import { getHero, HEROES } from "@/game/heroes/index";
import { MINIONS } from "@/game/minions/index";
import { SPELLS } from "@/game/spells/index";
import { beginRecruitTurn, makeInitialState, rngForTurn, step } from "@/game/state";
import type {
  CombatEvent,
  CombatResult,
  GameState,
  MinionInstance,
  SpellInstance,
} from "@/game/types";
import { makeRng } from "@/lib/rng";

// ------------------------------------->-----
// Card color helpers
// ------->-->-->-->-->-->-->-->-->-->-->-->

const TIER_COLORS: Record<number, string> = {
  1: "bg-emerald-600",
  2: "bg-blue-600",
  3: "bg-purple-600",
  4: "bg-orange-600",
  5: "bg-red-600",
  6: "bg-yellow-600",
};

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Event description helpers
// ------->-->-->-->-->-->-->-->-->-->-->-->

function describeEvent(evt: CombatEvent, nameMap: Map<string, string>): string {
  switch (evt.kind) {
    case "StartOfCombat": {
      const name = nameMap.get(evt.source) ?? "?";
      return `${name} — start of combat`;
    }
    case "Attack": {
      const attacker = nameMap.get(evt.attacker) ?? "?";
      const target = nameMap.get(evt.target) ?? "?";
      return `${attacker} attacks ${target}`;
    }
    case "Damage": {
      const target = nameMap.get(evt.target) ?? "?";
      return `${target} takes ${evt.amount} damage`;
    }
    case "DivineShield": {
      const target = nameMap.get(evt.target) ?? "?";
      return `${target} — divine shield blocks!`;
    }
    case "Death": {
      const source = nameMap.get(evt.source) ?? "?";
      return `${source} is destroyed`;
    }
    case "Summon": {
      return `${evt.card} summoned at ${evt.side} ${evt.position}`;
    }
    case "Stat": {
      const target = nameMap.get(evt.target) ?? "?";
      return `${target} — stats: ${evt.atk}/${evt.hp}`;
    }
    case "End": {
      return evt.winner === "draw" ? "Draw!" : `${evt.winner} wins`;
    }
    default:
      return "";
  }
}

function eventTypeColor(evt: CombatEvent): string {
  switch (evt.kind) {
    case "StartOfCombat":
      return "text-amber-300";
    case "Attack":
      return "text-red-400";
    case "Damage":
      return "text-orange-400";
    case "DivineShield":
      return "text-sky-300";
    case "Death":
      return "text-red-600 font-bold";
    case "Summon":
      return "text-emerald-400";
    case "Stat":
      return "text-blue-300";
    case "End":
      return "text-amber-400 text-lg font-bold";
    default:
      return "";
  }
}

function eventTypeEmoji(evt: CombatEvent): string {
  switch (evt.kind) {
    case "StartOfCombat":
      return "\u{1F525}";
    case "Attack":
      return "\u{2694}\uFE0F";
    case "Damage":
      return "\u{1F4A5}";
    case "DivineShield":
      return "\u{1F6E1}\uFE0F";
    case "Death":
      return "\u{2620}";
    case "Summon":
      return "\u{2728}";
    case "Stat":
      return "\u{1F4CB}";
    case "End":
      return "\u{1F3C6}";
    default:
      return "";
  }
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Helpers
// ------->-->-->-->-->-->-->-->-->-->-->-->

function applyCombatResult(initialState: GameState, result: CombatResult): GameState {
  const player = initialState.players[0];
  const opponent = initialState.players.find((p) => p.id !== 0 && !p.eliminated);
  if (!player || !opponent) return initialState;

  let state = initialState;

  if (result.winner === "left") {
    const dmg = calcDamage(opponent.tier, result.survivorsLeft);
    state = applyDamageToPlayer(state, opponent.id, dmg);
    state = {
      ...state,
      players: state.players.map((p) => (p.id === 0 ? { ...p, board: result.survivorsLeft } : p)),
    };
    state = {
      ...state,
      players: state.players.map((p) => (p.id === opponent.id ? { ...p, board: [] } : p)),
    };
  } else if (result.winner === "right") {
    const dmg = calcDamage(player.tier, result.survivorsRight);
    state = applyDamageToPlayer(state, player.id, dmg);
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id === opponent.id ? { ...p, board: result.survivorsRight } : p,
      ),
    };
    state = {
      ...state,
      players: state.players.map((p) => (p.id === 0 ? { ...p, board: [] } : p)),
    };
  }

  return state;
}

function rollNextRecruitTurn(prevState: GameState, turnRng: ReturnType<typeof makeRng>): GameState {
  const turn = prevState.turn + 1;
  const state = { ...prevState, turn, phase: { kind: "Recruit", turn } };
  const gold = baseGoldForTurn(turn);

  for (const p of prevState.players) {
    if (p.eliminated) continue;
    const next = {
      ...p,
      gold,
      upgradeCost:
        !p.upgradedThisTurn && p.tier < 6 ? Math.max(0, p.upgradeCost - 1) : p.upgradeCost,
      upgradedThisTurn: false,
      heroPowerUsed: false,
    };
    // Shop rolling happens inside beginRecruitTurn
  }

  return beginRecruitTurn(state as GameState, turnRng);
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Game page
// ------->-->-->-->-->-->-->-->-->-->-->-->

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [placingMinionIdx, setPlacingMinionIdx] = useState<number | null>(null);
  const [heroPowerTargetIdx, setHeroPowerTargetIdx] = useState<number | null>(null);
  const [selectedSpellIdx, setSelectedSpellIdx] = useState<number | null>(null);

  // Combat animation state
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [combatTick, setCombatTick] = useState(-1);
  const [displayingCombat, setDisplayingCombat] = useState(false);
  const [opponentHeroId, setOpponentHeroId] = useState<string>("");
  const tickRef = useRef(combatTick);
  tickRef.current = combatTick;

  // Hero damage recap state — shown briefly after combat ends, before recruit phase
  const [damageRecap, setDamageRecap] = useState<{
    damage: number;
    opponentHeroId: string;
  } | null>(null);

  // Triple merge animation state
  const [tripleAnimMinions, setTripleAnimMinions] = useState<Set<string>>(new Set());
  const [showingGolden, setShowingGolden] = useState(false);

  // Discover overlay state
  // Derived from gameState — no separate useState needed

  // Detect triple merges and trigger animation
  const prevGoldenCount = useRef(0);
  useEffect(() => {
    if (!gameState) return;
    const p = gameState.players[0];
    if (!p) return;
    const currentGoldenCount =
      p.board.filter((m) => m.golden).length + p.hand.filter((m) => m.golden).length;
    if (currentGoldenCount > prevGoldenCount.current) {
      // A golden minion was just created — trigger animation
      const goldenMinions = [...p.board.filter((m) => m.golden), ...p.hand.filter((m) => m.golden)];
      setTripleAnimMinions(new Set(goldenMinions.map((m) => m.instanceId)));
      setShowingGolden(true);
      setTimeout(() => {
        setTripleAnimMinions(new Set());
        setTimeout(() => setShowingGolden(false), 600);
      }, 800);
    }
    prevGoldenCount.current = currentGoldenCount;
  }, [gameState]);

  const playerGold = () => gameState?.players[0]?.gold ?? 0;

  useEffect(() => {
    const seed = Number(searchParams.get("seed")) || 1;
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

    const state = makeInitialState(seed);
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

  const handleHandMinionClick = useCallback(
    (handIndex: number) => {
      if (!gameState || gameState.phase.kind !== "Recruit") return;
      const player = gameState.players[0];
      if (!player) return;
      const minion = player.hand[handIndex];
      if (!minion) return;
      if (player.board.length >= 7) return;
      const boardIndex = player.board.length;
      const next = step(
        gameState,
        { kind: "PlayMinion", player: 0, handIndex, boardIndex },
        rngForTurn(gameState, "playMinion"),
      );
      setGameState(next);
      setPlacingMinionIdx(null);
      setError(null);
    },
    [gameState],
  );

  const handlePlaceToEmptySlot = useCallback(
    (boardIndex: number) => {
      if (!gameState) return;
      if (!placingMinionIdx && placingMinionIdx !== 0) return;
      if (gameState.phase.kind !== "Recruit") return;
      const player = gameState.players[0];
      if (!player) return;
      const minion = player.hand[placingMinionIdx];
      if (!minion) return;
      const next = step(
        gameState,
        { kind: "PlayMinion", player: 0, handIndex: placingMinionIdx, boardIndex },
        rngForTurn(gameState, "playMinion"),
      );
      setGameState(next);
      setPlacingMinionIdx(null);
      setError(null);
    },
    [gameState, placingMinionIdx],
  );

  const handleEndTurn = useCallback(() => {
    if (!gameState) return;
    const player = gameState.players[0];
    const opponent = gameState.players.find((p) => p.id !== 0 && !p.eliminated);

    // Snapshot before advancing state
    const combatSnapshot = { ...gameState, phase: { kind: "Recruit", turn: gameState.turn } };

    // Advance UI state immediately (new recruit turn)
    const next = step(gameState, { kind: "EndTurn", player: 0 }, rngForTurn(gameState, "endTurn"));
    setGameState(next);

    if (opponent && player && !player.eliminated) {
      const combatRng = makeRng(combatSnapshot.seed).fork(`combat:${opponent.id}`);
      const result = simulateCombat(player.board, opponent.board, combatRng);

      if (result.winner !== "draw") {
        setCombatResult(result);
        setCombatTick(-1);
        setOpponentHeroId(opponent.heroId);
        setDisplayingCombat(true);
        return;
      }
    }
  }, [gameState]);

  // Combat animation tick progression
  useEffect(() => {
    if (!displayingCombat || !combatResult) return;

    if (combatTick >= combatResult.transcript.length) {
      setDisplayingCombat(false);
      setCombatResult(null);
      setOpponentHeroId("");

      // Calculate damage taken and show recap before returning to recruit
      if (gameState) {
        const player = gameState.players[0];
        const opponent = gameState.players.find((p) => p.id !== 0 && !p.eliminated);
        if (player && opponent && combatResult.winner === "right") {
          const damage = calcDamage(player.tier, combatResult.survivorsRight);
          setDamageRecap({ damage, opponentHeroId: opponent.heroId });
          // Show recap for 2 seconds, then transition to recruit
          setTimeout(() => {
            setDamageRecap(null);
            const postCombat = applyCombatResult(gameState, combatResult);
            const { players } = gameState;
            if (players.find((p) => p.id === 0)?.eliminated ?? false) return;
            const turnRng = makeRng(postCombat.seed).fork(`turn:${postCombat.turn + 1}`);
            const next = rollNextRecruitTurn(postCombat, turnRng);
            setGameState(next);
          }, 2000);
        } else {
          // No damage recap needed (player won or draw), transition immediately
          const postCombat = applyCombatResult(gameState, combatResult);
          const { players } = gameState;
          if (players.find((p) => p.id === 0)?.eliminated ?? false) return;
          const turnRng = makeRng(postCombat.seed).fork(`turn:${postCombat.turn + 1}`);
          const next = rollNextRecruitTurn(postCombat, turnRng);
          setGameState(next);
        }
      }
    } else {
      const timer = setTimeout(() => setCombatTick((t) => t + 1), 180);
      return () => clearTimeout(timer);
    }
  }, [displayingCombat, combatTick, combatResult, gameState]);

  // Build card name lookup for event descriptions
  const nameMap = useRef<Map<string, string>>(new Map());
  if (combatResult && nameMap.current.size === 0) {
    const map = new Map<string, string>();
    const allMinions = [...combatResult.survivorsLeft, ...combatResult.survivorsRight];
    for (const m of allMinions) {
      const card = MINIONS[m.cardId];
      if (card) map.set(m.instanceId, card.name);
    }
    nameMap.current = map;
  }

  const seenEvents =
    displayingCombat && combatResult
      ? combatTick >= 0
        ? combatResult.transcript.slice(0, combatTick + 1)
        : []
      : [];

  const boardMinions = gameState?.players[0]?.board ?? [];
  const handMinions = gameState?.players[0]?.hand ?? [];

  const handleDiscoverPick = useCallback(
    (index: number) => {
      if (!gameState || !gameState.players[0]?.discoverOffer) return;
      const offer = gameState.players[0].discoverOffer.offers[index];
      if (!offer) return;

      const next = step(
        gameState,
        { kind: "PickDiscover", player: 0, index },
        rngForTurn(gameState, "discover"),
      );
      setGameState(next);
    },
    [gameState],
  );

  const handleDiscoverDismiss = useCallback(() => {
    if (!gameState) return;
    const next = step(
      gameState,
      { kind: "DismissDiscover", player: 0 },
      rngForTurn(gameState, "discover"),
    );
    setGameState(next);
  }, [gameState]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8 relative">
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-950/50 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {!gameState && !error && <p className="text-slate-400">Loading...</p>}
      {gameState && (
        <div className="flex w-full max-w-2xl flex-col gap-6">
          {/* Top bar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 shadow">
            {/* Left section — hero portrait, name, HP */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500 bg-slate-800 text-xl font-bold text-slate-100">
                  {(() => {
                    const p = gameState.players[0] ?? gameState.players.at(-1);
                    const hero = p?.heroId ? HEROES[p.heroId] : undefined;
                    return hero ? hero.name.charAt(0) : "?";
                  })()}
                </div>
                <span className="mt-1 text-[11px] text-slate-500">
                  {(() => {
                    const p = gameState.players[0] ?? gameState.players.at(-1);
                    const hero = p?.heroId ? HEROES[p.heroId] : undefined;
                    return p?.heroId && hero ? hero.name : "None";
                  })()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Health</span>
                <span className="text-2xl font-bold tracking-tight text-emerald-400">
                  {gameState.players[0]?.hp ?? 0}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-slate-400">
                  <span>{gameState.players[0]?.armor ?? 0}</span>
                  <span className="text-[10px]">armor</span>
                </span>
              </div>
            </div>

            {/* Center section — gold and tier */}
            <div className="flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Gold</span>
                <span className="text-2xl font-bold tracking-tight text-amber-400">
                  {gameState.players[0]?.gold ?? 0}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Tier</span>
                <span className="text-2xl font-bold tracking-tight text-blue-400">
                  {gameState.players[0]?.tier ?? 1}
                </span>
              </div>
            </div>

            {/* Right section — turn counter + phase */}
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">Turn</span>
              <span className="text-2xl font-bold tracking-tight text-purple-400">
                {gameState.turn}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {gameState.phase.kind === "Recruit" ? "Recruit" : "Combat"}
              </span>
            </div>
          </div>

          {/* Phase info */}
          <p className="text-center text-sm text-slate-400">
            Phase: {gameState.phase.kind} (Turn {gameState.turn})
          </p>

          {/* Hand */}
          {handMinions.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="mb-3 text-xl font-semibold text-slate-100">
                Hand ({handMinions.length}/10)
              </h2>
              <div className="flex gap-3">
                {handMinions.map((minion, idx) => {
                  const card = MINIONS[minion.cardId];
                  if (!card) return null;
                  const tierColor = TIER_COLORS[card.tier] ?? "bg-gray-600";
                  const isSelected = placingMinionIdx === idx;
                  const canPlay = gameState?.phase.kind === "Recruit" && boardMinions.length < 7;
                  return (
                    <button
                      type="button"
                      key={minion.instanceId}
                      onClick={() => canPlay && setPlacingMinionIdx(idx)}
                      disabled={!canPlay}
                      className={`flex min-w-[120px] flex-col gap-2 rounded-lg border-2 ${isSelected ? "border-amber-400 bg-amber-400/10" : "border-amber-500/50"} bg-slate-800 px-4 py-3 transition ${canPlay ? "cursor-pointer hover:bg-slate-750 active:scale-95 opacity-90" : "cursor-not-allowed opacity-50"} ${showingGolden ? "animate-pulse" : ""}`}
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
                      {gameState?.phase.kind === "Recruit" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!gameState) return;
                            const next = step(
                              gameState,
                              {
                                kind: "SellMinion",
                                player: 0,
                                handIndex: idx,
                              },
                              rngForTurn(gameState, "sell"),
                            );
                            setGameState(next);
                            setError(null);
                          }}
                          className="mt-1 rounded bg-red-500/80 px-2 py-0.5 text-[10px] font-semibold text-white transition hover:bg-red-400"
                        >
                          Sell (+{playerGold()})g
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Board */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">
              Board ({boardMinions.length}/7)
            </h2>
            <div className="flex gap-3">
              {Array.from({ length: 7 }, (_, idx) => {
                const minion = boardMinions[idx];
                if (minion) {
                  const card = MINIONS[minion.cardId];
                  if (!card) return null;
                  const tierColor = TIER_COLORS[card.tier] ?? "bg-gray-600";
                  const isDragging = dragIndex === idx;
                  const isHpTarget = heroPowerTargetIdx === idx;
                  const playerForHp = gameState?.players[0];
                  const currentHero = playerForHp?.heroId ? HEROES[playerForHp.heroId] : undefined;
                  const needsHpTarget =
                    currentHero?.power.kind === "active" &&
                    (currentHero.id === "george_the_fallen" ||
                      currentHero.id === "scabbs_cutterbutter" ||
                      currentHero.id === "sir_finley") &&
                    !playerForHp?.heroPowerUsed;
                  return (
                    <div
                      key={minion.instanceId}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragEnd={() => setDragIndex(null)}
                      onClick={() => {
                        if (needsHpTarget) {
                          setHeroPowerTargetIdx(idx);
                          setError(null);
                        }
                        // Spell targeting: if a spell is selected, play it with this board index as target
                        if (selectedSpellIdx !== null && gameState) {
                          const player = gameState.players[0];
                          if (!player) return;
                          if (idx >= player.board.length) {
                            setError("Invalid board target");
                            return;
                          }
                          try {
                            const next = step(
                              gameState,
                              {
                                kind: "PlaySpell",
                                player: 0,
                                spellIndex: selectedSpellIdx,
                                targetIndex: idx,
                              },
                              rngForTurn(gameState, "playSpell"),
                            );
                            setGameState(next);
                            setSelectedSpellIdx(null);
                            setError(null);
                          } catch {
                            setError("Could not play spell");
                          }
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragIndex !== null && dragIndex !== idx && gameState) {
                          const next = step(
                            gameState,
                            { kind: "ReorderBoard", player: 0, from: dragIndex, to: idx },
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
                      } ${isHpTarget ? "border-sky-400 bg-sky-400/10 ring-2 ring-sky-400/30" : ""} ${
                        selectedSpellIdx !== null
                          ? "cursor-crosshair border-amber-400 bg-amber-400/5 hover:bg-amber-400/15"
                          : ""
                      } ${showingGolden ? "animate-pulse" : ""}`}
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
                      {gameState?.phase.kind === "Recruit" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!gameState) return;
                            const player = gameState.players[0];
                            if (!player) return;
                            const next = step(
                              gameState,
                              { kind: "SellMinion", player: 0, boardIndex: idx },
                              rngForTurn(gameState, "sell"),
                            );
                            setGameState(next);
                            setError(null);
                          }}
                          className="mt-1 rounded bg-red-500/80 px-2 py-0.5 text-[10px] font-semibold text-white transition hover:bg-red-400"
                        >
                          Sell (+{playerGold()})g
                        </button>
                      )}
                    </div>
                  );
                } else {
                  const isPlacing = placingMinionIdx !== null;
                  return (
                    <button
                      type="button"
                      key={`empty-slot-${idx}`}
                      onClick={() => isPlacing && handlePlaceToEmptySlot(idx)}
                      disabled={!isPlacing}
                      className={`flex min-w-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed ${isPlacing ? "border-amber-400 bg-amber-400/10 cursor-pointer" : "border-slate-700 bg-slate-900/50 cursor-not-allowed"} px-4 py-3 transition`}
                    >
                      <span
                        className={`text-2xl ${isPlacing ? "text-amber-400" : "text-slate-700"}`}
                      >
                        +
                      </span>
                    </button>
                  );
                }
              })}
            </div>
          </div>

          {/* Spells */}
          {(() => {
            const player = gameState?.players[0];
            const spells = player?.spells ?? [];
            if (spells.length === 0) return null;
            return (
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h2 className="mb-3 text-xl font-semibold text-slate-100">
                  Spells ({spells.length})
                </h2>
                <div className="flex gap-3">
                  {spells.map((spell, idx) => {
                    const card = SPELLS[spell.cardId];
                    if (!card) return null;
                    const canPlay = gameState?.phase.kind === "Recruit";
                    const isSelected = selectedSpellIdx === idx;
                    return (
                      <button
                        key={spell.instanceId}
                        type="button"
                        onClick={() => {
                          if (!gameState || gameState.phase.kind !== "Recruit") return;
                          const player = gameState.players[0];
                          if (!player || player.board.length === 0) {
                            setError("No valid targets on board");
                            return;
                          }
                          setSelectedSpellIdx(isSelected ? null : idx);
                          setError(null);
                        }}
                        disabled={!canPlay}
                        className={`flex min-w-[120px] flex-col gap-2 rounded-lg border-2 ${isSelected ? "border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/30" : canPlay ? "border-amber-500/50 cursor-pointer hover:border-amber-400 hover:bg-slate-750 active:scale-95" : "border-slate-600 cursor-not-allowed opacity-50"} bg-slate-800 px-4 py-3 transition`}
                      >
                        <span className="text-[11px] font-medium leading-tight text-slate-300">
                          {card.name}
                        </span>
                        <span className="text-xs text-slate-400">{card.description}</span>
                        <div className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-400">
                          <span>⧉</span>
                          <span>{card.cost}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Tavern / Shop */}
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-100">Tavern</h2>
            <div className="flex gap-3">
              {(gameState.players[0]?.shop ?? []).map((shopItem, idx) => {
                const minionCard = MINIONS[shopItem.cardId];
                const spellCard = SPELLS[shopItem.cardId];
                if (minionCard) {
                  const canBuy =
                    (gameState.players[0]?.gold ?? 0) >= COST_BUY &&
                    gameState.phase.kind === "Recruit";
                  const handFull = handMinions.length >= 10;
                  const tierColor = TIER_COLORS[minionCard.tier] ?? "bg-gray-600";
                  return (
                    <button
                      key={shopItem.instanceId}
                      type="button"
                      onClick={() => handleBuyMinion(idx)}
                      disabled={!canBuy || handFull}
                      className={`flex min-w-[120px] flex-col gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 transition ${
                        canBuy && !handFull
                          ? "cursor-pointer hover:border-amber-400 hover:bg-slate-750 active:scale-95"
                          : "cursor-not-allowed opacity-50"
                      } ${shopItem.golden ? "border-amber-400 ring-2 ring-amber-400/30" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium text-white ${tierColor}`}
                        >
                          T{minionCard.tier}
                        </span>
                        <span className="text-xs text-slate-400">
                          {minionCard.tribes.join("/")}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium leading-tight text-slate-300">
                        {minionCard.name}
                      </span>
                      <div className="flex gap-3 text-sm font-bold">
                        <span className="flex items-center gap-1 text-red-400">
                          {minionCard.baseAtk}
                          <span>⚔</span>
                        </span>
                        <span className="flex items-center gap-1 text-orange-400">
                          {minionCard.baseHp}
                          <span>❤</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-400">
                        <span>⧉</span>
                        <span>{COST_BUY}</span>
                      </div>
                      {minionCard.baseKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(minionCard.baseKeywords).map((kw) => (
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
                }
                if (spellCard) {
                  const canBuy =
                    (gameState.players[0]?.gold ?? 0) >= spellCard.cost &&
                    gameState.phase.kind === "Recruit";
                  return (
                    <button
                      key={shopItem.instanceId}
                      type="button"
                      onClick={() => {
                        if (!gameState) return;
                        try {
                          const next = step(
                            gameState,
                            { kind: "BuySpell", player: 0, shopIndex: idx },
                            rngForTurn(gameState, "buySpell"),
                          );
                          setGameState(next);
                          setError(null);
                        } catch {
                          setError("Could not buy spell");
                        }
                      }}
                      disabled={!canBuy}
                      className={`flex min-w-[120px] flex-col gap-2 rounded-lg border-2 ${
                        canBuy
                          ? "border-purple-500/50 cursor-pointer hover:border-purple-400 hover:bg-slate-750 active:scale-95"
                          : "border-slate-600 cursor-not-allowed opacity-50"
                      } bg-slate-800 px-4 py-3 transition`}
                    >
                      <span className="text-[11px] font-medium leading-tight text-slate-300">
                        {spellCard.name}
                      </span>
                      <span className="text-xs text-slate-400">{spellCard.description}</span>
                      <div className="flex items-center justify-center gap-1 text-xs font-semibold text-purple-400">
                        <span>⧉</span>
                        <span>{spellCard.cost}</span>
                      </div>
                    </button>
                  );
                }
                return null;
              })}
              {!(gameState.players[0]?.shop ?? []).length && (
                <p className="text-slate-500">Shop is empty</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {gameState.phase.kind === "Recruit" && (
            <div className="flex gap-3">
              {(() => {
                const player = gameState.players[0];
                const hero = player?.heroId ? HEROES[player.heroId] : undefined;
                const hasActivePower = hero?.power.kind === "active";
                const powerCost = hasActivePower
                  ? (hero!.power as { kind: "active"; cost: number; usesPerTurn: number }).cost
                  : 999;
                const canUsePower =
                  hasActivePower && player && player.gold >= powerCost && !player.heroPowerUsed;

                if (hasActivePower) {
                  const needsTarget =
                    hero?.id === "george_the_fallen" ||
                    hero?.id === "scabbs_cutterbutter" ||
                    hero?.id === "sir_finley";
                  const isTargeted = needsTarget && heroPowerTargetIdx !== null;
                  const powerEnabled = canUsePower && (!needsTarget || isTargeted);

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (!gameState || !player) return;
                          const next = step(
                            gameState,
                            { kind: "HeroPower", player: 0, target: heroPowerTargetIdx },
                            rngForTurn(gameState, "heroPower"),
                          );
                          setGameState(next);
                          setHeroPowerTargetIdx(null);
                          setError(null);
                        }}
                        disabled={!powerEnabled}
                        className={`rounded-lg px-6 py-3 font-semibold transition ${
                          powerEnabled
                            ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                            : "cursor-not-allowed bg-slate-700 text-slate-500"
                        }`}
                      >
                        {hero?.name.split(" ")[0]} Power ({powerCost}g)
                      </button>
                      {needsTarget && (
                        <span className="text-xs text-slate-400">
                          {isTargeted
                            ? `Target: board[${heroPowerTargetIdx}]`
                            : "Click a board minion, then use power"}
                        </span>
                      )}
                      {heroPowerTargetIdx !== null && (
                        <button
                          type="button"
                          onClick={() => setHeroPowerTargetIdx(null)}
                          className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-600"
                        >
                          Clear Target
                        </button>
                      )}
                    </>
                  );
                }
                return null;
              })()}
              {selectedSpellIdx !== null && (
                <>
                  <span className="text-xs text-amber-400">
                    Select a board minion to target, or cancel
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSpellIdx(null)}
                    className="rounded bg-amber-500/80 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleEndTurn}
                className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                End Turn
              </button>
            </div>
          )}

          {/* Shop actions */}
          {gameState.phase.kind === "Recruit" && (
            <div className="flex gap-3">
              {(() => {
                const player = gameState.players[0];
                if (!player) return null;

                const canUpgrade =
                  player.tier < 6 && player.gold >= player.upgradeCost && !player.upgradedThisTurn;
                const canRefresh = player.gold >= COST_REFRESH;
                const canFreeze = player.gold >= COST_FREEZE;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!gameState) return;
                        try {
                          const next = step(
                            gameState,
                            { kind: "UpgradeTier", player: 0 },
                            rngForTurn(gameState, "upgrade"),
                          );
                          setGameState(next);
                          setError(null);
                        } catch {
                          setError("Could not upgrade tier");
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`rounded-lg px-4 py-3 font-semibold transition ${
                        canUpgrade
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : "cursor-not-allowed bg-slate-700 text-slate-500"
                      }`}
                    >
                      Upgrade (T{player.tier + 1}) — {player.upgradeCost}g
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!gameState) return;
                        try {
                          const next = step(
                            gameState,
                            { kind: "RefreshShop", player: 0 },
                            rngForTurn(gameState, "refresh"),
                          );
                          setGameState(next);
                          setError(null);
                        } catch {
                          setError("Could not refresh shop");
                        }
                      }}
                      disabled={!canRefresh}
                      className={`rounded-lg px-4 py-3 font-semibold transition ${
                        canRefresh
                          ? "bg-blue-500 text-slate-950 hover:bg-blue-400"
                          : "cursor-not-allowed bg-slate-700 text-slate-500"
                      }`}
                    >
                      Refresh — {COST_REFRESH}g
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!gameState) return;
                        try {
                          const next = step(
                            gameState,
                            { kind: "FreezeShop", player: 0 },
                            rngForTurn(gameState, "freeze"),
                          );
                          setGameState(next);
                          setError(null);
                        } catch {
                          setError("Could not freeze shop");
                        }
                      }}
                      disabled={!canFreeze}
                      className={`rounded-lg px-4 py-3 font-semibold transition ${
                        canFreeze
                          ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                          : "cursor-not-allowed bg-slate-700 text-slate-500"
                      }`}
                    >
                      {player.shopFrozen ? "Unfreeze Shop" : "Freeze Shop"}
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Combat animation overlay */}
      {displayingCombat && combatResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
          <div className="flex h-[85vh] w-[95vw] max-w-4xl flex-col rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl">
            {/* Progress bar */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-150"
                style={{
                  width: `${
                    combatResult.transcript.length > 0
                      ? Math.min(
                          ((tickRef.current + 1) / combatResult.transcript.length) * 100,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Header */}
            <h2 className="mb-2 text-center text-2xl font-bold text-amber-400">
              {eventTypeEmoji({ kind: "End", winner: "left" })} Combat Round
            </h2>

            {/* Pairing banner */}
            {opponentHeroId &&
              (() => {
                const hero = HEROES[opponentHeroId];
                if (!hero) return null;
                return (
                  <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center">
                    <span className="text-sm text-amber-300">
                      You&apos;re fighting:{" "}
                      <span className="font-bold text-amber-400">{hero.name}</span>
                    </span>
                  </div>
                );
              })()}

            {/* Event log */}
            <div className="flex-1 overflow-y-auto pb-4">
              <div className="flex flex-col gap-2">
                {seenEvents.length === 0 && (
                  <p className="text-center text-slate-500">Preparing...</p>
                )}
                {seenEvents.map((evt, i) => (
                  <div
                    key={`${evt.kind}-${i}`}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                      i === seenEvents.length - 1
                        ? "border-amber-400/40 bg-amber-400/5"
                        : "border-slate-800 bg-slate-900/50"
                    }`}
                    style={{
                      animation: i === seenEvents.length - 1 ? "flash 0.3s ease-out" : "none",
                    }}
                  >
                    <span>{eventTypeEmoji(evt)}</span>
                    <span className={`text-sm ${eventTypeColor(evt)}`}>
                      {describeEvent(evt, nameMap.current)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            {seenEvents.length > 0 && (
              <p className="mt-2 text-center text-xs text-slate-500">
                {tickRef.current + 1} / {combatResult.transcript.length} events
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flash animation keyframes */}
      <style>
        {`
          @keyframes flash {
            0% { background-color: rgba(251, 191, 36, 0.3); }
            100% { background-color: rgba(251, 191, 36, 0.05); }
          }
        `}
      </style>

      {/* Damage recap banner — shown briefly after combat ends */}
      {damageRecap &&
        (() => {
          const hero = HEROES[damageRecap.opponentHeroId];
          return (
            <div className="fixed inset-x-0 top-24 z-40 flex justify-center pointer-events-none">
              <div className="rounded-xl border border-red-500/50 bg-red-950/80 px-6 py-3 shadow-lg shadow-red-900/30">
                <span className="text-sm text-red-300">
                  You took <span className="font-bold text-red-400">{damageRecap.damage}</span>{" "}
                  damage from{" "}
                  <span className="font-bold text-red-400">{hero?.name ?? "unknown"}</span>
                </span>
              </div>
            </div>
          );
        })()}

      {/* Discover overlay */}
      {gameState?.players[0]?.discoverOffer && (
        <DiscoverOverlay
          offers={gameState.players[0].discoverOffer.offers}
          title={gameState.players[0].discoverOffer.title ?? "Triple! Discover a minion"}
          onPick={handleDiscoverPick}
          onDismiss={handleDiscoverDismiss}
        />
      )}

      {/* Leaderboard */}
      {gameState && <Leaderboard state={gameState} heroId={gameState.players[0]?.heroId ?? ""} />}

      {/* Game over overlay */}
      {gameState?.phase.kind === "GameOver" && <GameOverOverlay state={gameState} />}
    </main>
  );
}
