---
description: Scaffold a new hero with its hero power
---

Add a Battlegrounds hero.

## Steps

1. Ask the user for (or parse from $ARGUMENTS):
   - Name
   - HP tier (25/30/35/40) and armor tiers
   - Hero power type (passive / active / start-of-game / quest)
   - Hero power cost (if active)
   - Hero power effect in plain text
2. Consult `docs/game-rules/01-lobby-and-heroes.md`.
3. Create `src/game/heroes/<kebab-name>.ts`:
   - Use `defineHero` — see existing heroes for pattern.
   - Implement the hero power's hooks.
4. Create `src/game/heroes/<kebab-name>.test.ts`:
   - Cover the power's main use cases.
   - Cover the armor / HP starting state.
5. Update `src/game/heroes/index.ts` to re-export.
6. Run `bun test` and `bun typecheck`.

## Rules

- If the power interacts with a mechanic we haven't implemented yet
  (e.g. Buddies, Quests), STOP and ask the user whether to stub,
  defer, or implement the missing mechanic first.

$ARGUMENTS
