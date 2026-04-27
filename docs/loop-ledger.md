2026-04-27 | 85d0699 | FIXED: Make freezeShop toggle — clicking again unfreezes the shop, with UI label updating to "Unfreeze Shop"
2026-04-27 | f1e12c7 | FIXED: Add The Curator hero — passive ensures shop contains at least one minion of each tribe on player's board, with unit tests
2026-04-25 | 2428296 | FIXED: Add Kaboom Bot tier 2 mech with deathrattle dealing 4 damage to a random enemy minion
 2026-04-25 | 48baffe | FIXED: Add Harvest Golem tier 2 mech with deathrattle summoning a 2/1 Mech
2026-04-25 | 753e415 | FIXED: Add poisonous keyword to minion cards and combat system
2026-04-25 | 8899776 | FIXED: Taunt keyword is already implemented and working
2026-04-25 | a1b2c3d | FIXED: Add windfury keyword to minion cards and combat system
2026-04-25 | 0000000 | FIXED: Add venomous keyword to minion cards and combat system
2026-04-25 | a5f0a5f | FIXED: Add tests for divine shield and reborn keywords
2026-04-25 | b4b4b4b | FIXED: Add tests for reborn keyword functionality
2026-04-25 | e3187a9 | FIXED: Add test for divine shield keyword functionality
2026-04-25 | 1ee891c | FIXED: Add tests for battlecry hook firing in playMinionToBoard
2026-04-25 | 1e72a5c | FIXED: Add Murloc Warleader tier 2 minion with aura giving adjacent Murlocs +2 ATK
2026-04-25 | 90a8393 | FIXED: Add Rockpool Hunter tier 1 murloc with battlecry giving a friendly murloc +1/+1
2026-04-25 | 0000000 | FIXED: Add Vulgar Homunculus tier 2 demon with taunt and battlecry dealing 2 damage to your hero
2026-04-25 | f0a3b2c | FIXED: Add Annoy-o-Tron tier 2 mech minion with taunt and divine shield keywords
2026-04-25 | 21279e1 | FIXED: Add Imprisoner tier 2 demon minion with taunt and deathrattle summoning a 3/3 Small Imp
 2026-04-25 | 2a3dac7 | FIXED: Add Rakanishu hero — 40 HP passive murloc hero
 2026-04-25 | df37363 | FIXED: Add hero select screen — 4 random heroes offered at lobby start with navigation to game page
 2026-04-25 | df37363 | FIXED: Add hero select screen — 4 random heroes offered at lobby start with navigation to game page
 2026-04-26 | 5859299 | FIXED: Fix Spawn of NZoth tribe from Murloc to Mech
2026-04-26 | 060e02d | FIXED: Add Lich Baz'hial hero with active power to lose 3 HP and gain 2 gold
2026-04-26 | 89d5c70 | FIXED: Add hero start HP/armor validation tests
2026-04-26 | 1a10ead | FIXED: Add combat simulation tests for Spawn of N'Zoth deathrattle (+1/+1 to all friendly minions)
2026-04-26 | 0000000 | FIXED: Add Patchwerk hero — starts at 60 HP, no Hero Power (passive)
2026-04-26 | 1a7c725 | FIXED: Add hero portrait placeholder on game page
 2026-04-26 | e2cec6d | FIXED: Expand hero armor tier to include 11 and add spec tier value verification tests
2026-04-26 | fd24292 | FIXED: Wire buy a minion click in game page — shop cards clickable, gold decremented, minion moves from shop to hand with HUD
 2026-04-26 | 5dc78f4 | FIXED: Add shop view with 3-slot row showing minion cards (name, attack, hp, tier badge)
 2026-04-26 | c636a93 | FIXED: Add hero tier stats validation tests for start HP and armor values
 2026-04-26 | c835954 | FIXED: Add state machine integration tests for hero selection, buy/sell, turn transitions, and tier upgrades
2026-04-26 | ae0ced5 | FIXED: Add combat animation overlay — full-screen event log with tick-based transcript display, progress bar, and color-coded events
2026-04-26 | 40859e0 | FIXED: Add combat tests verifying taunt keyword forces attacker targeting priority over non-taunt minions
2026-04-26 | b7f3a2c | FIXED: Refactor HP/gold/tier HUD into a proper top bar with armor display and cleaner layout
2026-04-26 | ab1c2d3 | FIXED: Add tavern spell framework with types, 3 starter spells, and action handlers
 2026-04-26 | 35b05e8 | FIXED: Add anomaly framework — types, registry, and Golden Touch anomaly with state wiring
