# Game rules — canonical spec

**This directory is the source of truth.** The game we're building is
whatever these documents say, regardless of what current Battlegrounds
looks like. If you see a divergence, update the spec first, then change
the code.

Each file covers one mechanic. Keep them short, precise, and
version-stamped at the top.

## Index

- [01 — Lobby & heroes](01-lobby-and-heroes.md)
- [02 — Economy (gold, tiers)](02-economy.md)
- [03 — Recruit phase (shop)](03-recruit-phase.md)
- [04 — Combat phase](04-combat-phase.md)
- [05 — Tribes & minion pool](05-tribes-and-pool.md)
- [06 — Triples](06-triples.md)
- [07 — Damage & elimination](07-damage.md)
- [08 — Keywords (DS, taunt, etc.)](08-keywords.md)
- [09 — Effect hooks (battlecry, deathrattle, SoC)](09-effect-hooks.md)

## Conventions

- Every rule file starts with a `## Version` section identifying the
  source patch we're cloning from.
- Numeric values (gold costs, HP, damage) live in ONE place in the
  rules. Code reads from constants that reference the rule file.
- When a rule has variants (e.g. "tier 7 exists in duos but not solo"),
  make it explicit — don't leave it for the reader to figure out.
- If a rule references another rule, link to it.

## Lobby modifiers (random per game)

- [10 — Lobby modifiers (trinkets, spells, anomalies, quests, buddies)](10-lobby-modifiers.md)

## Out of scope

- Duos mode (2v2 teams) — explicitly excluded.
