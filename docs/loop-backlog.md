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

- [ ] [S] Game feel audit: open http://localhost:3000, play one turn, find and fix one broken or missing behaviour (stuck since 2026-04-30, snap 969181ffbd80853809f3099933d982541d7846b9)

- [x] [S] Game feel audit: open http://localhost:3000, play one turn, find and fix one broken or missing behaviour (stuck since 2026-04-29, snap cca6d3729e77e6ccbda3001fd3ad0cd011d2348f)

### Game feel — End game & UI polish

- [ ] [S] Victory screen: when `gameState.phase.kind === "GameOver"` render a full-screen overlay showing the winner's hero name and a "Play Again" button that resets to hero selection
- [ ] [S] Pairing display: show a "You're fighting: <opponent hero name>" banner during combat phase in the game UI
- [ ] [S] Hero damage recap: after combat, show a toast/banner "You took X damage from <opponent>" before returning to recruit

### More spells

- [x] [S] Add `Swat Team` spell (tier 3-6, cost 3): summon three 1/1 Recruits with rush on player's board
- [ ] [S] Add `Tavern Brawl` spell (tier 2-4, cost 2): give a friendly minion +2/+1 — verify it doesn't duplicate the already-registered `tavernBrawler` spell

### More anomalies

- [ ] [S] Add `Tavern Discount` anomaly: all minions in shop cost 1 less gold (min 1) — wire into `rollShopForPlayer`
- [ ] [S] Add `Big League` anomaly: all minions start combat with +1/+1 — wire into `simulateCombat` start
- [ ] [S] Add `Extra Life` anomaly: each player gets one free revive the first time they reach 0 HP — wire into `applyDamageToPlayer`

### More heroes

- [ ] [S] Add `Sindragosa` hero — passive `onTurnEnd`: frozen minions in your shop each gain +1/+1
- [ ] [S] Add `Jaraxxus` hero — passive `onTurnStart`: demons in your shop get +1/+1 at start of recruit turn
- [x] [S] Add `Trade Prince Gallywix` hero — active (2 gold): discover one minion from the opponent's last-seen board and add it to hand

### Minions — Tier 6

- [ ] [S] Add `Kalecgos, Arcane Aspect` (tier 6): dragon, after you cast a spell give all friendly minions +1/+1
- [ ] [S] Add `Ghastcoiler` (tier 6): beast, deathrattle summon two random deathrattle minions
- [ ] [S] Add `Mama Bear` (tier 6): beast, whenever a beast is summoned on your side give it +5/+5
- [ ] [S] Add `Gentle Megasaur` (tier 6): beast, battlecry give all friendly murlocs a random keyword

### AI opponents

- [ ] [M] Greedy AI: upgrade tavern tier when it can afford it and board is strong enough — implement as a new `greedy` strategy in `src/ai/heuristics/greedy.ts`
- [ ] [S] AI tier preference: basic AI prefers buying minions that match its existing tribe (first tribe on board) over cheapest minion
- [ ] [M] AI combat board placement: AI orders board minions by ATK descending before combat (attackers positioned optimally)

---

## Soon

### Game feel — Spells & discover polish

- [ ] [S] Spell targeting UI: after clicking a spell in hand, highlight valid board targets and require a click to cast; currently spells fire immediately
- [x] [S] Discover shows real next-tier minions: verify that when a triple fires, the discover overlay offers 3 minions from tier+1 (not from the pool at large) — verified, triples.ts correctly filters by tier+1
- [x] [S] Game feel audit: onTurnEnd hooks and hero passives now fire for all players, not just player 0
- [ ] [S] Add `Bananas` spell to shop rolls — verify it appears in the shop (it exists as `bananaSpell` in registry but may not be offered in shop rolls)

### More minions — Tier 1

- [ ] [S] Add `Wrath Weaver` (tier 1): at end of turn, deal 1 damage to your hero and give all friendly demons +2/+2
- [x] [S] Add `Scavenging Hyena` (tier 1): beast, whenever a friendly beast dies gain +2/+1
- [ ] [S] Add `Murloc Tidecaller` (tier 1): murloc, whenever a murloc is summoned on either side gain +1 ATK
- [ ] [S] Add `Murloc Tidehunter` (tier 1): murloc battlecry summon a 1/1 Murloc Scout

### More minions — Tier 2

- [ ] [S] Add `Glyph Guardian` (tier 2): dragon, whenever this minion attacks, give it +2 ATK
- [ ] [S] Add `Unstable Ghoul` (tier 2): undead, taunt, deathrattle deal 1 damage to all minions

### More minions — Tier 3

- [ ] [S] Add `Arcane Tinker` (tier 3): elemental, battlecry add +1 spell damage to your hero power until end of turn
- [ ] [S] Add `Coldlight Seer` (tier 3): murloc, battlecry give all friendly murlocs +2 HP
- [x] [S] Add `Screwjank Clunker` (tier 3): mech, battlecry give a friendly mech +2/+2

### More minions — Tier 4

- [ ] [S] Add `Virmen Sensei` (tier 4): dragon, battlecry give a friendly dragon +2/+2
- [x] [S] Add `Security Rover` (tier 4): mech, whenever this minion takes damage summon a 2/3 Bot with divine shield
- [x] [S] Add `Annihilan Battlemaster` (tier 4): demon, gains +1 ATK for each damage your hero has taken

