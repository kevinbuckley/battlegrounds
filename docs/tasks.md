# Task backlog

Milestones are rough groupings, not strict phases. Within a milestone,
prefer small vertical slices (a minion + its test + its UI) over broad
horizontal work.

Mark tasks `[x]` when **merged with tests green**. Link to the PR.

---

## M0 — Harness bootstrap

- [ ] `bun install` succeeds; `bun dev` loads a blank page
- [ ] `bun typecheck` green on empty scaffold
- [ ] `bun test` green on empty scaffold
- [ ] Biome config shapes the whole repo
- [ ] Vercel preview deploys on push

## M1 — Deterministic core

- [ ] Seeded RNG (`src/lib/rng.ts`) — mulberry32 with tests
- [ ] `GameState` type + initial-state builder
- [ ] `step(state, action, rng)` reducer shell
- [ ] Action discriminated union for recruit phase
- [ ] Gold economy (start 3, +1/turn, cap 10)
- [ ] Tavern tier upgrades with discount curve

## M2 — Minions, round 1 (tier 1–2, no tribe synergies)

- [ ] Minion file convention + registry generator
- [ ] First 10 minions (pick vanilla stat-ball tier 1s)
- [ ] Combat sim for vanilla minions (no effects yet)
- [ ] Snapshot-tested combat fixtures

## M3 — Shop mechanics

- [ ] Buy (3g), sell (1g)
- [ ] Refresh (1g)
- [ ] Freeze
- [ ] Shop size scales with tier
- [ ] Minion pool (shared) + return-on-sell

## M4 — Effects system

- [ ] Battlecry hook
- [ ] Deathrattle hook
- [ ] Start-of-combat hook
- [ ] Divine shield, taunt, windfury, poisonous, reborn, venomous
- [ ] Triggered effects during combat (on-attack, on-summon, etc.)

## M5 — Tribes (seeded one at a time)

- [ ] Tribe rotation: pick 5 from [see open question]
- [ ] Beasts (tier 1–6)
- [ ] Murlocs (tier 1–6)
- [ ] Demons (tier 1–6)
- [ ] Mechs (tier 1–6)
- [ ] Elementals (tier 1–6)
- [ ] Pirates (tier 1–6)
- [ ] Dragons (tier 1–6)
- [ ] Nagas (tier 1–6)
- [ ] Quilboars (tier 1–6)
- [ ] Undead (tier 1–6)

## M5.5 — Lobby modifiers (random per game)

See [docs/game-rules/10-lobby-modifiers.md](game-rules/10-lobby-modifiers.md).

- [ ] Modifier framework: roll active set at lobby start, 50% each
- [ ] Anomalies: 1 active per lobby, 5–10 anomaly cards to start
- [ ] Tavern spells: new shop slot, buy-and-cast flow, 10 spells to start
- [ ] Trinkets: between-round pick screen, 10 trinkets to start
- [ ] Quests: per-player progress + reward, 5 quests to start
- [ ] Buddies: per-hero buddy minion + buddy gauge

## M6 — Heroes + hero powers

- [ ] Hero type + power interface
- [ ] 10 simple heroes (no-power or passive-only to start)
- [ ] Active-power heroes (add iteratively)
- [ ] Start-of-game heroes (modify initial state)
- [ ] Full roster expansion (long-tail; each hero is its own small PR)

## M7 — AI opponents

- [ ] Baseline heuristic AI (greedy buy, tier-up on curve)
- [ ] Difficulty tuning
- [ ] AI-vs-AI lobby sim harness
- [ ] Rating system for AI strength

## M8 — UI

- [ ] Board view (your minions, drag to reorder)
- [ ] Shop view
- [ ] Hero + gold + HP HUD
- [ ] Combat animation from transcript
- [ ] Opponent preview
- [ ] Leaderboard (lobby standings)

## M9 — Triples, discovers, keyword UIs

- [ ] Detect triple, surface upgrade discover
- [ ] Generic discover UI (used by heroes, effects, triples)

## M10 — Polish & deploy

- [ ] Vercel production deploy
- [ ] Replay serialization (`seed + actions[]` → shareable URL)
- [ ] Sound + juice

---

## Resolved scope

- **Target:** modern BG (April 2026). No specific patch pinned; numeric
  values may need tuning during playtest.
- **Mode:** solo only. No duos.
- **Tribes:** all 10 exist; **5 random per lobby**.
- **Hero selection:** 4 offered at start. Starting HP 25/30/35/40 by
  tier. Armor tiers 0/3/5/7/9.
- **Shop flow:** buy → hand → play-to-board (battlecries fire on play).
- **Ghost pairing:** deals damage on win.
- **Damage cap:** none (uncapped).
- **Hero roster:** simple/passive heroes first; full roster long-tail.
- **Lobby modifiers:** all five (trinkets, spells, anomalies, quests,
  buddies) implemented; **random 50%-independent roll per game** picks
  which are active.

## Still open (not blocking)

- Visual style — pixel-faithful vs. inspired (affects art budget)
- Animation polish vs. MVP functionality tradeoff
- Whether to persist run history (Vercel KV) post-MVP
- Mobile responsiveness: desktop-first for MVP?
