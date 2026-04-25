# Effect hooks

## Version

TBD.

## Hook taxonomy

Every card effect implements one or more hooks. The game engine walks
the hook list at the right moment.

### Recruit-phase hooks

- `onBattlecry(state, self) → state` — fires when the minion is played
  from hand to board.
- `onSell(state, self) → state` — fires when the minion is sold.
- `onBuy(state, self) → state` — fires when the minion is bought
  (before it hits the board).
- `onTurnStart(state, self) → state` — fires at start of recruit phase.
- `onTurnEnd(state, self) → state` — fires at end of recruit phase.

### Combat hooks

Combat hooks take `(combat, self) → combat` where `combat` is the mid-sim
state (distinct from `GameState`).

- `onStartOfCombat(combat, self)`
- `onAttack(combat, self, target)` — when self is the attacker.
- `onAttacked(combat, self, attacker)` — when self is the defender.
- `onDamaged(combat, self, amount, source)`
- `onDeath(combat, self)` — a.k.a. deathrattle.
- `onSummon(combat, self, summoned)` — when another minion is summoned
  on my side.
- `onAlly Kills(combat, self, killed)` — when an ally scores a kill.

### Discover hook

- `onDiscover(state, self, choices) → state` — custom discover UI, used
  by triples, some heroes, and "Discover a …" effects.

## Authoring a minion

```ts
// src/game/minions/tier1/wrath-weaver.ts
import { defineMinion } from "../define";

export default defineMinion({
  id: "wrath_weaver",
  name: "Wrath Weaver",
  tier: 1,
  tribes: [],
  stats: { atk: 1, hp: 3 },
  hooks: {
    onBattlecry: (state, self) => { /* ... */ return state; },
  },
});
```

The minion registry is code-generated — **don't edit `index.ts` by
hand**. Use `/add-minion` (see `.claude/commands/add-minion.md`).

## Ordering rules

When multiple hooks fire at the same event:

1. Board-order (left-to-right), then
2. By position the effect was added if tied.

Start-of-combat effects alternate between sides, starting with the side
that will attack first.

Deathrattles resolve in the order minions died, not board order.
