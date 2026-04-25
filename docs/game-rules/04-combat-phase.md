# Combat phase

## Version

TBD.

## Pairing

- 8 players paired into 4 fights per round.
- Pairing algorithm: avoid immediate rematches; randomize within
  constraints. Seeded by `(lobbySeed, roundNumber)`.
- Odd count (after eliminations): unpaired player fights the
  **ghost** (most recently eliminated player's frozen board). Ghost
  deals damage on win. See [07-damage.md](07-damage.md).

## Combat algorithm

Fully deterministic given `(leftBoard, rightBoard, rng)`.

1. Determine starting attacker:
   - Player with more minions attacks first.
   - Tied: random (seeded).
2. Alternate attacks until one side is empty or 500+ attacks have
   occurred (deadlock safety).
3. On each attack:
   1. Active attacker is leftmost eligible minion on the attacking side,
      advancing after each attack (with wraparound).
   2. Target selection: random from opposing side, respecting taunt.
   3. Damage exchange: both minions deal their attack to each other.
   4. Keywords apply (divine shield, poisonous, venomous, reborn, etc.).
   5. Deathrattles resolve in order of death (left-to-right).
   6. On-summon / on-attack / on-damage triggers fire.
   7. Attack counter advances.

## Start-of-combat effects

Resolve BEFORE any attack:

1. Hero start-of-combat effects (if any).
2. Minion start-of-combat effects, left-to-right, alternating between
   players starting with the player who will attack first.
3. Effects that generate more start-of-combat effects resolve until
   fixed point.

## Output

Combat produces a **transcript**: ordered list of events.

```ts
type CombatEvent =
  | { kind: "StartOfCombat"; source: MinionId }
  | { kind: "Attack"; attacker: MinionId; target: MinionId }
  | { kind: "Damage"; target: MinionId; amount: number }
  | { kind: "Death"; source: MinionId }
  | { kind: "Summon"; minion: Minion; side: Side; position: number }
  | { kind: "Stat"; target: MinionId; atk: number; hp: number }
  | { kind: "End"; winner: Side | "draw" };
```

The UI animates from this transcript. The reducer applies the final
board state and damage.

## Damage dealt

See [07-damage.md](07-damage.md).
