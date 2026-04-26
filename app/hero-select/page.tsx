"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HEROES } from "@/game/heroes/index";
import type { Hero } from "@/game/types";

function pickRandomHeroes(count: number): Hero[] {
  const all = Object.values(HEROES);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HeroSelectPage() {
  const router = useRouter();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (Object.values(HEROES).length < 4) {
      setError("Not enough heroes available");
      return;
    }
    setHeroes(pickRandomHeroes(4));
    setError(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSelect = (heroId: string) => {
    router.push(`/game?hero=${heroId}`);
  };

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-2xl font-semibold text-red-400">{error}</h2>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          Go back
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-5xl font-bold tracking-tight text-slate-100">Choose Your Hero</h1>
      <p className="max-w-lg text-center text-slate-400">
        Pick a hero to begin your Battlegrounds run.
      </p>

      {heroes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroes.map((hero) => (
            <div key={hero.id} className="flex">
              <button
                type="button"
                onClick={() => onSelect(hero.id)}
                className="flex flex-col items-start rounded-xl border border-slate-700 bg-slate-900 p-6 text-left transition hover:border-amber-500 hover:bg-slate-800"
              >
                <span className="text-xl font-semibold text-slate-100">{hero.name}</span>
                <span className="mt-1 text-sm text-slate-400">{hero.description}</span>
                <span className="mt-3 px-2 py-1 text-xs font-medium text-amber-400">
                  {hero.startHp} HP
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={refresh}
        className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-2 font-medium text-slate-300 transition hover:border-amber-500 hover:text-amber-400"
      >
        Refresh heroes
      </button>
    </main>
  );
}
