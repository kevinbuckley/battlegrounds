# Triples

## Version

TBD.

## Trigger

- Owning 3 copies of the same minion (across board + hand) triggers a
  triple.
- On trigger: the 3 copies are consumed and replaced by a single
  "golden" copy of the same minion (2x stats, effect counts 2x for most
  effects).
- The player is offered a discover of 3 minions from tier+1 (capped at
  max tier).

## Gold triples

- 3 golden copies of the same minion triple into a discover from
  tier+2 (capped).
- This is rare in practice; tested for correctness but not optimized UX.

## Discover

- Generic discover UI: player picks 1 of 3 minions.
- Picked minion is added to hand.
- Non-picked minions return to the pool.

See [09-effect-hooks.md](09-effect-hooks.md) for the discover API.
