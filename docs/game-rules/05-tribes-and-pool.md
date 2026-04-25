# Tribes & minion pool

## Version

Modern BG (April 2026).

## Tribes

Every minion has 0 or more tribes. Most have exactly 1; "All"-tribe
minions (e.g. Amalgam) count as every tribe.

Full tribe roster:

- Beast
- Murloc
- Demon
- Mech
- Elemental
- Pirate
- Dragon
- Naga
- Quilboar
- Undead

## Rotation

**5 of 10 tribes per lobby.** At game start, 5 tribes are picked at
random (seeded) and only those tribes' minions are in the pool for
that lobby. Tribeless ("neutral") minions are always in the pool.

"All"-tribe minions (e.g. Amalgam) are in the pool only if at least
one of their "counts as" tribes is in the lobby — matches current BG
behavior.

## Pool

- Pool is shared across all 8 players.
- Each minion card has a finite number of copies at each tier:
  - Tier 1: ~18 copies per card
  - Tier 2: ~15
  - Tier 3: ~13
  - Tier 4: ~11
  - Tier 5: ~9
  - Tier 6: ~7
  - Exact numbers shift between patches — confirm with target patch.
- When you sell a minion, 1 copy returns to the pool.
- When you play a minion, 1 copy leaves the pool.
- When a player is eliminated, their minions return to the pool.

## Triples

When a triple is formed, the 3 minions are consumed from the player's
board/hand, and they don't return to the pool. A tier+1 discover is
offered (see [06-triples.md](06-triples.md)).
