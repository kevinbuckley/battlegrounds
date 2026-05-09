# Ralph Loop Backlog

Atomic, single-iteration tasks for the autonomous loop. Pick the
**top unblocked item** that isn't already in `loop-ledger.md` and isn't
in the **Quarantined** section at the bottom.

Each item must be:
- Doable in one ~10-minute iteration
- Verifiable by `bun test` + `bun typecheck` only (no browser)
- Scoped narrowly: one minion, one keyword, one UI piece, one bug

Format: `- [ ] [TIER] <task>` — `[TIER]` is `S` (small, <30 min) or `M` (medium, ≤1 hr).
**Never** `[L]` items in the loop. **Never** "find a bug" / "audit" tasks — they trap the model.

---

## Now — Bugs & missing effects (highest priority)

- [x] [S] Fix `Annihilan Battlemaster` (tier 4 demon, 3/3) — currently empty hooks but should gain +2 ATK each time a friendly Demon attacks; add `onAllyAttack` hook that checks `attacker.tribes.includes("Demon")` and bumps self.atk += 2 and emits a Stat event; verify: [Annihilan, Imp 1/1] vs [5/20] — Imp attacks → Annihilan gains +2 ATK; Annihilan attacking self doesn't trigger; non-Demon ally attack does NOT trigger — src/game/minions/tier4/annihilan-battlemaster.ts + tests/simulation/annihilan-battlemaster.sim.test.ts

- [x] [S] Fix `Crystalweaver` (tier 4, 5/4) — currently empty hooks but should give all friendly Demons +2/+2 on battlecry; add `onBattlecry` hook that finds all board Demons (excluding self) and buffs each +2/+2; emit Stat events; verify: [Demon 1/1] on board → Crystalweaver played → Demon becomes 3/3; non-Demon unchanged; empty board → no buff — src/game/minions/tier4/crystalweaver.ts + tests/shop/crystalweaver.test.ts

- [x] [S] Add tests/simulation/arm-of-the-empire.sim.test.ts — verify Arm of the Empire (tier 3 dragon, 4/5) onAllyAttacked buffs ALL friendly taunt minions +3/+2 when a friendly taunt is attacked; board: [Arm, Righteous Protector 1/1 taunt+divineShield] vs [3/3]; enemy targets Protector (taunt) → Arm fires → Protector gains +3/+2; verify non-taunt allies NOT buffed — tests/simulation/arm-of-the-empire.sim.test.ts

- [x] [S] Add tests/simulation/imp-gang-boss.sim.test.ts — verify Imp Gang Boss (tier 3 demon, 2/4) onDamageTaken summons a 1/1 Imp Demon each time it takes damage; board: [Imp Gang Boss 2/4] vs [2/1, 2/1]; first 2/1 attacks Boss → 1/1 Imp appears; second 2/1 attacks → another Imp; verify survivorsLeft grows; Imps are Demons; board cap of 7 respected — tests/simulation/imp-gang-boss.sim.test.ts

- [x] [S] Add tests/simulation/yo-ho-ogre.sim.test.ts — verify Yo-Ho-Ogre (tier 4 pirate, 2/8) attacks twice in a single turn via the yoHoOgre keyword (wired in combat.ts line 220); board: [Yo-Ho-Ogre] vs [1/1, 1/1]; Ogre's attack turn: kills first 1/1, then immediately attacks again and kills second 1/1; both enemies dead; verify Ogre does NOT double-attack if only 1 enemy remains — tests/simulation/yo-ho-ogre.sim.test.ts

- [x] [S] Add tests/shop/wrath-weaver.test.ts — verify Wrath Weaver (tier 1, 1/3) onTurnEnd deals 1 damage to hero and gives all friendly Demons +2/+2; build state with [Wrath Weaver, Vulgar Homunculus 2/4 Demon] on board; end turn → hero loses 1 HP, Demon becomes 4/6; non-Demons NOT buffed; no Demons on board → only hero takes 1 dmg — tests/shop/wrath-weaver.test.ts

- [x] [S] Add tests/shop/alley-cat.test.ts — verify Alley Cat (tier 1 beast, 1/1) battlecry summons a random minion from your hand to board; play Alley Cat with hand containing minions → random one moves to board; empty hand → no summon; board at 6 minions before play → respects cap 7 — tests/shop/alley-cat.test.ts

