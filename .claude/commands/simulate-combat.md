---
description: Run a seeded combat between two fixture boards and print the transcript
---

Simulate a combat and dump the transcript for inspection.

## Usage

`$ARGUMENTS` should be one of:
- Two fixture names: e.g. `murloc-tide-v-beast-brawl seed=42`
- Inline: a quick ad-hoc board description

## Steps

1. If the fixtures don't exist, ask the user to describe both boards
   (list of minion ids + stats + keywords per side).
2. Write a one-off script at `scripts/sim-once.ts` if not present:
   builds the two boards, calls `simulateCombat`, pretty-prints the
   transcript.
3. Run with `bun run scripts/sim-once.ts`.
4. Return the transcript and the final damage calculation.

## Rules

- Don't commit the one-off script — it's throwaway.
- If the transcript surprises you, flag it to the user with the seed so
  they can reproduce.

$ARGUMENTS
