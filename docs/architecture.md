# Architecture

## Shape of the system

```
┌──────────────────────┐     ┌────────────────────────┐
│  React UI            │     │  src/game (pure core)  │
│  app/ + components/  │◀───▶│  types, reducers,      │
│  - renders state     │     │  shop, combat, economy │
│  - dispatches actions│     │  deterministic         │
└──────────┬───────────┘     └────────────┬───────────┘
           │                              │
           │         ┌───────────┐        │
           └────────▶│  src/ai   │◀───────┘
                     │  opponents│
                     └───────────┘
```

### Three layers, hard boundaries

1. **`src/game/`** — pure functions over `GameState`. No React, no DOM, no
   time, no RNG except seeded. This is the full simulation of the game;
   the UI is a view of this state.
2. **`src/ai/`** — consumes `GameState` for a given player, emits
   `Action`s. Stateless; any memory lives inside `GameState.players[i].aiMemo`.
3. **`app/` + `src/components/`** — React. Reads state via Zustand,
   dispatches actions, animates combat transcripts.

## Data flow

All state mutations go through a single reducer:

```ts
step(state, action, rng) → { state, transcript }
```

- **`state`**: the full lobby — 8 players, their boards, shops, HP, gold,
  tier, and a global turn counter.
- **`action`**: discriminated union (`BuyMinion`, `SellMinion`, `Refresh`,
  `UpgradeTier`, `PlayMinion`, `ReorderBoard`, `EndTurn`, …).
- **`rng`**: seeded, threaded explicitly. No hidden randomness.
- **`transcript`**: for combat, an ordered list of events the UI animates
  (attack, damage, deathrattle trigger, summon, etc.).

## Why determinism matters

- **Replays** — serialize `(seed, actions[])` and re-derive the full game.
- **Simulation testing** — run 10k combats of fixture boards; diff
  transcripts when rules change.
- **AI evaluation** — pit strategies against each other reproducibly.
- **Debugging** — every bug is a seed + action sequence away from a
  minimal repro.

## Turn phase state machine

```
        ┌───────────────────┐
        │   HeroSelection   │  (game start only)
        └─────────┬─────────┘
                  ▼
        ┌───────────────────┐      ┌────────────────┐
        │   RecruitPhase    │─────▶│  CombatPhase   │
        │ (buy/sell/upgrade)│      │ (deterministic)│
        └─────────▲─────────┘      └────────┬───────┘
                  │                         │
                  │    ┌────────────────┐   │
                  └────┤  PostCombat    │◀──┘
                       │  (damage,      │
                       │   eliminate)   │
                       └────────┬───────┘
                                ▼
                       ┌────────────────┐
                       │  GameOver      │
                       │  (1 remaining) │
                       └────────────────┘
```

## Combat is async to UI, sync to state

The combat simulation runs to completion in a single reducer call and
produces a transcript. The UI then animates the transcript frame-by-frame.
This means:

- Game state advances atomically — no intermediate "during combat" state
  that the UI could get out of sync with.
- Animation speed is a UI concern only. Skipping animation = instant.
- Fully replayable.

## Pairing (who fights whom)

8-player lobby pairs 4 fights per round. Pairings are deterministic given
the seed and round number, using the standard BG algorithm: avoid rematches
when possible, "ghost" for odd counts after eliminations.

## AI memory

AI opponents have persistent state per lobby in `GameState.players[i].aiMemo`.
This is serialized with the rest of the state — replays reproduce AI
decisions exactly.

## No server state (yet)

MVP is entirely client-side. A seeded game runs fully in the browser.
Later we may add:
- Vercel KV for saved runs / leaderboards
- Server actions for post-game analysis

But the core loop needs zero server round-trips. This is deliberate — it
makes the system trivially deployable, infinitely scalable per user, and
latency-free.

## Minion/hero registry

Minions and heroes are defined one-per-file under
`src/game/minions/<tier>/<name>.ts` and `src/game/heroes/<name>.ts`. A
generated `index.ts` re-exports them. We regenerate on file changes via
the `/add-minion` and `/add-hero` slash commands. This keeps diffs
surgical when adding content.

## Test strategy

Three tiers:

1. **Unit** (`*.test.ts`) — per-reducer, per-effect, fast.
2. **Simulation** (`*.sim.test.ts`) — seeded combats over fixture
   boards; snapshot the transcript. Changes require explicit snapshot
   approval.
3. **E2E** (Playwright, later) — full game run through the UI.
