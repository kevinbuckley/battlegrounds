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

### Game feel — Economy & turn flow

- [ ] [S] Wire `refresh` button: costs 1 gold, replaces shop minions with a new random set each click
- [ ] [S] Wire `freeze` button: freezes shop minions so they persist to next turn (toggle on/off, free)
- [ ] [S] Wire `upgrade tavern` button: deduct upgrade cost, increment player tier, update shop size
- [ ] [S] Gold-per-turn ramp: player starts with 3 gold on turn 1 and gains +1 per turn up to 10
- [ ] [S] Shop size scaling: tier 1→3 minions, tier 2→4, tier 3→4, tier 4→5, tier 5→6, tier 6→7
- [ ] [S] End Turn button: clicking advances to combat phase then back to next recruit turn
- [ ] [M] Wire sell minion: clicking sell removes minion from board/hand, refunds 1 gold

### Game feel — Combat polish

- [ ] [S] Reborn in combat: when a reborn minion dies it returns to same side with 1 HP and reborn removed
- [ ] [S] Divine shield in combat: first damage instance is absorbed, shield is removed, log the event
- [ ] [S] Test: reborn minion returns at 1 HP after first death, does not return on second death
- [ ] [S] Test: divine shield absorbs first hit, minion survives with full HP, second hit kills normally
- [ ] [M] Board-size cap: enforce max 7 minions on board; prevent play/buy past the limit

### Heroes — New heroes

- [ ] [S] Add `Yogg-Saron` hero — active power: give all friendly minions a random keyword for 2 gold
- [ ] [S] Add `The Curator` hero — passive: shop always contains at least one of each tribe represented on your board
- [ ] [S] Add `King Mukla` hero — passive: start each turn with 1 extra banana in hand (1/1 buff spell)
- [ ] [S] Add `George the Fallen` hero — active: give a friendly minion divine shield for 2 gold

### Minions — Tier 2

- [ ] [S] Add `Selfless Hero` (tier 2): deathrattle gives a random friendly minion divine shield
- [ ] [S] Add `Deflect-o-Bot` (tier 2): mech, divine shield, whenever you play a mech gain +1 ATK
- [ ] [S] Add `Metaltooth Leaper` (tier 2): mech, battlecry give all friendly mechs +2 ATK
- [ ] [S] Add `Knife Juggler` (tier 2): after a friendly minion is summoned, deal 1 damage to a random enemy

### Minions — Tier 3

- [ ] [S] Add `Cobalt Scalebane` (tier 3): dragon, at end of turn give a random friendly minion +3 ATK
- [ ] [S] Add `Soul Juggler` (tier 3): demon, after a friendly demon dies deal 3 damage to a random enemy
- [ ] [S] Add `Infested Wolf` (tier 3): deathrattle summon two 1/1 Spider tokens

### Minions — Tier 4

- [ ] [S] Add `Defender of Argus` (tier 4): battlecry give adjacent minions +1/+1 and taunt
- [ ] [S] Add `Bolvar, Fireblood` (tier 4): paladin, divine shield, whenever a friendly divine shield pops gain +2 ATK
- [ ] [S] Add `Cave Hydra` (tier 4): beast, cleave (hits adjacent minions when attacking)

### Minions — Tier 5

- [ ] [S] Add `Junkbot` (tier 5): mech, whenever a friendly mech dies gain +2/+2
- [ ] [S] Add `Baron Rivendare` (tier 5): deathrattles trigger twice
- [ ] [S] Add `Brann Bronzebeard` (tier 5): battlecries trigger twice

### AI opponents

- [x] [S] Basic AI turn: AI buys the cheapest affordable minion in shop each recruit phase
- [ ] [M] Basic AI board play: AI plays all minions from hand to board at start of combat
- [ ] [S] AI refresh: if AI has gold left and no affordable minion, refresh once

---

## Soon

### Game feel — Discover & triple polish

