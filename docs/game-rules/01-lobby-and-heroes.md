# Lobby & heroes

## Version

Modern BG (as of April 2026). Not pinned to a specific patch — we pull
the best of the current feature set. Target vibe: "all the extras,
randomized per lobby."

## Lobby

- 8 players per lobby (1 human + 7 AI).
- No late joins, no drops. AI fills every seat at start.

## Hero selection

- At game start, each player is offered **4** heroes and picks one.
- Hero pool is shared — no two players can be offered the same hero.
- Once picked, the remaining hero options are returned to the pool.

## Starting state

- Starting HP: varies by hero tier — 25 / 30 / 35 / 40.
- Starting armor: per-hero, in tiers of 0 / 3 / 5 / 7 / 9.
- Starting gold: 3.
- Starting tier: 1.

## MVP hero roster

Ship a curated subset (~10–15) of simple heroes first (no-power or
passive). Add complex/active-power heroes iteratively. Full roster is
a long-tail milestone.

## Hero powers

- Passive: always on, no activation.
- Active: costs gold, used once per turn (or N times).
- Start-of-game: modifies initial state once and then inert.
- Quest-like: unlocks a reward after a condition.

See [09-effect-hooks.md](09-effect-hooks.md) for the hook API.
