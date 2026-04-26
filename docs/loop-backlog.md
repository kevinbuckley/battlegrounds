# Ralph Loop Backlog

Atomic, single-iteration tasks for the autonomous loop. Pick the
**top unblocked item** that isn't already in `loop-ledger.md`.

Each item must be:
- Doable in one ~15-minute iteration
- Verifiable by `bun test` + a quick browser check
- Scoped narrowly (one minion, one keyword, one UI piece)

Format: `- [ ] [TIER] <one-sentence task>` — `[TIER]` is `S` (small, <30 min),
`M` (medium, ≤1 hr), `L` (large; break it down before picking).

---

## Now (highest priority, model should pick from here first)

### M4 — Effects system (in progress)

- [ ] [S] Add `taunt` keyword to `MinionCard` type and combat targeting (attackers must target taunts first)
- [ ] [S] Add `divineShield` flag handling — first damage instance is absorbed, shield drops
- [ ] [S] Add `windfury` — minion with windfury attacks twice per attack opportunity
- [ ] [S] Add `poisonous` — any damage to a minion from a poisonous attacker kills it
- [ ] [S] Add `reborn` — first time a minion dies, return with 1 HP and lose reborn
- [x] [S] Add `Venomous` — like poisonous but lost after one trigger
- [ ] [M] Wire battlecry hook into `playMinionToBoard` so card battlecries fire
- [ ] [M] Wire deathrattle hook into combat death resolution
- [ ] [M] Wire start-of-combat hook to fire before first attack each combat
- [ ] [S] Test: combat with taunt + non-taunt confirms taunt targeted first
- [ ] [S] Test: divine shield absorbs exactly one damage instance
- [ ] [S] Test: windfury double-attacks
- [ ] [S] Test: poisonous kills 10/10 with 1 damage

### M5 — Tribe minions (one per iteration)

- [ ] [S] Add `Murloc Warleader` (tier 2): adjacent murlocs +2 attack while alive
- [ ] [S] Add `Rockpool Hunter` (tier 1) battlecry: give a friendly murloc +1/+1
- [ ] [S] Add `Vulgar Homunculus` (tier 2): taunt, battlecry deals 2 to your hero
- [ ] [S] Add `Imprisoner` (tier 2): taunt, deathrattle summons a 3/3 imp
- [ ] [S] Add `Annoy-o-Tron` (tier 2): taunt + divine shield
- [ ] [S] Add `Harvest Golem` (tier 2): deathrattle summons a 2/1
- [ ] [S] Add `Kaboom Bot` (tier 2): deathrattle deals 4 damage to a random enemy
- [ ] [S] Add `Spawn of N'Zoth` (tier 2): deathrattle gives all friendly minions +1/+1

### M6 — Heroes (start with passives, no actives yet)

- [ ] [M] Hero type + power interface in `src/game/types.ts` + `src/game/heroes/`
- [ ] [S] Add `Rakanishu` hero — placeholder no-power passive hero
- [ ] [S] Add `Patchwerk` hero — start with 50 HP, no power
- [x] [S] Add `Lich Baz'hial` hero — start with 40 HP, gain 2 gold by losing 3 HP (active)
- [x] [S] Hero select screen: 4 random heroes offered at lobby start
- [x] [S] Test: starting HP/armor matches hero tier (25/30/35/40 + 0/3/5/7/9 armor)

### M8 — UI (visible progress; great for daytime iterations)

- [x] [M] `/game` route renders a placeholder GameState with hero portrait + HP
- [ ] [M] Shop view: 3-slot row showing minion cards (name, attack, hp, tier badge)
- [ ] [M] Buy a minion: click card → moves to hand, gold decremented
- [x] [M] Board view: 7 slots, drag-to-reorder
- [ ] [M] HP/gold/tier HUD top bar
- [ ] [M] Combat animation: read transcript and animate attacks one tick at a time
- [ ] [S] Play minion from hand to board during recruit phase — click to place on empty slot (DONE)
- [x] [M] Wire combat phase into state machine — pair players, resolve fights, apply hero damage, handle eliminations
- [ ] [M] Add hero power UI button during recruit phase — click to use hero power, decrements gold, calls onHeroPower

---

## Soon

### M5 lobby modifiers

- [ ] [L] Tavern spell framework + 3 starter spells
- [ ] [L] Anomaly framework + 3 starter anomalies
- [ ] [L] Trinket framework + between-round pick screen

### M9 — Triples & discovers

- [ ] [M] Triple detection: 3 of same name → auto-merge into golden, discover 1 from next tier
- [ ] [M] Generic discover overlay (used by triples, hero powers, spells)

---

## Done (mirror of `loop-ledger.md` for human readability)

_(populated automatically by the loop)_
