---
description: Scaffold a new minion card (file + test + registry update)
---

Add a Battlegrounds minion card.

## Steps

1. Ask the user for (or parse from $ARGUMENTS):
   - Name (e.g. "Murloc Tidehunter")
   - Tier (1–6)
   - Tribes (e.g. "Murloc", or "None", or "All")
   - Stats (atk/hp)
   - Card text (the effect, in Hearthstone's wording)
2. Consult `docs/game-rules/09-effect-hooks.md` to decide which hooks
   the effect needs.
3. Create `src/game/minions/tier<N>/<kebab-name>.ts`:
   - Use `defineMinion` — see existing minions for pattern.
   - Implement each required hook.
4. Create `src/game/minions/tier<N>/<kebab-name>.test.ts`:
   - One test per hook.
   - Edge cases: empty board, full board, interactions with DS /
     poisonous / other keywords if relevant.
5. If the minion has a start-of-combat or deathrattle: add a fixture
   to `src/game/__snapshots__/` by writing a `*.sim.test.ts`.
6. Regenerate the minion registry: update
   `src/game/minions/index.ts` to re-export the new card.
7. Run `bun test` and `bun typecheck`. Both must pass.

## Rules

- ONE minion per invocation. Don't batch.
- If the card text is ambiguous, STOP and ask the user before writing
  code.
- Match the style of existing minions — don't introduce new patterns.

$ARGUMENTS
