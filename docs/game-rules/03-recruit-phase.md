# Recruit phase

## Version

Modern BG (April 2026).

## Timing

- Turn N recruit phase length: scales with game progression.
  - Turns 1–2: ~45s in real BG, but we're playing against AI so the
    human just clicks "end turn" when ready. AI plays are instantaneous.
- No forced timer in MVP. May add a configurable "fast mode" later.

## Shop

- Shop size by tavern tier:
  - Tier 1: 3 minions
  - Tier 2: 4
  - Tier 3: 4
  - Tier 4: 5
  - Tier 5: 5
  - Tier 6: 6

- Shop offers minions from the current tier AND all lower tiers.
- Minion odds per tier are weighted — higher tiers have higher odds at
  higher player tiers. Open question: confirm exact weights for target
  patch.

## Board

- Max 7 minions on board.
- Buying when full is disallowed (or forced sell — confirm UX).
- Reorder is free, any time during recruit.

## Hand

- Max 10 cards in hand (minions + spells).
- **Buy flow: buy → hand → play to board.** Bought minions land in
  hand. Player explicitly plays them to the board. This means
  battlecries fire on play, not on buy.
- Sources: bought minions, hero powers, discovers, triple rewards.

## Freeze

- Freezes the whole shop as-is. Next turn, the frozen shop appears
  instead of a fresh roll.
- Bought minions from a frozen shop leave gaps; gaps don't refill until
  next turn.
- Rolling a frozen shop unfreezes and rerolls.

## Pool

- Shared across all 8 players.
- When a player sells a minion, 1 copy returns to the pool.
- When a player dies, their minions return to the pool.
- Minion count per card at each tier is finite — confirm counts.