### More minions — Tier 5

- [ ] [S] Add `Murozond` (tier 5): dragon, battlecry add a copy of an enemy minion to your hand
- [ ] [S] Add `Lightfang Enforcer` (tier 5): at end of turn, give a friendly minion of each tribe +2/+1

### AI improvements

- [ ] [M] AI combat board placement: AI orders board minions by ATK descending before combat (attackers positioned optimally)

---

## ♾️ Forever task (backstop — only pick this if every Now and Soon item is ledgered)

- [ ] [∞] **Game feel audit**: load `http://localhost:3000` in the browser, play through a full recruit → combat → recruit cycle, identify ONE thing that feels wrong compared to real Hearthstone Battlegrounds (wrong number, missing feedback, broken flow, incorrect rule), and fix it with a focused code change + test.

---

## Done (mirror of `loop-ledger.md` for human readability)

All entries below are already committed and must not be redone.

- [x] All keywords: taunt, divineShield, windfury, megaWindfury, poisonous, reborn, venomous, cleave, lifesteal, rush, freeze, collateralDamage, magnetic, combo, bounty, spellDamage — wired + tested
- [x] Wire battlecry hook into playMinionToBoard
- [x] Wire deathrattle hook (onDeath) into combat death resolution
- [x] Wire start-of-combat hook (onStartOfCombat) before first attack
- [x] Wire onDivineShieldPop hook into combat applyDamage
- [x] Gold-per-turn ramp: starts at 3 gold turn 1, +1/turn up to 10 (economy.ts `baseGoldForTurn`)
- [x] Shop size scaling by tavern tier: 3/4/4/5/6/7 (economy.ts `SHOP_SIZE_BY_TIER`)
- [x] Board size cap: max 7 minions enforced in shop.ts playMinionToBoard
- [x] Reborn in combat: reborn minion returns at 1 HP with reborn removed (combat.ts)
- [x] Divine shield in combat: first damage absorbed, shield removed, event logged (combat.ts)
- [x] Reborn + divine shield unit tests
- [x] Full UI: game route, shop view, buy minion, board view, HUD with armor, combat animation, sell button, upgrade/refresh/freeze buttons, hero power button, play from hand, leaderboard with elimination badges + trinket display
- [x] End Turn button: advancing combat → back to recruit (EndTurn action in state machine)
- [x] Combat state machine: pair players, resolve fights, apply damage, handle eliminations and GameOver
- [x] Triple detection + discover overlay
- [x] Triple merge animation (golden minion pulse glow)
- [x] Golden minion: deathrattle and battlecry trigger twice
- [x] Heroes: Rakanishu, Patchwerk, Lich Baz'hial, Ysera, Jandice Barov, Yogg-Saron, The Curator, King Mukla, George the Fallen, Ragnaros, Sir Finley, Scabbs Cutterbutter, AF Kay, Edwin Van Cleef, Millificent Manastorm, Trade Prince Gallywix — with hero select screen + HP/armor tests
- [x] Hero power UI with active targeting (George the Fallen board target selection)
- [x] Leaderboard: 8 players ordered by HP, current player highlighted, elimination badges, trinket display
- [x] Spells framework + Mystery Shot, Cauterizing Flame, Tavern Brawler, Brawl, Tavern Tipper, Bananas (bananaSpell)
- [x] Anomalies framework + Golden Touch, Heavy Hitters, Double Down, Liquified, Armored Up
- [x] Quest framework (Murloc Mania, Mech Mayhem, Demon Diplomacy) + progress tracking wired into endTurn
- [x] Buddy framework (Ymber, RoLo, Goblin Minion) + activation in beginRecruitTurn
- [x] Trinket framework + leaderboard display
- [x] Tier 1 minions: Alley Cat, Bloodsail Pirate, Bounty Minion, Bristleback Boys, Combo Minion, Dragonspawn Lieutenant, Flame Imp, Gnoma Tinker, Murloc Tidecaller, Murloc Tidehunter, Rockpool Hunter, Rush Minion, Taunt Minion, Venomous Crasher, Windfury Minion, Wrath Weaver
- [x] Tier 2 minions: Annoy-o-Tron, Deflect-o-Bot, Glyph Guardian, Grombi the Rotunda, Harvest Golem, Imprisoner, Kaboom Bot, Knife Juggler, Metaltooth Leaper, Murloc Warleader, Reborn Minion, Scavenging Hyena, Selfless Hero, Spawn of N'Zoth, Unstable Ghoul, Vulgar Homunculus
- [x] Tier 3 minions: Arcane Tinker, Cobalt Scalebane, Frostbound Golem, Gazelle, Gromsch, Infested Wolf, Markku, Queen of Pain, Soul Juggler, Stonehill Defender
- [x] Tier 4 minions: Bloodsail Corsair, Bolvar Fireblood, Broodkin Zealot, Cave Hydra, Crystalweaver, Defender of Argus, Naga Secret Guardian
- [x] Tier 5 minions: Baron Rivendare, Blingtron 5000, Brann Bronzebeard, Junkbot, Mogor the Curse-Golem
- [x] Tier 6 minions: Friggent Northvalley, Terestian Manferris, Zixor Project Hope
- [x] AI: basic strategy (buy cheapest affordable, refresh if no affordable, play all to board, EndTurn)
