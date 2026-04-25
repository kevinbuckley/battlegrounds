# Lobby modifiers

## Version

Modern BG (April 2026), with a twist: **all five modifier systems are
implemented and a random subset is active per lobby.** This is
deliberately different from real BG (which turns mechanics on/off by
season); the variety is the feature.

## The five modifiers

1. **Trinkets** — post-combat or tier-up item grants.
2. **Tavern spells** — buyable single-use spells that appear in the shop.
3. **Anomalies** — one global rule-bending modifier active all game.
4. **Quests** — random per-player quest with a reward on completion.
5. **Buddies** — hero-specific buddy minion that accumulates over turns.

## Per-lobby rolls

At lobby start, after seed + hero selection:

1. Roll independently for each modifier. Default probability: **50% each**.
   - This yields 0–5 modifiers active; expected ~2.5 per game.
   - Tune post-playtest. Guaranteed-minimum or exact-count variants
     are trivial to add if the default feels swingy.
2. Record active modifiers in `GameState.modifiers: ModifierId[]`.
3. Each active modifier runs its own init (e.g. anomaly picks one
   anomaly card; buddies assigns buddies to each hero).

All rolls flow through the seeded RNG — a given seed always produces
the same modifier mix.

## Interaction rules

- Modifiers stack additively unless explicitly incompatible.
- When two modifiers collide (e.g. an anomaly that bans spells + tavern
  spells active), the anomaly wins — modifiers are stronger than the
  base systems they override.
- Each modifier has a short conflict note in its own doc (to be written
  as each is implemented).

## Implementation order

Per [docs/tasks.md](../tasks.md) M5.5:

1. Anomalies first — one-card start-of-lobby effect, easiest to slot in.
2. Tavern spells — new shop slot type, new buy flow.
3. Trinkets — new between-round choice screen.
4. Quests — per-player progress tracking.
5. Buddies — hero-specific pool, most complex interaction surface.

Each modifier gets its own doc under `docs/game-rules/10-*/<name>.md`
once implementation begins.

## Data model sketch

```ts
type ModifierId = "trinkets" | "spells" | "anomalies" | "quests" | "buddies";

interface GameState {
  // existing fields…
  modifiers: ModifierId[];
  modifierState: {
    anomaly?: AnomalyId;
    quests?: Record<PlayerId, QuestState>;
    buddies?: Record<PlayerId, BuddyState>;
    // trinkets + spells are mostly local to each player's inventory
  };
}
```

## UI implication

The game-start screen surfaces active modifiers as badges so the
player knows what they're in for. The same info is available mid-game
via an info panel.
