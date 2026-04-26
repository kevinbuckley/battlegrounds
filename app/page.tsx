import Link from "next/link";

const heroSelectRoute = "/hero-select" as any;

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-5xl font-bold tracking-tight">Battlegrounds</h1>
      <p className="max-w-lg text-center text-slate-400">
        A solo clone of Hearthstone Battlegrounds. You vs. 7 AI opponents.
      </p>
      <Link
        href={heroSelectRoute}
        className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        Start game
      </Link>
    </main>
  );
}
