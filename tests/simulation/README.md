# Simulation tests

These run seeded combats and lobby sims. Slower than unit tests;
separate project in vitest.

Run: `bun test:sim`

Add a simulation test when:

- You're shipping a new start-of-combat or deathrattle effect that
  interacts with other minions non-trivially.
- You're changing combat ordering or resolution rules.
- You're introducing a new keyword.

Don't add a sim test for simple stat changes or shop-phase logic —
those live in unit tests near the code.
