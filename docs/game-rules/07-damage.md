# Damage & elimination

## Version

Modern BG (April 2026).

## Damage formula

Damage dealt to the **loser** of a fight:

```
damage = losingPlayerTier
       + sum(tiers of surviving winning minions)
```

- Ties deal 0 damage.
- Draws count for stats but not damage.
- **No damage cap.** Uncapped classic damage — a stacked board can
  one-shot an opponent.

## Armor

- Players start with armor based on hero tier (0/3/5/7/9).
- Damage reduces armor first, then HP.
- Armor doesn't regenerate.

## Elimination

- A player is eliminated when HP drops to 0 or below.
- On elimination: their minions return to the pool.
- Their seat is preserved for the "ghost" fight in odd-count rounds.

## Ghost pairing

- When an odd number of players remain alive, one active player is
  paired against the **ghost** of the most recently eliminated player
  (their final board, frozen in time).
- **The ghost deals damage as normal** if it wins. No free fights.
- If the ghost also wins a subsequent round's pairing, it uses the
  same frozen board again.

## Game end

- Last player standing wins.
- Placement (1st–8th) matters for rating / MMR in real BG. We don't
  track MMR but we do show final placement.
