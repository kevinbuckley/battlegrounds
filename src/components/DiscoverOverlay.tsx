"use client";

import { MINIONS } from "@/game/minions/index";
import type { DiscoverOffer } from "@/game/types";

const TIER_COLORS: Record<number, string> = {
  1: "bg-emerald-600",
  2: "bg-blue-600",
  3: "bg-purple-600",
  4: "bg-orange-600",
  5: "bg-red-600",
  6: "bg-yellow-600",
};

export function DiscoverOverlay({
  offers,
  title,
  onPick,
  onDismiss,
}: {
  offers: DiscoverOffer[];
  title?: string;
  onPick: (index: number) => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="flex w-[95vw] max-w-2xl flex-col gap-4 rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl">
        <h2 className="text-center text-2xl font-bold text-amber-400">
          {title ?? "Discover a minion"}
        </h2>
        <div className="flex gap-4">
          {offers.map((offer, idx) => {
            const card = MINIONS[offer.minion.cardId];
            if (!card) return null;
            const tierColor = TIER_COLORS[card.tier] ?? "bg-gray-600";
            return (
              <button
                key={offer.offerId}
                type="button"
                onClick={() => onPick(idx)}
                className="flex flex-1 flex-col gap-2 rounded-xl border-2 border-slate-600 bg-slate-900 px-4 py-5 transition hover:border-amber-400 hover:bg-slate-800 hover:shadow-lg active:scale-[0.97]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-bold text-white ${tierColor}`}
                  >
                    T{card.tier}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-100">{card.name}</span>
                <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                  <span>{card.tribes.join("/")}</span>
                </div>
                <div className="flex justify-center gap-4 text-lg font-bold">
                  <span className="flex items-center gap-1 text-red-400">
                    {offer.minion.atk} <span className="text-sm">Attack</span>
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    {offer.minion.hp} <span>❤</span> <span className="text-sm">Health</span>
                  </span>
                </div>
                {offer.minion.keywords.size > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {Array.from(offer.minion.keywords).map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {offer.minion.golden && (
                  <span className="text-center text-xs font-bold text-amber-400">✨ Golden</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