- [x] [S] Add tests/shop/hangry-dragon.test.ts — verify Hangry Dragon (tier 2 dragon, 4/4) onTurnStart gives itself +2/+2 if the player won last combat; read hangry-dragon.ts to find exactly which state field tracks win/loss; set that field to indicate win, start next turn → Dragon becomes 6/6; indicate loss → no buff — tests/shop/hangry-dragon.test.ts

- [x] [S] Add tests/shop/menagerie-magician.test.ts — verify Menagerie Magician (tier 4, 4/4) battlecry gives +2/+2 to one Beast, one Dragon, and one Murloc on board; board: [Beast 1/1, Dragon 2/2, Murloc 1/1, Demon 3/3]; play Magician → Beast 3/3, Dragon 4/4, Murloc 3/3; Demon unchanged; board missing a tribe → skips gracefully — tests/shop/menagerie-magician.test.ts

---

## Now — Simulation tests for implemented effects

- [x] [S] Add tests/shop/lightfang-enforcer.test.ts — verify Lightfang Enforcer (tier 5 beast, 4/5) onTurnEnd gives one friendly minion of each distinct tribe +2/+1; board: [Lightfang, Beast 1/1, Mech 2/2, Murloc 1/1]; end turn → Beast 3/2, Mech 4/3, Murloc 3/2; tribeless minion NOT buffed; board with 2 Beasts and 1 Mech → exactly 1 Beast and 1 Mech are buffed — tests/shop/lightfang-enforcer.test.ts

- [x] [S] Add tests/simulation/lich-king.sim.test.ts — verify The Lich King (tier 7 undead, 10/10 taunt) onStartOfCombat gains +1 ATK per other friendly minion; board: [Lich King, 2/2, 3/3] vs [20/20]; Lich King has 12 ATK after startOfCombat; verify Stat event in transcript shows atk=12; solo Lich King → no gain — tests/simulation/lich-king.sim.test.ts

- [x] [S] Add tests/heroes/reno-jackson.test.ts — verify Reno Jackson hero power (5g): call onHeroPower targeting board index 0; board[0] becomes golden (m.golden === true); m.atk and m.hp unchanged; use heroPower helper with state having ≥5 gold and ≥1 board minion — tests/heroes/reno-jackson.test.ts

- [x] [S] Tribe rotation pool test — add describe block in tests/state-machine.test.ts: for seeds 1, 42, 999, call makeInitialState, then verify every minion in every player's initial shop has tribes that are either empty OR have at least one tribe in gameState.tribesInLobby (import MINIONS to look up card tribes from cardId) — tests/state-machine.test.ts

- [x] [S] AI sell-weakest test — add test in tests/ai/greedy-upgrade.test.ts: build a state where AI player has 7 minions (atk+hp ranging 2–10) and gold to buy a new minion; run one AI turn; verify the sold minion is the one with lowest (atk+hp) score, ties broken by highest board index — tests/ai/greedy-upgrade.test.ts

- [x] [S] Add tests/shop/screwjank-clunker.test.ts — verify Screwjank Clunker (tier 3 mech, 3/3) battlecry gives a friendly Mech +2/+2; board: [Mech 1/1, non-Mech 2/2]; play Screwjank → Mech becomes 3/3; non-Mech unchanged; no Mechs → no buff — tests/shop/screwjank-clunker.test.ts

- [x] [S] Add tests/shop/buccaneer.test.ts — verify Buccaneer (tier 3 pirate, 5/3) battlecry gives +1 ATK to a random friendly Pirate; board: [Pirate 2/2, non-Pirate 3/3]; play Buccaneer → Pirate becomes 3/2; non-Pirate unchanged; no other Pirates → no buff; 3 tests — tests/shop/buccaneer.test.ts

- [x] [S] Add tests/shop/coldlight-oracle.test.ts — verify Coldlight Oracle (tier 3 murloc, 2/3) battlecry draws 2 random minions from pool into hand; build state with Oracle in hand and pool seeded at player tier; play Oracle → hand.length increases by 2; each drawn item is a MinionInstance; pool count decreases by 2 — tests/shop/coldlight-oracle.test.ts

