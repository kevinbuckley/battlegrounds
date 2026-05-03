"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscoverOverlay } from "@/components/DiscoverOverlay";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { simulateCombat } from "@/game/combat";
import { calcDamage } from "@/game/damage";
import { COST_BUY, COST_FREEZE, COST_REFRESH } from "@/game/economy";
import { getHero, HEROES } from "@/game/heroes/index";
import { MINIONS } from "@/game/minions/index";
import { SPELLS } from "@/game/spells/index";
import { makeInitialState, rngForTurn, step } from "@/game/state";
import type { CombatEvent, CombatResult, GameState, MinionInstance } from "@/game/types";
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
      return "\u{2694}️";
    case "Damage":
      return "\u{1F4A5}";
    case "DivineShield":
      return "\u{1F6E1}️";
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
// Minion card — shared between board and hand
// ------->-->-->-->-->-->-->-->-->-->-->-->

interface MinionCardProps {
  minion: MinionInstance;
  isSelected?: boolean;
  isDragging?: boolean;
  isHpTarget?: boolean;
  isSpellTarget?: boolean;
  showSell?: boolean;
  sellValue?: number;
  sellConfirming?: boolean;
  canPlay?: boolean;
  onClick?: () => void;
  onSell?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  showingGolden?: boolean;
  draggable?: boolean;
  isAttacking?: boolean;
  isBeingAttacked?: boolean;
}

function MinionCard({
  minion,
  isSelected,
  isDragging,
  isHpTarget,
  isSpellTarget,
  showSell,
  sellValue,
  sellConfirming,
  canPlay,
  onClick,
  onSell,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  showingGolden,
  draggable: isDraggable,
  isAttacking,
  isBeingAttacked,
}: MinionCardProps) {
  const card = MINIONS[minion.cardId];
  if (!card) return null;
  const tierColor = TIER_COLORS[card.tier] ?? "bg-gray-600";

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`flex w-[110px] flex-shrink-0 flex-col gap-1.5 rounded-lg border-2 bg-slate-800 px-3 py-2 transition select-none
        ${isDragging ? "opacity-40" : "opacity-100"}
        ${isHpTarget ? "border-sky-400 bg-sky-400/10 ring-2 ring-sky-400/30" : ""}
        ${isSpellTarget ? "cursor-crosshair border-amber-400 bg-amber-400/5 hover:bg-amber-400/15" : ""}
        ${isSelected ? "border-amber-400 bg-amber-400/10" : !isHpTarget && !isSpellTarget ? "border-blue-500/50" : ""}
        ${canPlay === false ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-500"}
        ${showingGolden ? "animate-pulse" : ""}
        ${minion.golden ? "ring-2 ring-amber-400/50" : ""}
        ${isAttacking ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/40 scale-105" : ""}
        ${isBeingAttacked ? "border-orange-500 bg-orange-500/15 ring-2 ring-orange-500/40" : ""}
      `}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium text-white ${tierColor}`}
        >
          T{card.tier}
        </span>
        {card.tribes.length > 0 && (
          <span className="text-[9px] text-slate-500 truncate">{card.tribes.join("/")}</span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-tight text-slate-300 line-clamp-2">
        {card.name}
        {minion.golden && <span className="ml-0.5 text-amber-400">*</span>}
      </span>
      <div className="flex gap-2 text-xs font-bold">
        <span className="flex items-center gap-0.5 text-red-400">
          {minion.atk}
          <span className="text-[9px]">atk</span>
        </span>
        <span className="flex items-center gap-0.5 text-orange-400">
          {minion.hp}
          <span className="text-[9px]">hp</span>
        </span>
      </div>
      {minion.keywords.size > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {Array.from(minion.keywords).map((kw) => (
            <span key={kw} className="rounded bg-slate-700 px-1 py-0.5 text-[8px] text-slate-300">
              {kw}
            </span>
          ))}
        </div>
      )}
      {showSell && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSell?.();
          }}
          className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white transition ${
            sellConfirming
              ? "bg-amber-500 text-slate-950 animate-pulse"
              : "bg-red-500/80 hover:bg-red-400"
          }`}
        >
          {sellConfirming ? "Confirm?" : `Sell +${sellValue ?? 1}g`}
        </button>
      )}
    </div>
  );
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Opponent board row
// ------->-->-->-->-->-->-->-->-->-->-->-->

