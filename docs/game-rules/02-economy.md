# Economy

## Version

Modern BG (April 2026). Numeric costs pinned below; revisit if we later
decide to clone a specific patch.

## Gold

- Start of turn: base gold = `min(3 + turnNumber, 10)`, where turn 1 is
  the first recruit phase. So turn 1 = 3g, turn 2 = 4g, …, turn 8+ = 10g.
- Gold does not carry over between turns. Unused gold is lost.
- Exceptions: some hero powers / effects grant extra gold or banked gold.

## Actions & costs

| Action         | Cost |
|----------------|------|
| Buy minion     | 3g   |
| Sell minion    | +1g  |
| Refresh shop   | 1g   |
| Freeze shop    | 0g   |
| Upgrade tier   | see below |
| Hero power     | varies |

## Tier upgrade costs

Base cost to upgrade to the next tier, and the discount clock:

| To tier | Base cost |
|---------|-----------|
| 2       | 5g        |
| 3       | 7g        |
| 4       | 8g        |
| 5       | 9g        |  
| 6       | 10g       |

- Each turn you don't upgrade, the cost decreases by 1 (minimum 0).
- Upgrading resets the discount to base for the next tier.
- Open question: confirm exact current values — historically costs have
  drifted between patches.

## Max tier

- Solo: 6.