- [x] [S] Add tests/simulation/dreadscale.sim.test.ts — verify Dreadscale (tier 8 dragon, 6/6) onDeath deals 2 damage to ALL other minions on both boards; board: [Dreadscale, 1/5 ally] vs [1/5 enemy]; Dreadscale dies → ally takes 2 (1/3), enemy takes 2 (1/3); also verify 1/1 enemies die from 2 dmg; Damage events in transcript — tests/simulation/dreadscale.sim.test.ts

- [x] [S] Add tests/shop/tide-razor.test.ts — verify Tide Razor (tier 3 murloc, 4/4) battlecry gives +1/+1 to a random friendly Murloc on board; board: [Murloc Scout 1/1]; play Tide Razor → Scout becomes 2/2; no Murlocs → no buff; two Murlocs → exactly one gets buffed — tests/shop/tide-razor.test.ts

- [x] [S] Add tests/shop/whelp-smuggler.test.ts — verify Whelp Smuggler (tier 3 dragon, 2/3) onShopSummon gives +2 HP to a random friendly Dragon when a Dragon is played to board; build: [Whelp Smuggler, Dragon 1/3] on board; play another Dragon → first Dragon becomes 1/5; playing a non-Dragon → no buff — tests/shop/whelp-smuggler.test.ts

---

## Soon — Content depth

- [ ] [S] Add 3 new trinkets — `golden_scales` (random friendly minion +3/+3 and divineShield), `demonic_pact` (all friendly Demons +1 ATK), `beastly_tooth` (all friendly Beasts +2 ATK); add to TRINKETS registry; write 3 describe blocks in src/game/trinkets.test.ts verifying each onApply mutates board correctly — src/game/trinkets/index.ts + src/game/trinkets.test.ts

- [ ] [S] Add 3 new anomalies — `big_stats` (all shop minions +2/+2 on setup), `pirate_cove` (all Pirates in shop +2 ATK on setup), `undead_plague` (all minions gain reborn on setup); export and register in ANOMALIES; create src/game/anomalies/anomalies.test.ts with 3 tests verifying each onSetup — src/game/anomalies/index.ts + tests

- [ ] [S] Add `Dragon Diplomacy` quest — trigger: win 3 combats while having 3+ Dragons on board; reward: all friendly Dragons +3/+3; onProgress checks dragon count and combat win; isComplete when progress >= 3; add to QUESTS; 2 tests — src/game/quests/index.ts + src/game/quests.test.ts

- [ ] [S] Add `Beast Mastery` quest — trigger: sell 4 Beasts from board (onSell hook); reward: all friendly Beasts +2/+2; onProgress increments when a Beast is sold; add to QUESTS; 2 tests verifying progress and reward — src/game/quests/index.ts + src/game/quests.test.ts

- [ ] [M] Fix quest win-detection in processQuests — onProgress in murlocMania/mechMayhem/demonDiplomacy uses flawed board-HP heuristics instead of actual combat result; rewrite processQuests in state.ts to pass the CombatResult winner field into quest progress calls; update all 4 quest cards' onProgress signatures to accept `winner: Side | "draw"`; add 2 regression tests — src/game/state.ts + src/game/quests/index.ts + src/game/quests.test.ts

---

## Soon — UI improvements

- [ ] [S] Show active tribes in HUD — add an "Active Tribes" row in app/game/page.tsx HUD showing the 5 tribe names from `gameState.tribesInLobby` as small slate-700 pills with text-xs; position it below the tier indicator row; bun typecheck must pass — app/game/page.tsx

- [ ] [S] Show active anomaly in HUD — if `gameState.modifierState.anomaly` is set, show the anomaly name as an amber badge in the HUD with a `title` tooltip showing its description; add a `getAnomaly(id)` export to anomalies/index.ts; bun typecheck — app/game/page.tsx + src/game/anomalies/index.ts

- [ ] [S] Show quest progress in HUD — if `player.quests[0]` exists, show "Quest: <name> N/M" below the hero power button; a thin amber div with width proportional to progress/target; completed shows "✓ Done" in green; look up name via QUESTS[quest.cardId]; bun typecheck — app/game/page.tsx

---

