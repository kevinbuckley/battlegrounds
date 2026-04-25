# Battlegrounds Clone

Browser-based clone of Hearthstone Battlegrounds. Solo-play — the user
vs. 7 AI opponents in an 8-player lobby. Next.js 15 + React 19 on Vercel.

## Read this first

This repo is built for long-horizon AI-assisted development. Before doing
anything non-trivial, consult the relevant spec — **the specs are the
source of truth, not your training data about Battlegrounds.** Rules change
between patches; the specs pin the exact version we're cloning.

- **Game rules (canonical spec):** [docs/game-rules/](docs/game-rules/)
  - Start at [docs/game-rules/README.md](docs/game-rules/README.md) for the
    index. Each rule lives in its own file so you can load only what you need.
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **Task backlog:** [docs/tasks.md](docs/tasks.md) — pick the next
  unblocked task; don't invent scope.

If a rule is ambiguous or missing from the specs, **stop and ask the user**
rather than guessing. Hearthstone Battlegrounds has hundreds of
interacting mechanics and guessing is how subtle bugs get baked in.

## Directory map

```
app/                Next.js App Router — thin shell, defers to src/
src/
  game/             PURE game logic. No React, no I/O, no randomness
                    that isn't seeded. Every function deterministic given
                    (state, rng). This is what we test exhaustively.
    types.ts        Single source of truth for game types
    state.ts        GameState + top-level reducer
    shop.ts         Recruit phase (buy/sell/refresh/upgrade/freeze)
    combat.ts       Combat phase simulator (deterministic)
    economy.ts      Gold, tier costs, discounts
    damage.ts       Hero damage calculation post-combat
    heroes/         Hero definitions + hero powers
    minions/        Minion card definitions, indexed by tier
    effects/        Battlecry / deathrattle / start-of-combat hooks
  ai/               AI opponents. Consumes src/game, emits actions.
    strategy.ts     Strategy interface
    heuristics/     Baseline rule-based AIs (first pass)
  components/       React UI. Reads GameState, dispatches actions.
  lib/
    rng.ts          Seeded RNG (xoshiro or mulberry32) — NEVER Math.random

tests/              Integration & e2e tests
docs/               Specs + architecture + task backlog
.claude/            Harness config — agents, commands, settings
```

## Non-negotiable invariants

1. **`src/game/**` is pure and deterministic.** No `Math.random`, no
   `Date.now`, no `fetch`, no React. All randomness flows through a seeded
   RNG passed explicitly. This lets us replay/fuzz combat.
2. **Types are the spec.** If you change a type in `src/game/types.ts`,
   you are changing the game. Update the matching doc in
   `docs/game-rules/` in the same change.
3. **Combat is pure input → output.** `simulateCombat(left, right, rng)`
   returns a transcript. The UI animates from the transcript; it never
   mutates game state.
4. **One minion per file** under `src/game/minions/<tier>/`. Registry in
   `src/game/minions/index.ts` is code-generated — don't edit by hand.
   Use `/add-minion` to add new ones.
5. **Never merge without the simulation suite passing.** `bun test` runs
   thousands of seeded combats. Regressions show up as diffs in
   transcripts, not just boolean pass/fail.

## Commands you'll use

```bash
bun dev            # Next.js dev server (http://localhost:3000)
bun test           # Vitest — unit + simulation tests
bun test:watch     # Watch mode
bun typecheck      # tsc --noEmit
bun lint           # Biome check
bun lint:fix       # Biome check --apply
```

## When stuck

- Rule question → `docs/game-rules/<topic>.md`
- "How do I add a minion?" → `.claude/commands/add-minion.md`
- "How do I add a hero?" → `.claude/commands/add-hero.md`
- Architecture question → `docs/architecture.md`
- Still stuck → ask the user. Do not invent mechanics.