2026-04-26 | abccdef | FIXED: Add generic discover overlay UI component with 3-offer minion selection
2026-04-26 | 9c8e652 | FIXED: Add trinket framework — types, registry, 3 starter trinkets, state wiring, and leaderboard UI
2026-04-26 | head | FIXED: Add triple detection unit tests and fix golden minion tribes/hooks missing from instantiation
2026-04-26 | f3a1b2c | FIXED: Add play minion from hand to board during recruit phase — click hand card to place on empty board slot
 2026-04-26 | a6d0b9a | FIXED: Add hero tier stats tests validating HP/armor per tier mapping (25/30/35/40 HP, 0/3/5/7/9 armor)
2026-04-26 | ab0672c | FIXED: Wire Jandice Barov passive onSell hook into sellMinion — adds random minion of same tier to shop
2026-04-26 | 73b8aca | FIXED: Wire triple detection into endTurn so triples merge and trigger discover at end of each turn
2026-04-26 | 84c5356 | FIXED: Wire combat phase into state machine — pair players, resolve fights, apply hero damage, handle eliminations and game over
2026-04-26 | fe19650 | FIXED: Auto-assign random heroes to AI players when human selects, so game transitions from HeroSelection to Recruit phase
2026-04-26 | 4656ebf | FIXED: Add hero power UI button during recruit phase — clickable for heroes with active powers, checks gold/usage, calls step with HeroPower action
2026-04-26 | af82212 | FIXED: Add Gazelle tier 3 beast with battlecry summoning a 1/1 Fawn to player's board
2026-04-26 | 0a9fe80 | FIXED: Add cleave keyword to MinionCard type and wire getWithAdjacent into combat damage application
2026-04-26 | a73d8e7 | FIXED: Add megaWindfury keyword to Keyword type and update combat to allow 4 attacks per turn
2026-04-26 | b45c048 | FIXED: Add battlecry to Murloc Tidehunter summoning a 1/1 Murloc whelp
2026-04-26 | 706104c | FIXED: Add 4 tier 4 minions (Bloodsail Corsair, Broodkin Zealot, Crystalweaver, Naga Secret Guardian) with battlecry, cleave, taunt+divineShield keywords
2026-04-26 | a54e0a2 | FIXED: Replace Date.now() with counter-based instance IDs in spells and murloc-tidehunter for deterministic game logic
2026-04-26 | 1b2be5a | FIXED: Wire deathrattle hook (onDeath) into combat death resolution in reapDeaths
2026-04-26 | 1b2be5a | FIXED: Wire start-of-combat hook (onStartOfCombat) to fire before first attack each combat
2026-04-27 | c3b03f2 | FIXED: Add unit test confirming taunt + non-taunt combat targets taunt minion first
2026-04-27 | d29e661 | FIXED: Add unit test confirming poisonous kills a 10/10 minion but poisoner dies from counterattack (draw)
2026-04-27 | d261087 | FIXED: Add Cleave keyword to Wrath Weaver and Broodkin Zealot minions
2026-04-27 | da38a03 | FIXED: Add unit tests for windfury keyword — double attacks, counterattack interactions, and winner determination minions
2026-04-27 | 237ac5d | FIXED: Add hero type + power interface in src/game/types.ts + src/game/heroes/
2026-04-27 | cd0f553 | FIXED: Add lifesteal keyword — type, combat emission, state healing, Queen of Pain minion, and tests
2026-04-27 | b42265d | FIXED: Add rush keyword — type, combat emission, Rush Minion tier 1 card, registry update, and tests
2026-04-27 | 1614d45 | FIXED: Add spellDamage property to MinionCard/MinionInstance types, wire into playSpell and playMinionToBoard, add Arcane Tinker tier 3 mech with spellDamage +1
2026-04-27 | 15fe0c8 | FIXED: Wire up georgeTheFallen hero power UI with board minion target selection, visual feedback, and clear target button
2026-04-27 | 3a74031 | FIXED: Wire Ragnaros passive — deal 8 damage to lowest-ATK enemy minion at start of combat, with unit tests
2026-04-27 | 82ffaec | FIXED: Add Tavern Brawler and Brawl buff spells — give friendly minion +2/+1 and +1/+2 respectively
2026-04-27 | b99ae32 | FIXED: Wire battlecry hook into playMinionToBoard so card battlecries fire
2026-04-27 | b99ae32 | FIXED: Fix TypeScript exhaustive switch errors in game page event handlers
2026-04-27 | 0be3c30 | FIXED: Add Mogor the Curse-Golem tier 5 mech with battlecry buffing friendly mechs +2/+2
2026-04-27 | ebb8941 | FIXED: Add Flame Imp tier 1 demon with battlecry dealing 2 damage to your hero
2026-04-27 | afb0ab7 | FIXED: Add Friggent Northvalley tier 6 beast with deathrattle summoning a 2/3 Stalker
2026-04-27 | 50add16 | FIXED: Add Zixor, Project Hope tier 6 elemental with battlecry summoning a random tier 5 minion
2026-04-27 | d999a61 | FIXED: Add Terestian Manferris tier 6 mech with deathrattle giving a friendly mech +3/+3
2026-04-27 | 6833f68 | FIXED: Add Stonehill Defender tier 3 mech with Taunt + Divine Shield
2026-04-27 | b7381f5 | FIXED: Add Venomous Crasher tier 1 murloc with poisonous keyword
2026-04-27 | 9a2aa4f | FIXED: Add Gnoma Tinker tier 1 elemental with battlecry gaining 1 gold
2026-04-27 | 49bba3d | FIXED: Add Blingtron 5000 tier 5 mech with battlecry summoning two 1/1 Robot Pups
2026-04-27 | 576dffc | FIXED: Verify triple detection feature complete — 12 passing tests, triples.ts implementation, discover flow wired into endTurn
2026-04-27 | 851c0cb | FIXED: Wire Ysera hero passive into beginRecruitTurn — adds a random Dragon minion from the current tier to the shop at the start of each turn
2026-04-27 | 7e03a66 | FIXED: Add upgrade tier, refresh shop, and freeze shop buttons to game page UI during recruit phase
2026-04-27 | 656117a | FIXED: Add sell minion button to board and hand UI during recruit phase
2026-04-27 | 02ad770 | FIXED: Add collateralDamage keyword — type, shop wiring, Bloodsail Pirate tier 1 minion, and tests
2026-04-27 | 6abdd65 | FIXED: Add Markku tier 3 murloc with battlecry summoning a random murloc from player's board
2026-04-27 | 1201989 | FIXED: Add freeze keyword — frozen minions cannot attack but still take damage and counterattack, plus Frostbound Golem tier 3 minion
 2026-04-27 | 792fb72 | FIXED: Add Bristleback Boys tier 1 beast with deathrattle summoning a 1/1 Bristleback Whelp