## Soon — AI improvements

- [x] [M] AI tribe synergy scoring — replace `matchingTribeIndex` in basic.ts with `scoreBuy(minion, board)`: +3 for completing a triple, +2 for matching primary board tribe, +1 for any board tribe, 0 otherwise; rank all affordable shop minions by score and buy the highest-scored one; add a test: AI with Murloc board prefers a Murloc over same-cost non-Murloc — src/ai/heuristics/basic.ts + tests/ai/greedy-upgrade.test.ts

- [x] [S] AI sells weakest minion when board full — read sell-to-make-room logic in basic.ts; if it doesn't score before selling, update it to sell the board minion with lowest (atk+hp) score; ties broken by highest board index; add a test: AI with 7 minions buys a high-stat minion → weakest is sold — src/ai/heuristics/basic.ts + tests/ai/greedy-upgrade.test.ts

---

## Soon — Engine correctness

- [x] [S] Add tests/simulation/lich-king.sim.test.ts — verify The Lich King (tier 7 undead, 10/10 taunt) onStartOfCombat gains +1 ATK per other friendly minion; board: [Lich King, 2/2, 3/3] vs [20/20]; Lich King has 12 ATK after startOfCombat; verify Stat event shows atk=12; solo Lich King → no gain — tests/simulation/lich-king.sim.test.ts

- [x] [S] Add tests/simulation/deathwing.sim.test.ts — verify Deathwing (tier 8 dragon, 10/10) onDeath destroys ALL other minions on both boards; board: [Deathwing, 5/5] vs [3/3, 3/3]; Deathwing dies → all 4 other minions die; transcript has Deaths for all; final board empty — tests/simulation/deathwing.sim.test.ts

- [x] [S] Tribe rotation pool test — in tests/state-machine.test.ts add a describe block: for 3 different seeds, call makeInitialState, read tribesInLobby, then verify every minion in every player's shop has tribes that are either empty (tribeless) OR intersect tribesInLobby — tests/state-machine.test.ts

---

## Quarantined (failed multiple times — DO NOT pick)

- [ ] [S] Add `Trade Prince Gallywix` hero test — verify hero power gives 1 gold back when a minion is bought from the shop — tests/heroes/trade-prince-gallywix.test.ts  <!-- failed iterations 7, 8, 9, 10 -->

---

## Done (completed — do NOT redo)