function OpponentBoardRow({
  gameState,
  combatHighlightIds,
  displayingCombat,
}: {
  gameState: GameState;
  combatHighlightIds: { attackerId: string; targetId: string };
  displayingCombat: boolean;
}) {
  // Find opponent from the most recent pairing involving player 0
  let opponentId: number | null = null;
  for (let i = gameState.pairingsHistory.length - 1; i >= 0; i--) {
    const pairing = gameState.pairingsHistory[i]!;
    if (pairing[0] === 0) {
      opponentId = pairing[1];
      break;
    }
    if (pairing[1] === 0) {
      opponentId = pairing[0];
      break;
    }
  }

  const opponent =
    opponentId !== null ? gameState.players.find((p) => p.id === opponentId) : undefined;
  const opponentHero = opponent?.heroId ? HEROES[opponent.heroId] : undefined;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">Next Opponent</span>
        {opponentHero && (
          <span className="text-[11px] font-semibold text-slate-300">{opponentHero.name}</span>
        )}
        {opponent && <span className="text-[11px] text-emerald-400 ml-auto">{opponent.hp} HP</span>}
      </div>
      <div className="flex gap-2 min-h-[90px] items-center">
        {opponent && opponent.board.length > 0
          ? Array.from({ length: 7 }, (_, idx) => {
              const minion = opponent.board[idx];
              if (minion) {
                const card = MINIONS[minion.cardId];
                if (!card) return null;
                const tierColor = TIER_COLORS[card.tier] ?? "bg-gray-600";
                const isAttacking =
                  displayingCombat && minion.instanceId === combatHighlightIds.attackerId;
                const isBeingAttacked =
                  displayingCombat && minion.instanceId === combatHighlightIds.targetId;
                const highlightClass = isAttacking
                  ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/40 scale-105"
                  : isBeingAttacked
                    ? "border-orange-500 bg-orange-500/15 ring-2 ring-orange-500/40"
                    : "";
                return (
                  <div
                    key={minion.instanceId}
                    className={`flex w-[110px] flex-shrink-0 flex-col gap-1.5 rounded-lg border-2 ${minion.golden ? "ring-2 ring-amber-400/50" : ""} bg-slate-800/70 px-3 py-2 ${highlightClass || "border-red-900/50"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium text-white ${tierColor}`}
                      >
                        T{card.tier}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium leading-tight text-slate-400">
                      {card.name}
                      {minion.golden && <span className="ml-0.5 text-amber-400">*</span>}
                    </span>
                    <div className="flex gap-2 text-xs font-bold">
                      <span className="text-red-400">{minion.atk}</span>
                      <span className="text-orange-400">{minion.hp}</span>
                    </div>
                    {minion.keywords.size > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {Array.from(minion.keywords).map((kw) => (
                          <span
                            key={kw}
                            className="rounded bg-slate-700 px-1 py-0.5 text-[8px] text-slate-300"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={`opp-empty-${idx}`}
                  className="flex w-[110px] flex-shrink-0 h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-slate-800/60"
                />
              );
            })
          : Array.from({ length: 7 }, (_, idx) => (
              <div
                key={`opp-empty-${idx}`}
                className="flex w-[110px] flex-shrink-0 h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-slate-800/40"
              />
            ))}
      </div>
    </div>
  );
}

// ------->-->-->-->-->-->-->-->-->-->-->-->
// Leaderboard sidebar
// ------->-->-->-->-->-->-->-->-->-->-->-->

function LeaderboardSidebar({ state, heroId }: { state: GameState; heroId: string }) {
  const players = state.players;
  const playerId = players.findIndex((p) => p.heroId === heroId);

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

  let currentRank: number | null = null;
  for (let i = 0; i < ranked.length; i++) {
    if (ranked[i]!.id === playerId) {
      currentRank = i + 1;
      break;
    }
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      <h2 className="mb-1 text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-1">
        Standings
      </h2>
      {ranked.map((p, rankIdx) => {
        const isCurrentPlayer = p.id === playerId;
        const hero = HEROES[p.heroId];
        const heroName = hero ? hero.name : p.heroId ? p.heroId : "???";
        const rank = p.placement ?? (isCurrentPlayer ? currentRank : rankIdx + 1);

        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
              isCurrentPlayer
                ? "border border-amber-500/50 bg-amber-500/5"
                : p.eliminated
                  ? "border border-slate-800 bg-slate-900/50 opacity-40"
                  : "border border-slate-700/50 bg-slate-800/40"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCurrentPlayer
                  ? "bg-amber-500 text-slate-950"
                  : p.eliminated
                    ? "bg-slate-800 text-slate-600"
                    : "bg-slate-700 text-slate-400"
              }`}
            >
              {rank ?? "?"}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className={`text-[11px] font-medium truncate ${
                  isCurrentPlayer
                    ? "text-slate-200"
                    : p.eliminated
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {heroName}
              </span>
              {!p.eliminated ? (
                <span className="text-[10px] text-emerald-400">
                  {p.hp} HP{p.armor > 0 ? ` +${p.armor}A` : ""}
                </span>
              ) : (
                <span className="text-[10px] text-red-500">Eliminated</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
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

  // Tier-up flash animation
  const prevTier = useRef<number>(1);
  const [tierFlashKey, setTierFlashKey] = useState(0);

  // Sell confirmation state
  const [sellConfirmIdx, setSellConfirmIdx] = useState<number | null>(null);
  const [sellConfirmType, setSellConfirmType] = useState<"board" | "hand" | null>(null);
  const sellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear sell confirmation when phase changes
  useEffect(() => {
    if (gameState?.phase.kind !== "Recruit") {
      setSellConfirmIdx(null);
      setSellConfirmType(null);
      if (sellTimerRef.current) {
        clearTimeout(sellTimerRef.current);
        sellTimerRef.current = null;
      }
    }
  }, [gameState?.phase.kind]);

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

  // Detect tier-up and trigger flash animation
  useEffect(() => {
    if (!gameState) return;
    const p = gameState.players[0];
    if (!p) return;
    if (p.tier > prevTier.current) {
      setTierFlashKey((k) => k + 1);
      prevTier.current = p.tier;
    }
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
      if (placingMinionIdx === null) return;
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
    // Find the actual opponent from the most recent pairing involving player 0,
    // matching real Battlegrounds where you fight a specific opponent each round.
    let opponentId: number | null = null;
    for (let i = gameState.pairingsHistory.length - 1; i >= 0; i--) {
      const pairing = gameState.pairingsHistory[i]!;
      if (pairing[0] === 0) {
        opponentId = pairing[1];
        break;
      }
      if (pairing[1] === 0) {
        opponentId = pairing[0];
        break;
      }
    }
    const opponent =
      opponentId !== null ? gameState.players.find((p) => p.id === opponentId) : undefined;

    // Snapshot boards before advancing state — step(EndTurn) resolves combat
    // internally and clears the boards, so we need the pre-combat boards
    // to feed the animation.
    const preCombatPlayerBoard = player?.board.filter((m) => m.hp > 0) ?? [];
    const preCombatOpponentBoard = opponent?.board.filter((m) => m.hp > 0) ?? [];

    // Advance state (resolves combat internally, clears boards, transitions to Recruit)
    const next = step(gameState, { kind: "EndTurn", player: 0 }, rngForTurn(gameState, "endTurn"));
    setGameState(next);

    // Compute combat result from the pre-combat snapshot for the animation
    if (
      opponent &&
      player &&
      !player.eliminated &&
      preCombatPlayerBoard.length > 0 &&
      preCombatOpponentBoard.length > 0
    ) {
      const combatRng = makeRng(gameState.seed).fork(`turn:${gameState.turn - 1}:endTurn`);
      const result = simulateCombat(preCombatPlayerBoard, preCombatOpponentBoard, combatRng);

      if (result.winner !== "draw") {
        setCombatResult(result);
        setCombatTick(-1);
        setOpponentHeroId(opponent.heroId);
        setDisplayingCombat(true);
        return;
      }
    }

    // Handle one-sided combat: show a brief "no combat" animation when one side
    // has no minions but the other does (real Battlegrounds still shows this).
    if (opponent && player && !player.eliminated) {
      const playerWon = preCombatPlayerBoard.length > 0 && preCombatOpponentBoard.length === 0;
      const opponentWon = preCombatOpponentBoard.length > 0 && preCombatPlayerBoard.length === 0;
      if (playerWon || opponentWon) {
        const combatRng = makeRng(gameState.seed).fork(`turn:${gameState.turn - 1}:endTurn`);
        const result = simulateCombat(
          playerWon ? preCombatPlayerBoard : [],
          playerWon ? [] : preCombatOpponentBoard,
          combatRng,
        );
        if (result.winner !== "draw") {
          setCombatResult(result);
          setCombatTick(-1);
          setOpponentHeroId(opponent.heroId);
          setDisplayingCombat(true);
          return;
        }
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

      // Show damage recap if player lost, then let the state from step(EndTurn)
      // (already in Recruit phase) be displayed — no need to re-apply combat.
      // Use opponentHeroId from the pre-step snapshot so the recap always shows
      // the correct opponent name even if that player was eliminated in combat.
      if (gameState && opponentHeroId) {
        const player = gameState.players[0];
        if (player && combatResult.winner === "right") {
          const damage = calcDamage(player.tier, combatResult.survivorsRight);
          setDamageRecap({ damage, opponentHeroId });
          setTimeout(() => setDamageRecap(null), 3000);
        }
      }
    } else {
      const timer = setTimeout(() => setCombatTick((t) => t + 1), 180);
      return () => clearTimeout(timer);
    }
  }, [displayingCombat, combatTick, combatResult, gameState, opponentHeroId]);

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

  // Extract the latest Attack event's instanceIds for highlighting during combat
  const combatHighlightIds = (() => {
    if (!displayingCombat || !combatResult) return { attackerId: "", targetId: "" };
    for (let i = seenEvents.length - 1; i >= 0; i--) {
      const evt = seenEvents[i];
      if (evt && evt.kind === "Attack") {
        return { attackerId: evt.attacker, targetId: evt.target };
      }
    }
    return { attackerId: "", targetId: "" };
  })();

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
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Flash animation keyframes */}
      <style>
        {`
          @keyframes flash {
            0% { background-color: rgba(251, 191, 36, 0.3); }
            100% { background-color: rgba(251, 191, 36, 0.05); }
          }
          @keyframes tierFlash {
            0% { background-color: rgba(96, 165, 250, 0.4); transform: scale(1.15); }
            100% { background-color: rgba(96, 165, 250, 0.05); transform: scale(1); }
          }
        `}
      </style>

      {!gameState && !error && (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-red-500 bg-red-950/90 px-4 py-2 text-sm text-red-400 shadow-lg">
          {error}
        </div>
      )}

      {gameState && (
        <div className="flex h-full w-full min-w-[1280px]">
          {/* ---- LEFT SIDEBAR: Leaderboard ---- */}
          <aside className="flex w-[180px] flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900/80 p-3 overflow-y-auto">
            <LeaderboardSidebar state={gameState} heroId={gameState.players[0]?.heroId ?? ""} />
          </aside>

          {/* ---- CENTER COLUMN ---- */}
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3 gap-3 min-w-0">
            {/* Opponent board row */}
            <OpponentBoardRow
              gameState={gameState}
              combatHighlightIds={combatHighlightIds}
              displayingCombat={displayingCombat}
            />

            {/* Divider with turn/phase info */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/60" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                Turn {gameState.turn} — {gameState.phase.kind}
              </span>
              <div className="h-px flex-1 bg-slate-700/60" />
            </div>

            {/* Player board */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  Your Board
                </span>
                <span className="text-[11px] text-slate-500">({boardMinions.length}/7)</span>
              </div>
              <div className="flex gap-2 min-h-[100px] items-start">
                {Array.from({ length: 7 }, (_, idx) => {
                  const minion = boardMinions[idx];
                  if (minion) {
                    const isDragging = dragIndex === idx;
                    const isHpTarget = heroPowerTargetIdx === idx;
                    const playerForHp = gameState?.players[0];
                    const currentHero = playerForHp?.heroId
                      ? HEROES[playerForHp.heroId]
                      : undefined;
                    const needsHpTarget =
                      currentHero?.power.kind === "active" &&
                      (currentHero.id === "george_the_fallen" ||
                        currentHero.id === "scabbs_cutterbutter" ||
                        currentHero.id === "sir_finley") &&
                      !playerForHp?.heroPowerUsed;
                    return (
                      <MinionCard
                        key={minion.instanceId}
                        minion={minion}
                        isDragging={isDragging}
                        isHpTarget={isHpTarget}
                        isSpellTarget={selectedSpellIdx !== null}
                        showSell={gameState?.phase.kind === "Recruit"}
                        sellValue={minion.golden ? 2 : 1}
                        sellConfirming={sellConfirmIdx === idx && sellConfirmType === "board"}
                        draggable
                        showingGolden={showingGolden}
                        onClick={() => {
                          if (needsHpTarget) {
                            setHeroPowerTargetIdx(idx);
                            setError(null);
                          }
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
                        onSell={() => {
                          if (sellConfirmIdx === idx && sellConfirmType === "board") {
                            // Second click — actually sell
                            if (!gameState) return;
                            const player = gameState.players[0];
                            if (!player) return;
                            const next = step(
                              gameState,
                              { kind: "SellMinion", player: 0, boardIndex: idx },
                              rngForTurn(gameState, "sell"),
                            );
                            setGameState(next);
                            setSellConfirmIdx(null);
                            setSellConfirmType(null);
                            if (sellTimerRef.current) {
                              clearTimeout(sellTimerRef.current);
                              sellTimerRef.current = null;
                            }
                            setError(null);
                          } else {
                            // First click — show confirmation
                            if (sellTimerRef.current) {
                              clearTimeout(sellTimerRef.current);
                              sellTimerRef.current = null;
                            }
                            setSellConfirmIdx(idx);
                            setSellConfirmType("board");
                            sellTimerRef.current = setTimeout(() => {
                              setSellConfirmIdx(null);
                              setSellConfirmType(null);
                              sellTimerRef.current = null;
                            }, 1500);
                          }
                        }}
                        onDragStart={() => setDragIndex(idx)}
                        onDragEnd={() => setDragIndex(null)}
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
                        isAttacking={
                          displayingCombat && minion.instanceId === combatHighlightIds.attackerId
                        }
                        isBeingAttacked={
                          displayingCombat && minion.instanceId === combatHighlightIds.targetId
                        }
                      />
                    );
                  } else {
                    const isPlacing = placingMinionIdx !== null;
                    return (
                      <button
                        type="button"
                        key={`empty-slot-${idx}`}
                        onClick={() => isPlacing && handlePlaceToEmptySlot(idx)}
                        disabled={!isPlacing}
                        className={`flex w-[110px] flex-shrink-0 h-[100px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed ${isPlacing ? "border-amber-400 bg-amber-400/10 cursor-pointer" : "border-slate-700 bg-slate-900/50 cursor-not-allowed"} px-4 py-3 transition`}
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

            {/* Hand row (moved above Tavern) */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Hand</span>
                <span className="text-[11px] text-slate-500">({handMinions.length}/10)</span>
              </div>
              <div className="flex gap-2 flex-wrap min-h-[80px]">
                {handMinions.length === 0 && (
                  <p className="text-slate-500 text-sm self-center">Hand is empty</p>
                )}
                {handMinions.map((minion, idx) => {
                  const card = MINIONS[minion.cardId];
                  if (!card) return null;
                  const isSelected = placingMinionIdx === idx;
                  const canPlay = gameState?.phase.kind === "Recruit" && boardMinions.length < 7;
                  return (
                    <MinionCard
                      key={minion.instanceId}
                      minion={minion}
                      isSelected={isSelected}
                      canPlay={canPlay || isSelected}
                      showSell={gameState?.phase.kind === "Recruit"}
                      sellValue={minion.golden ? 2 : 1}
                      sellConfirming={sellConfirmIdx === idx && sellConfirmType === "hand"}
                      showingGolden={showingGolden}
                      onClick={() => {
                        if (isSelected) {
                          setPlacingMinionIdx(null);
                        } else if (canPlay) {
                          setPlacingMinionIdx(idx);
                        } else {
                          setError("Board is full");
                        }
                      }}
                      onSell={() => {
                        if (sellConfirmIdx === idx && sellConfirmType === "hand") {
                          // Second click — actually sell
                          if (!gameState) return;
                          const next = step(
                            gameState,
                            { kind: "SellMinion", player: 0, handIndex: idx },
                            rngForTurn(gameState, "sell"),
                          );
                          setGameState(next);
                          setSellConfirmIdx(null);
                          setSellConfirmType(null);
                          if (sellTimerRef.current) {
                            clearTimeout(sellTimerRef.current);
                            sellTimerRef.current = null;
                          }
                          setError(null);
                        } else {
                          // First click — show confirmation
                          if (sellTimerRef.current) {
                            clearTimeout(sellTimerRef.current);
                            sellTimerRef.current = null;
                          }
                          setSellConfirmIdx(idx);
                          setSellConfirmType("hand");
                          sellTimerRef.current = setTimeout(() => {
                            setSellConfirmIdx(null);
                            setSellConfirmType(null);
                            sellTimerRef.current = null;
                          }, 1500);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Shop row */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">Tavern</span>
                {gameState.players[0]?.shopFrozen && (
                  <span className="text-[10px] text-sky-300 font-semibold">Frozen</span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(gameState.players[0]?.shop ?? []).map((shopItem, idx) => {
                  const minionCard = MINIONS[shopItem.cardId];
                  const spellCard = SPELLS[shopItem.cardId];
                  if (minionCard) {
                    const canBuy =
                      (gameState.players[0]?.gold ?? 0) >= COST_BUY &&
                      gameState.phase.kind === "Recruit";
                    const handFull = handMinions.length >= 10;
                    const tierColor = TIER_COLORS[minionCard.tier] ?? "bg-gray-600";
                    const isFrozen = gameState?.players[0]?.shopFrozen ?? false;
                    return (
                      <button
                        key={shopItem.instanceId}
                        type="button"
                        onClick={() => handleBuyMinion(idx)}
                        disabled={!canBuy || handFull}
                        className={`flex w-[110px] flex-shrink-0 flex-col gap-1.5 rounded-lg border bg-slate-800 px-3 py-2 transition text-left
                          ${canBuy && !handFull ? "cursor-pointer hover:border-amber-400 active:scale-95" : "cursor-not-allowed opacity-50"}
                          ${shopItem.golden ? "border-amber-400 ring-2 ring-amber-400/30" : "border-slate-600"}
                          ${isFrozen ? "border-sky-400/70 bg-sky-950/40 ring-2 ring-sky-400/20" : ""}
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium text-white ${tierColor}`}
                          >
                            T{minionCard.tier}
                          </span>
                          <span className="text-[9px] text-slate-500 truncate">
                            {minionCard.tribes.join("/")}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium leading-tight text-slate-300">
                          {minionCard.name}
                          {shopItem.golden && <span className="ml-0.5 text-amber-400">*</span>}
                        </span>
                        <div className="flex gap-2 text-xs font-bold">
                          <span className="text-red-400">{shopItem.atk}</span>
                          <span className="text-orange-400">{shopItem.hp}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
                          <span>{COST_BUY}g</span>
                        </div>
                        {minionCard.baseKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-0.5">
                            {Array.from(minionCard.baseKeywords).map((kw) => (
                              <span
                                key={kw}
                                className="rounded bg-slate-700 px-1 py-0.5 text-[8px] text-slate-300"
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
                        className={`flex w-[110px] flex-shrink-0 flex-col gap-1.5 rounded-lg border-2 bg-slate-800 px-3 py-2 transition text-left
                          ${canBuy ? "border-purple-500/50 cursor-pointer hover:border-purple-400 active:scale-95" : "border-slate-600 cursor-not-allowed opacity-50"}
                        `}
                      >
                        <span className="text-[10px] font-medium leading-tight text-slate-300">
                          {spellCard.name}
                        </span>
                        <span className="text-[9px] text-slate-400 line-clamp-2">
                          {spellCard.description}
                        </span>
                        <div className="flex items-center gap-0.5 text-[10px] font-semibold text-purple-400">
                          <span>{spellCard.cost}g</span>
                        </div>
                      </button>
                    );
                  }
                  return null;
                })}
                {!(gameState.players[0]?.shop ?? []).length && (
                  <p className="text-slate-500 text-sm">Shop is empty</p>
                )}
              </div>
            </div>

            {/* Spells row */}
            {(() => {
              const player = gameState?.players[0];
              const spells = player?.spells ?? [];
              if (spells.length === 0) return null;
              return (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                      Spells
                    </span>
                    <span className="text-[11px] text-slate-500">({spells.length})</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {spells.map((spell, idx) => {
                      const card = SPELLS[spell.cardId];
                      if (!card) return null;
                      const canPlay = gameState?.phase.kind === "Recruit";
                      const isSelected = selectedSpellIdx === idx;
                      const NO_TARGET_SPELLS = new Set([
                        "banana",
                        "mystery_shot",
                        "poison_dart_shield",
                        "pancake",
                        "swat_team",
                        "tavern_tipper",
                        "tavern_brawl",
                        "cauterizing_flame",
                      ]);
                      const isNoTargetSpell = NO_TARGET_SPELLS.has(card.id);
                      return (
                        <button
                          key={spell.instanceId}
                          type="button"
                          onClick={() => {
                            if (!gameState || gameState.phase.kind !== "Recruit") return;
                            if (isNoTargetSpell) {
                              const player = gameState.players[0];
                              if (!player) return;
                              try {
                                const next = step(
                                  gameState,
                                  { kind: "PlaySpell", player: 0, spellIndex: idx },
                                  rngForTurn(gameState, "playSpell"),
                                );
                                setGameState(next);
                                setError(null);
                              } catch {
                                setError("Could not play spell");
                              }
                              return;
                            }
                            const player = gameState.players[0];
                            if (!player || player.board.length === 0) {
                              setError("No valid targets on board");
                              return;
                            }
                            setSelectedSpellIdx(isSelected ? null : idx);
                            setError(null);
                          }}
                          disabled={!canPlay}
                          className={`flex w-[110px] flex-shrink-0 flex-col gap-1.5 rounded-lg border-2 bg-slate-800 px-3 py-2 transition text-left
                            ${isSelected ? "border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/30" : canPlay ? "border-amber-500/50 cursor-pointer hover:border-amber-400 active:scale-95" : "border-slate-600 cursor-not-allowed opacity-50"}
                          `}
                        >
                          <span className="text-[10px] font-medium leading-tight text-slate-300">
                            {card.name}
                          </span>
                          <span className="text-[9px] text-slate-400 line-clamp-2">
                            {card.description}
                          </span>
                          <div className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400">
                            <span>{card.cost}g</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Action buttons row */}
            {gameState.phase.kind === "Recruit" && (
              <div className="flex flex-wrap gap-2 items-center">
                {/* Shop actions */}
                {(() => {
                  const player = gameState.players[0];
                  if (!player) return null;

                  const canUpgrade =
                    player.tier < 6 &&
                    player.gold >= player.upgradeCost &&
                    !player.upgradedThisTurn;
                  const canRefresh = player.gold >= COST_REFRESH && !player.shopFrozen;
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
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          canUpgrade
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            : "cursor-not-allowed bg-slate-700 text-slate-500"
                        }`}
                      >
                        Upgrade T{player.tier + 1} — {player.upgradeCost}g
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
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
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
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          canFreeze
                            ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
                            : "cursor-not-allowed bg-slate-700 text-slate-500"
                        }`}
                      >
                        {player.shopFrozen ? "Unfreeze" : "Freeze"}
                      </button>
                    </>
                  );
                })()}

                {/* Hero power */}
                {(() => {
                  const player = gameState.players[0];
                  const hero = player?.heroId ? HEROES[player.heroId] : undefined;
                  const hasActivePower = hero?.power.kind === "active";
                  const powerCost = hasActivePower
                    ? (hero!.power as { kind: "active"; cost: number; usesPerTurn: number }).cost
                    : 999;
                  const canUsePower =
                    hasActivePower && player && player.gold >= powerCost && !player.heroPowerUsed;

                  if (!hasActivePower) return null;

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
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
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
                            : "Click a board minion first"}
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
                })()}

                {/* Spell targeting cancel */}
                {selectedSpellIdx !== null && (
                  <>
                    <span className="text-xs text-amber-400">Select a board minion to target</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSpellIdx(null)}
                      className="rounded bg-amber-500/80 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {/* Spacer + End Turn */}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleEndTurn}
                  className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  End Turn
                </button>
              </div>
            )}
          </div>

          {/* ---- RIGHT SIDEBAR: Hero info ---- */}
          <aside className="flex w-[180px] flex-shrink-0 flex-col border-l border-slate-800 bg-slate-900/80 p-4 gap-4">
            {/* Hero portrait */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500 bg-slate-800 text-2xl font-bold text-slate-100">
                {(() => {
                  const p = gameState.players[0] ?? gameState.players.at(-1);
                  const hero = p?.heroId ? HEROES[p.heroId] : undefined;
                  return hero ? hero.name.charAt(0) : "?";
                })()}
              </div>
              <span className="text-[12px] font-semibold text-slate-200 text-center">
                {(() => {
                  const p = gameState.players[0] ?? gameState.players.at(-1);
                  const hero = p?.heroId ? HEROES[p.heroId] : undefined;
                  return p?.heroId && hero ? hero.name : "None";
                })()}
              </span>
            </div>

            {/* HP and armor */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Health</span>
              <span className="text-3xl font-bold text-emerald-400 tabular-nums">
                {gameState.players[0]?.hp ?? 0}
              </span>
              {(gameState.players[0]?.armor ?? 0) > 0 && (
                <span className="text-sm font-medium text-sky-400">
                  +{gameState.players[0]?.armor} armor
                </span>
              )}
            </div>

            {/* Gold */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Gold</span>
              <span className="text-3xl font-bold text-amber-400 tabular-nums">
                {gameState.players[0]?.gold ?? 0}
              </span>
            </div>

            {/* Tier */}
            <div
              key={tierFlashKey}
              className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-1"
              style={
                tierFlashKey > 0
                  ? {
                      animation: "tierFlash 0.6s ease-out",
                    }
                  : undefined
              }
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                Tavern Tier
              </span>
              <span className="text-3xl font-bold text-blue-400 tabular-nums">
                {gameState.players[0]?.tier ?? 1}
              </span>
            </div>

            {/* Turn */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Turn</span>
              <span className="text-3xl font-bold text-purple-400 tabular-nums">
                {gameState.turn}
              </span>
            </div>
          </aside>
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

      {/* Game over overlay */}
      {gameState?.phase.kind === "GameOver" && <GameOverOverlay state={gameState} />}
    </main>
  );
}