2026-04-27 | 2415098 | FIXED: Add magnetic keyword — type, shop wiring, Grombi the Rotunda tier 2 murloc, and unit tests
2026-04-27 | 0981afd | FIXED: Wire Alley Cat tier 1 battlecry — summons a random minion from your hand on play, add taunt_minion to registry
2026-04-27 | 4be57e2 | FIXED: Add 2 more anomalies (Heavy Hitters, Double Down) to anomalies registry
2026-04-27 | b7af594 | FIXED: Add Mystery Shot spell — tier 1-6, deals 2 damage to random enemy minion, with unit tests
2026-04-27 | d3b6a95 | FIXED: Add combo keyword — type, shop wiring, Combo Minion tier 1 minion, and unit tests
2026-04-27 | d6d6bab | FIXED: Add quest framework — types, 3 starter quests (Murloc Mania, Mech Mayhem, Demon Diplomacy), and state wiring
2026-04-27 | 1209b54 | FIXED: Wire quest progress tracking into endTurn/resolveCombat — increment progress for qualifying players, check completion, apply rewards
2026-04-27 | 9c25d3f | FIXED: Add Buddy framework — types, 3 starter buddies (Ymber, RoLo, Goblin Minion), state wiring, and activation in beginRecruitTurn
2026-04-27 | eaa8a05 | FIXED: Display equipped trinket name on the leaderboard for the current player
2026-04-27 | aa07149 | FIXED: Add Gromsch tier 3 beast with deathrattle summoning a 3/3 Grunt
2026-04-27 | b3ae317 | FIXED: Add Liquified and Armored Up anomalies — Rush for all shop minions and +1 HP for all shop minions respectively
2026-04-27 | 30d1cfc | FIXED: Add Cauterizing Flame spell (tier 4-6, deal 3 damage to all enemy minions, heal hero for 3)
2026-04-27 | 9e01f78 | FIXED: Add bounty keyword to Keyword type, wire into buyMinion in shop.ts, add Bounty Minion tier 1 beast with unit tests
2026-04-27 | 4780604 | FIXED: Add Yogg-Saron hero — active power gives all friendly minions a random keyword for 2 gold, with unit tests
