# Keywords

## Version

TBD.

## Combat keywords

- **Taunt** — must be attacked first. Multiple taunts: target chosen
  randomly among them.
- **Divine Shield** — absorbs the next instance of damage, then
  disappears.
- **Poisonous** — any damage dealt kills the target.
- **Venomous** — same as poisonous but consumed after first proc.
- **Windfury** — attacks twice per attack turn.
- **Mega-Windfury** — attacks four times.
- **Reborn** — when it dies for the first time, returns with 1 HP.
- **Cleave** — hits adjacent minions too.
- **Magnetic** — when played on the board, if there is a friendly minion
  of the same tribe, stacks on top: combined stats (max of each stat +
  the magnetic minion's stats), combined keywords, magnetic removed.

## Timing

- Divine shield absorbs damage BEFORE poisonous/venomous checks.
- Reborn triggers AFTER deathrattles of the same minion.
- Windfury attacks complete before resuming normal turn order (attacker
  pointer doesn't advance between windfury hits).
