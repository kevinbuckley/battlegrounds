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

- [x] [S] Add `Sindragosa` hero — file exists at src/game/heroes/sindragosa.ts
- [x] [S] Add `Jaraxxus` hero — file exists at src/game/heroes/jaraxxus.ts
- [x] [S] Add `Trade Prince Gallywix` hero — done
- [x] [S] Add `Edwin VanCleef` hero passive: combo (every 2nd action this turn gives +1/+1 to a random friendly minion) — wired into state.ts incrementActionAndApply, with unit tests
- [ ] [S] Add `Reno Jackson` hero active (5 gold, once per game): make a friendly minion golden
- [x] [S] Add `Maiev Shadowsong` hero active (1 gold): give a shop minion "Dormant for 2 turns, awakens with +3/+3" — file exists at src/game/heroes/maiev-shadowsong.ts

### AI opponents

- [ ] [M] Greedy AI: upgrade tavern tier when it can afford it and board is strong enough — implement as a new `greedy` strategy in `src/ai/heuristics/greedy.ts`
- [ ] [S] AI tier preference: basic AI prefers buying minions that match its existing tribe (first tribe on board) over cheapest minion
- [ ] [M] AI combat board placement: AI orders board minions by ATK descending before combat (attackers positioned optimally)
- [ ] [S] AI play order: AI plays battlecry minions before non-battlecry minions from hand each turn

---

### Game feel — UX polish (no browser needed — verifiable by reading code + bun test)

- [ ] [S] Spell targeting UI: highlight valid board targets when a target-required spell is selected (already gated by NO_TARGET_SPELLS list in app/game/page.tsx)
- [ ] [S] Combat result toast: persist "You took X damage from Y" banner for 3 seconds after combat ends (currently 1 second)
- [ ] [S] Tier-up animation: show a brief flash on the tier indicator when player upgrades tavern tier
- [ ] [S] Sell confirmation: require a second click on the sell button within 1.5s to actually sell (prevent misclicks)

### Combat & engine fixes

- [ ] [S] Combat transcript: include the attacker's and defender's instanceIds in every "attack" event so the UI can highlight which minion is attacking
- [ ] [S] Deathrattle ordering: verify deathrattles fire in left-to-right order on the board, not by death timestamp — add a unit test in tests/combat
- [ ] [S] Cleave hits adjacent only: verify cleave damage hits exactly the two minions adjacent to the defender, not all friendlies — add a unit test
- [ ] [S] Poisonous + Divine Shield interaction: poisonous hit on a divine-shielded minion should pop shield without killing — add a unit test

### More minions (only those NOT yet on disk — verify with `ls src/game/minions/tierN/` first)

- [x] [S] Add `Pack Leader` (tier 2): beast, onShopSummon gives summoned Beast +3 ATK
- [ ] [S] Add `Old Murk-Eye` (tier 4): murloc, +1 ATK for each other murloc on the battlefield (both sides)
- [ ] [S] Add `Drakonid Enforcer` (tier 4): dragon, whenever a friendly minion loses divine shield gain +2/+2
- [ ] [S] Add `Strongshell Scavenger` (tier 5): battlecry give all friendly taunt minions +2/+2
- [x] [S] Add `Foe Reaper 4000` (tier 6): mech, cleave — file exists at src/game/minions/tier6/foe-reaper-4000.ts

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