- [ ] [S] Discover overlay: show 3 real minions from next tier up (not placeholders) when triple fires
- [ ] [S] Animate the triple merge: board minion glows → disappears → golden version appears
- [ ] [M] Golden minion: double the stats, golden border in UI, deathrattle/battlecry triggers twice

### Game feel — Leaderboard & end game

- [ ] [S] Leaderboard: show all 8 players ordered by HP, update after each combat round
- [ ] [S] Elimination: when a player reaches 0 HP, remove them from the lobby and show a "eliminated" badge
- [ ] [S] Victory screen: when one player remains, show winner hero portrait + name full-screen

### More spells

- [ ] [S] Add `Bananas` spell (tier 1-3): give a friendly minion +1/+1
- [ ] [S] Add `Tavern Tipper` spell (tier 2-5): give a random friendly minion +2/+2
- [ ] [S] Add `Swat Team` spell (tier 3-6): summon three 1/1 Recruits with rush

### More anomalies

- [ ] [S] Add `Tavern Discount` anomaly: all minions cost 1 less gold (min 1)
- [ ] [S] Add `Big League` anomaly: all minions start with +1/+1
- [ ] [S] Add `Extra Life` anomaly: each player gets one free revive the first time they reach 0 HP

### More heroes

- [ ] [S] Add `Sindragosa` hero — passive: at end of turn, frozen minions in your shop gain +1/+1
- [ ] [S] Add `Millificent Manastorm` hero — passive: mechs in your shop get +1 ATK
- [ ] [S] Add `Trade Prince Gallywix` hero — active: discover a card from the opponent's last board for 2 gold
- [ ] [S] Add `Jaraxxus` hero — passive: demons in your shop get +1/+1

---

## ♾️ Forever task (backstop — only pick this if every Now and Soon item is ledgered)

- [ ] [∞] **Game feel audit**: load `http://localhost:3000` in the browser, play through a full recruit → combat → recruit cycle, identify ONE thing that feels wrong compared to real Hearthstone Battlegrounds (wrong number, missing feedback, broken flow, incorrect rule), and fix it with a focused code change + test.

---

## Done (mirror of `loop-ledger.md` for human readability)

All entries below are already committed and must not be redone.

- [x] All M4 keywords: taunt, divineShield, windfury, poisonous, reborn, venomous — wired + tested
- [x] Wire battlecry hook into playMinionToBoard
- [x] Wire deathrattle hook into combat death resolution
- [x] Wire start-of-combat hook before first attack
- [x] Murloc Warleader, Rockpool Hunter, Vulgar Homunculus, Imprisoner, Annoy-o-Tron, Harvest Golem, Kaboom Bot, Spawn of N'Zoth, Flame Imp, Venomous Crasher
- [x] Heroes: Rakanishu, Patchwerk, Lich Baz'hial, Ysera, Jandice Barov — with hero select screen + HP/armor tests
- [x] Full UI: game route, shop view, buy minion, board view, HUD, combat animation, sell button, upgrade/refresh/freeze buttons, hero power button, play from hand, leaderboard trinket display
- [x] Combat state machine: pair players, resolve fights, apply damage, handle eliminations
- [x] Triple detection + discover overlay
- [x] Keywords: rush, spellDamage, collateralDamage, freeze, magnetic, combo, cleave, megaWindfury, bounty
- [x] Spells: Mystery Shot, Cauterizing Flame, Tavern Brawl
- [x] Anomalies: Golden Touch, Heavy Hitters, Double Down, Liquified, Armored Up
- [x] Quest framework (Murloc Mania, Mech Mayhem, Demon Diplomacy) + progress tracking
- [x] Buddy framework (Ymber, RoLo, Goblin Minion) + activation
- [x] Trinket framework + leaderboard display
- [x] Minions: Gazelle, Gnoma Tinker, Blingtron 5000, Stonehill Defender, Terestian Manferris, Zixor, Friggent Northvalley, Alley Cat, Markku, Gromsch, Mogor the Curse-Golem, Bristleback Boys, Frostbound Golem, Grombi the Rotunda, Bloodsail Pirate, Combo Minion, Bounty Minion + 4 tier-4 minions