- [x] All 16 combat keywords: taunt, divineShield, windfury, megaWindfury, poisonous, reborn, venomous, cleave, lifesteal, rush, freeze, collateralDamage, magnetic, combo, bounty, spellDamage, dormant, yoHoOgre
- [x] Full hook system: onBattlecry, onSell, onBuy, onTurnStart, onTurnEnd, onPlay, onStartOfCombat, onAttack, onAllyAttack, onAttacked, onDeath, onAllyDeath, onSummon, onDivineShieldPop, onDamageTaken, onCast, onSpellPlay, onShopSummon, onRecruitSummon, onHeroDamaged, onAllyKill, onAllyAttacked, getTarget
- [x] Minions (tier 1): Alley Cat, Bloodsail Pirate, Boarlog Captain, Bristleback Boys, Deck Swabbie, Dragonspawn Lieutenant, Dredgrot Whelp, Fiendish Servant, Flame Imp, Gazelle, Gnoma Tinker, Mecharoo, Micro Machine, Murloc Knight, Murloc Scout, Murloc Tidecaller, Murloc Tidehunter, Murloc Tinyfin, Righteous Protector, Rockpool Hunter, Sellemental, Shifter Zerus, Venomous Crasher, Windfury Minion, Wrath Weaver
- [x] Minions (tier 2): Annoy-o-Tron, Deflect-o-Bot, Glyph Guardian, Hangry Dragon, Harvest Golem, Imprisoner, Kaboom Bot, Knife Juggler, Metaltooth Leaper, Murloc Warleader, Nightmare Amalgam, Pack Leader, Pogo-Hopper, Rat Pack, Scavenging Hyena, Selfless Hero, Spawn of N'Zoth, Swat Recruit, Unstable Ghoul, Vulgar Homunculus
- [x] Minions (tier 3): Arcane Tinker, Arm of the Empire, Bloodsail Cannoneer, Bronze Warden, Buccaneer, Cobalt Scalebane, Coldlight Oracle, Coldlight Seer, Frost Elemental, Grimspeaker, Grombi the Rotunda, Gromsch, Houndmaster, Imp Gang Boss, Infested Wolf, Lil' Exorcist, Markku, Queen of Pain, Screwjank Clunker, Scurpus, Soul Devourer, Soul Juggler, Southsea Captain, Southsea Strongarm, Stonehill Defender, Tide-Razor, Tortollan Shellraiser, Whelp Smuggler
- [x] Minions (tier 4): Annihilan Battlemaster, Blingtron 4000, Bloodsail Corsair, Bolvar Fireblood, Boulderfog Ogre, Broodkin Zealot, Cave Hydra, Crystalweaver, Defender of Argus, Drakonid Enforcer, Floating Watcher, Houndmaster Shaw, Menagerie Magician, Naga Secret Guardian, Old Murk-Eye, Ripsnarl Captain, Security Rover, Siegebreaker, Toxfin, Virmen Sensei, Yo-Ho-Ogre
- [x] Minions (tier 5): Alexstrasza, Baron Rivendare, Bigfernal, Blingtron 3000, Blingtron 5000, Brann Bronzebeard, Goldrinn, Junkbot, Khadgar, Lil' Rag, Lightfang Enforcer, Maexxna, Mal'Ganis, Mechano-Egg, Mogor, Murozond, Strongshell Scavenger, Voidlord, Zapp Slywick
- [x] Minions (tier 6): Amalgadon, Elistra, Foe Reaper 4000, Gentle Megasaur, Ghastcoiler, Imp Mama, Kalecgos, King of Beasts, Mama Bear, Nadina, Razorgore, Sneed's Old Shredder, Ysera the Dreamer
- [x] Minions (tier 7): The Lich King
- [x] Minions (tier 8): Alexstrasza Selfless Dragon, Deathwing, Deathwing Raze-to-Bone, Dreadscale, Old Murk-Eye (t8), Ysera the Dreamer (t8)
- [x] Heroes (21): AF Kay, Edwin Van Cleef, George the Fallen, Jandice Barov, Jaraxxus, King Mukla, Lich Baz'hial, Maiev Shadowsong, Millificent Manastorm, Patchwerk, Pyramad, Ragnaros, Rakanishu, Reno Jackson, Scabbs Cutterbutter, Sindragosa, Sir Finley, The Curator, Trade Prince Gallywix, Yogg-Saron, Ysera
- [x] Modifier systems: anomalies (8), spells (11), trinkets (3), quests (4 incl. Petrified Imps), buddies (3 generic)
- [x] Full game loop: hero select, shop/recruit phase, combat animation, leaderboard, game over
- [x] Combat engine: all keyword interactions, deathrattle chains, transcript emission, reborn, windfury, cleave, poisonous, lifesteal, magnetic, bounty
- [x] Economy: gold ramp, tier costs, discount curves, pool depletion, tribe rotation (5 of 10)
- [x] AI: 7 opponents, tribe synergy preference, sell-to-make-room, hero power usage, freeze heuristic, greedy upgrade
- [x] UI: speed toggle, skip button, ghost fight label, victory/defeat banners, elimination toasts, spacebar to end turn, hero power description, minion tooltips, tier-up animation, sell undo
- [x] serializeReplay / deserializeReplay (tests/replay.test.ts)
- [x] Simulation tests: baron-rivendare, brann, cave-hydra, cobalt-scalebane, deathwing, drakonid-enforcer, fiendish-servant, glyph-guardian, goldrinn, ghastcoiler, houndmaster-shaw, imp-mama, infested-wolf, junkbot, kaboom-bot, khadgar, king-of-beasts, knife-juggler, lil-exorcist, malganis, mama-bear, mechano-egg, micro-machine, murloc-warleader, nadina, old-murk-eye, pogo-hopper, rat-pack, razorgore, ripsnarl-captain, scavenging-hyena, scurpus, security-rover, selfless-hero, siegebreaker, soul-devourer, soul-juggler, southsea-captain, spawn-of-nzoth, unstable-ghoul, voidlord, zapp-slywick
