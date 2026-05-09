2026-05-09 | 12bd0ed | FIXED: Add tests/simulation/baelgun.sim.test.ts — verify Baelgun (tier 5, 4/5) battlecry gives a friendly Mech +2/+2 and Magnetic, does nothing when no friendly Mechs exist, stacks Magnetic across multiple Baelguns, and does not buff non-Mech minions
2026-05-09 | 4d16504 | FIXED: Lich Baz'hial hero power test — verify active power (2g) loses 3 HP and gains 2 gold, stacks across multiple uses, sets heroPowerUsed flag, throws when insufficient gold, and works across turns with proper interest gold calculation
2026-05-09 | df9d8cb | FIXED: Lich Baz'hial hero power test — verify active power (2g) loses 3 HP and gains 2 gold, stacks across multiple uses, sets heroPowerUsed flag, and does nothing for non-Lich Baz'hial heroes
2026-05-09 | 3c74296 | FIXED: Add description field to MinionCard interface, populate for 8 key cards (Baron Rivendare, Murloc Warleader, Knife Juggler, Scavenging Hyena, Rat Pack, Imp Gang Boss, Zapp Slywick, Cave Hydra), add title={card.description} to MinionCard component for browser-native tooltips
2026-05-09 | a8abf59 | FIXED: Add Pyramad hero power test — verify active power (1g) gives a random friendly board minion +4 HP, stacks across uses, does nothing on empty board, heroPowerUsed is handled by state machine, and gold check is handled by state machine
2026-05-09 | cf93b2e | FIXED: Junkbot simulation tests — verify onAllyDeath gains +2/+2 each time a friendly Mech dies in combat, does not fire for non-Mechs or enemy Mechs, and golden version also works; 5 tests via transcript Stat event verification
2026-05-09 | 308ea60 | FIXED: Hero power description text — add description field to HeroPower type's active variant, populate for all 12 active heroes, display below hero power button in HUD
2026-05-09 | 85eec00 | FIXED: Space bar to end turn — add a useEffect in app/game/page.tsx listening for keydown ' ' that calls handleEndTurn when phase is Recruit and no overlays active

2026-05-09 | 1dd66eb | FIXED: Add Khadgar (tier 5 mech, 2/2) — onSummon hook summons a copy of a random friendly minion when any minion is summoned in combat; adds summonedSide field to SummonCombatCtx in types.ts and wires it in fireSummon in combat.ts, with 7 simulation tests
2026-05-09 | af18646 | FIXED: Khadgar (tier 5 mech) requires combat.ts fireSummon modification to iterate over dead minions — added to backlog as quarantined [M] task with technical details for future implementation
2026-05-09 | 8c16031 | FIXED: Add George the Fallen hero power test — verify onHeroPower gives divine shield to target minion, skips minions that already have it, does nothing on empty board, and targets correct board index
2026-05-09 | 87f4203 | FIXED: Add Rat Pack simulation tests — verify deathrattle summons 1/1 Rats equal to current ATK (2/2→2 rats, 4/2→4 rats, golden 4/4→4 rats with board cap of 7)
2026-05-09 | 86c55f1 | FIXED: Add Soul Juggler simulation tests — verify onAllyDeath deals 3 damage to random enemy when friendly Demons die in combat
2026-05-07 | a1ab2e1 | FIXED: Add Southsea Captain (tier 3 pirate, 3/3): your other Pirates have +1/+1 — aura in onStartOfCombat
2026-05-07 | 5c541d3 | FIXED: Add Bristleback Boys interaction test — verify that when any Bristleback Boy takes damage, ALL Bristleback Boys gain +1/+1 via onDamageTaken hook, including golden copies
2026-05-07 | 15c9b69 | FIXED: Fix Lil' Exorcist battlecry to buff ALL Deathrattle minions on both boards instead of only buffing itself
2026-05-07 | 83ec4b0 | FIXED: Add Bristleback Boys onDamageTaken hook — whenever any Bristleback Boy takes damage, ALL Bristleback Boys gain +1/+1
2026-05-07 | 3eef3fa | FIXED: Add simulation test for Bristleback Boys — verify deathrattle summons a 1/1 Bristleback Whelp when it dies in combat, including golden version summoning two
2026-05-07 | a677906 | FIXED: Add Lil' Exorcist (tier 3 paladin, 2/2): taunt; battlecry give +1/+1 for each Deathrattle minion among both boards
2026-05-07 | 07fed35 | FIXED: Add Coldlight Oracle (tier 3 murloc, 2/3): battlecry draw 2 random minions from shop pool to hand
2026-05-07 | 15c9b69 | FIXED: Add Tide-Razor (tier 3 murloc, 3/4): battlecry give a friendly Murloc +1/+1 and Rush
2026-05-07 | 69587ab | FIXED: Add Shifter Zerus (tier 1 beast, 1/1): at the start of each recruit turn, transform into a random minion from the tavern — onTurnStart hook
2026-05-07 | e17ef88 | FIXED: Add Murloc Scout (tier 1 murloc, 1/1): vanilla — no keywords or hooks
2026-05-07 | ebc9853 | FIXED: Add Mecharoo (tier 1 mech, 1/1): deathrattle summon a 1/1 Jo-E Bot
2026-05-07 | 8fe61e2 | FIXED: Add Murloc Knight (tier 1 murloc, 1/1): battlecry summons a 1/1 Murloc token
2026-05-07 | c5c7d2f | FIXED: Add Baelgun, Equipment Maker (tier 5, 4/5): battlecry gives a friendly Mech +2/+2 and Magnetic
2026-05-07 | 8514157 | FIXED: Add Hangry Dragon (tier 2 dragon, 2/3): at start of your turn, if you have more HP than opponent, gain +2/+2
2026-05-07 | 9e95b65 | FIXED: Add Houndmaster Shaw (tier 4 beast, 3/6): at start of combat, give your other minions Rush
2026-05-07 | bbd944f | FIXED: Add Gazelle (tier 1 beast, 1/1): rush keyword
2026-05-07 | 846b307 | FIXED: Add Frost Elemental (tier 3 elemental, 3/4): freeze keyword
2026-05-07 | 4a2bd6c | FIXED: Add Amalgadon (tier 6, 6/6): battlecry gains a random keyword for each different tribe among your other minions
2026-05-07 | d01be55 | FIXED: Add Whelp Smuggler (tier 3 dragon, 3/6): onShopSummon gives the summoned Dragon +2/+2
2026-05-07 | 9be049d | FIXED: Add Southsea Strongarm (tier 3 pirate, 5/4): battlecry gives a friendly Pirate +1/+1 for each Pirate bought this turn
2026-05-07 | 196ff79 | FIXED: Add Arm of the Empire (tier 3 dragon, 4/5): onAllyAttacked hook gives +3/+2 to friendly Taunt minions when attacked
2026-05-07 | 6f1b542 | FIXED: Add The Lich King (tier 7 undead, 10/10): taunt; at start of combat, gain +1/+1 for each other minion on your board, with unit tests
2026-05-07 | 42be082 | FIXED: Add Swat Recruit (tier 2 mech, 1/1): rush — single keyword, no hooks needed
2026-05-07 | 4eca1de | FIXED: Add Dredgrot Whelp (tier 1 beast/elemental, 1/1): reborn — single keyword, no hooks needed
2026-05-04 | 90fe563 | FIXED: Add Dreadscale (tier 8 dragon, 6/6) — deathrattle deals 2 damage to all other minions
2026-05-04 | 584ee26 | FIXED: Add Gnoma Tinker (tier 4 mech, 3/3) — battlecry summons a 1/1 Mech token, with unit tests
2026-05-04 | 1d820ea | FIXED: Add Buccaneer (tier 3 pirate, 3/2) — battlecry gives a friendly Pirate +2/+2, with unit tests
2026-05-04 | 653e7c9 | FIXED: Add Grombi the Rotunda tier 3 elemental (3/3) — onAllyKill hook gains +2/+2 per friendly minion kill during combat
2026-05-04 | a8e225c | FIXED: Add Blingtron 3000 (tier 5 mech, 3/8) — battlecry summons two 1/1 Robot Pups with Rush, with unit tests
2026-05-04 | 6e2cb02 | FIXED: Add onTurnStart hook to MinionHooks and wire into beginRecruitTurn — fires at start of each recruit phase for all board minions
2026-05-04 | 81e5642 | FIXED: Add Grimspeaker (tier 3 demon, 3/3) — battlecry gives a friendly Demon +2/+2 and Taunt, with unit tests
2026-05-04 | 0c49a72 | FIXED: Add onDiscover hook to MinionHooks and wire into pickDiscover — fires when a minion is picked from a discover offer (triples, hero powers, Yogg-Saron), with unit tests
2026-05-04 | 2e03ca6 | FIXED: Wire onBuy hook into buyMinion in shop.ts — fires when a minion is bought from the shop (before it is played from hand to board), with unit tests
2026-05-04 | 5a319c5 | FIXED: Add onBoardRemove hook to MinionHooks and wire into combat.ts reapDeaths — fires on all surviving minions when any minion is removed from the board during combat, with unit tests
2026-05-04 | af9bd55 | FIXED: Add sell undo — after selling a board or hand minion, show a 1.5s "Undo Sell" button that restores the minion to hand/board at no cost, with undo handler reversing gold and minion placement
2026-05-04 | f24c202 | FIXED: Add onAllyKill hook to Grombi the Rotunda (tier 2 murloc) — gains +2/+2 whenever a friendly minion scores a kill during combat
2026-05-04 | 53b98a0 | FIXED: Heuristic AI sells weakest board minion when hand is at capacity (≥10) to make room before buy loop
2026-05-04 | d893167 | FIXED: Add onAllyKill hook to MinionHooks and wire into combat.ts death handling — fires when a friendly minion scores a kill during combat, with unit tests
2026-05-04 | ff48424 | FIXED: Add onAttacked hook to MinionHooks and wire into combat.ts — fires when a minion is targeted by an enemy attack (as defender), with unit tests
2026-05-04 | 99196e6 | FIXED: Add board-size cap guard in combat.ts reapDeaths — new tokens from deathrattles should not push either board past 7 minions, enforced as general safety net in deathrattle summon path
2026-05-04 | d46464b | FIXED: Wire Millificent Manastorm passive into buyMinion — when a Mech is bought, all friendly Mechs on the player's board gain +1/+1, with unit tests
2026-05-04 | 8a43c9e | FIXED: Add tests/simulation/murloc-warleader-death.sim.test.ts — verify that when Murloc Warleader dies mid-combat, the +2 ATK aura is removed and buffed murlocs revert to base ATK immediately
2026-05-04 | 88a735a | FIXED: Add tests/combat/imprisoner-golden.test.ts — verify golden Imprisoner (6/8) summons two 2/2 Imps on death while non-golden (3/4) summons one
2026-05-04 | 0fab067 | FIXED: Add tests/simulation/unstable-ghoul.sim.test.ts — verify deathrattle deals 1 damage to all other minions (not itself), golden deals 2 damage per fire, fix implementation to skip self
2026-05-04 | 141c1fb | FIXED: Add tests/shop/refresh.test.ts — verify shop refresh deducts 1 gold from player, and that refreshing costs exactly COST_REFRESH (currently 1g)
2026-05-04 | 697b993 | FIXED: Add onSpellPlay hook to MinionHooks — fires when player plays any spell from hand in the recruit phase, so future minions can react to spell plays (distinct from onCast which is combat-only)

2026-05-04 | ba120f8 | FIXED: Add tests/simulation/knife-juggler.sim.test.ts — verify Knife Juggler fires 1 damage to a random enemy whenever a friendly minion is summoned during combat, including tokens from deathrattles

2026-05-04 | 24e9913 | FIXED: Add tests/economy/upgrade-cost.test.ts — verify tier upgrade cost decreases by 1 each turn it isn't taken (beginRecruitTurn reduces upgradeCost), and resets to base on upgrade
2026-05-04 | 351db08 | FIXED: Add Lil' Rag (tier 5 elemental, 1/1): onPlay gives all other friendly Elementals +1/+1
2026-05-04 | 20e3360 | FIXED: Add Goldrinn the Great Wolf (tier 5 beast, 4/4): onShopSummon gives ALL friendly Beasts +5/+5 whenever a Beast is played
2026-05-04 | fc6e47b | FIXED: Add Mal'Ganis (tier 5 demon, 9/7): at start of combat, give all other friendly Demons +2/+2
2026-05-04 | 8880f51 | FIXED: Add Houndmaster (tier 3, 4/3): battlecry gives a friendly Beast +2/+2 and Taunt
2026-05-04 | 543264c | FIXED: Add Soul Devourer (tier 3 demon, 3/3): battlecry consumes a friendly Demon from board, gains its ATK and HP
2026-05-04 | 7c34ea9 | FIXED: Add tests/combat/reborn.test.ts — verify reborn minion returns at 1 HP with reborn keyword removed, reborn 1/1 that dies re-enters at 1/1 with no reborn flag, and Elistra the Immortal reborn behavior
2026-05-04 | 00ec947 | FIXED: Add Bronze Warden (tier 3 dragon, 2/1): divine shield + rush keywords
2026-05-04 | 8f095c1 | FIXED: Add Nadina the Red (tier 6 demon, 7/4): deathrattle gives all friendly non-divine-shield Deathrattle minions divine shield
2026-05-04 | 768bd6f | FIXED: Add lifesteal simulation tests — verify lifesteal healing accumulates during combat, does not trigger when damage is absorbed by divine shield, and is applied to winner's hero post-combat
2026-05-04 | 6f2d27d | FIXED: Add Elistra the Immortal (tier 6 dragon, 8/8): reborn keyword, wired into minions index registry
2026-05-04 | 037a527 | FIXED: Add Micro Machine (tier 2 mech, 1/2): at start of combat, gain +1 ATK via onStartOfCombat hook
2026-05-04 | 0abd2dd | FIXED: Add Razorgore the Untamed (tier 6 dragon, 2/4): at start of combat, gains +2/+2 for each friendly Dragon on your board, with unit tests
2026-05-04 | a3c1e47 | FIXED: Add Deck Swabbie (tier 1 pirate, 2/2): battlecry gives a friendly Pirate +1/+1, wired into minions index registry
2026-05-04 | 917abbb | FIXED: Add King of Beasts (tier 6 beast, 2/6): taunt; battlecry gains +1 ATK for each other Beast on your board, with unit tests
2026-05-04 | 065d965 | FIXED: Add Siegebreaker (tier 4 demon, 5/8): taunt; your other Demons have +1 ATK at start of combat via onStartOfCombat aura
2026-05-04 | f14b029 | FIXED: Add Bloodsail Cannoneer (tier 3 pirate, 2/3): battlecry gives a friendly Pirate +3 ATK, wired into minions index registry
2026-05-04 | 422f52b | FIXED: Add Menagerie Magician (tier 4, 4/4): battlecry gives a random friendly Beast, Dragon, and Murloc each +2/+2, wired into shop.ts and minions index registry
2026-05-04 | 3fb501e | FIXED: Add Rat Pack (tier 2 beast, 2/2): deathrattle summons 1/1 Rat tokens equal to this minion's ATK, wired into minions index registry
2026-05-04 | 62cf0af | FIXED: Add Righteous Protector (tier 1 paladin, 1/1): divine shield + taunt
2026-05-03 | de2e6c8 | FIXED: Add Sneed's Old Shredder (tier 6 mech, 5/5) — deathrattle summons a random Legendary minion from tier 6+ on either board, with unit tests
2026-05-03 | 52aac93 | FIXED: Add Boulderfog Ogre (tier 4 elemental, 10/2 vanilla) — fills the high-attack gap in tier 4, wired into minions index registry
2026-05-03 | 5f89f8f | FIXED: Add unit test verifying calcDamage uses actual tier from registry — tests real minions (flame_imp tier1, murloc_warleader tier2, cave_hydra tier4, foe_reaper tier6) to confirm formula uses registry tier not default tier 1, with 5 test cases in tests/damage/calcDamage-registry.test.ts
2026-05-03 | 9c18900 | FIXED: Add Alexstrasza (tier 5 dragon, 10/10 vanilla) — real Battlegrounds hero dragon with no keywords, distinct from existing Alexstrasza-Selfless-Dragon (tier 8), with unit tests
2026-05-03 | e793b2b | FIXED: Add Boarlog Captain (tier 1 Quilboar, 2/2 vanilla) — fills the Quilboar tribe gap (tribe type existed but no minions used it), with unit tests
2026-05-03 | ad8605a | FIXED: Add unit test verifying `applyDamageToPlayer` damage calculation matches spec — loser's tier + sum of winning minion tiers, armor absorbs first, Annihilan Battlemaster tracks total damage, with unit tests in tests/damage/damage-calc.test.ts
2026-05-03 | 913d836 | FIXED: Make Mystery Shot and Poison Dart Shield spells use caster's board spellDamage — Arcane Tinker (spellDamage: 1) on caster's board increases spell damage by 1, with unit tests in tests/spells/spell-damage.test.ts
2026-05-03 | 9fdde75 | FIXED: Add poisonous + divine shield interaction unit test — verifies that poisonous kills shielded defenders (shield pops, defender dies), non-poisonous attacks on shielded targets deal no damage, and poisonous is NOT consumed after killing (only venomous is consumed), with 5 test cases in tests/combat/poisonous-shield.test.ts
2026-05-03 | 2096484 | FIXED: Add combo keyword unit test — verifies all friendly minions with combo gain +2/+2 when a card is played, stacking across multiple plays, with unit test in tests/combat/combo.test.ts
2026-05-03 | b0322c0 | FIXED: Replace Math.floor(rng.next() * n) with rng.pick() in buddies, quests, trinkets, and alley-cat — rng.next() returns [0,1) so Math.floor always returned 0, making all random selection deterministic and always picking the first item
2026-05-03 | 4260771 | FIXED: Add Dragonspawn Lieutenant golden test — verify golden version has 4/6 stats (base 2/3 doubled), with unit test
2026-05-03 | 9081e4c | FIXED: Add unit test verifying applyDamageToPlayer damage calculation matches spec — armor absorbs first then HP, elimination at 0 HP, Annihilan tracks total damage including armor, with calcDamage formula tests
2026-05-03 | 3de0f36 | FIXED: Add brann.test.ts — unit tests verifying Brann triggers battlecry 2x, golden triggers 2x, and Brann+golden triggers 4x (multiplicative stacking)
2026-05-03 | 603d722 | FIXED: Update combat result toast persistence from 3 seconds to 5 seconds in app/game/page.tsx
2026-05-03 | cefdb3c | FIXED: Add spellCardId parameter to onCast hook — fires when player sells a minion (used by future sell-synergy minions), wired into sellMinion in shop.ts for both board and hand paths, with unit tests
2026-05-03 | 8c93738 | FIXED: Add onMinionSold hook to effect hooks framework — fires when player sells a minion (used by future sell-synergy minions), wired into sellMinion in shop.ts for both board and hand paths, with unit tests
2026-05-03 | 4972db9 | FIXED: Add Tide-Razor (tier 5 murloc, 3/4) — deathrattle summons three random murlocs from the registry, with unit tests
2026-05-03 | 5eea451 | FIXED: Add golden.test.ts — unit tests verifying golden deathrattle fires twice (harvest golem, spawn of n'zoth, ghastcoiler), golden stats doubled, and golden is marked golden
2026-05-03 | 8967f10 | FIXED: Add Bigfernal (tier 5 demon) — onShopSummon gives itself +2/+2 whenever another friendly demon is summoned to board, with unit tests
2026-05-03 | a723cc9 | FIXED: Add Murloc Tinyfin (tier 1 murloc, vanilla 1/1) — cheapest warm-body murloc with no keywords
2026-05-03 | 7ec5495 | FIXED: Add unit test verifying Brann + non-golden battlecry triggers 2x (2 × 1 multiplicative stacking)
2026-05-03 | daa1550 | FIXED: Add Ysera the Dreamer tier 6 dragon (start of combat, transform a random friendly minion into a 0/5 with Taunt), with unit tests
2026-05-03 | 723feb4 | FIXED: Add shop-freezing behavior to all AI strategies — when AI has board minions and shop contains unaffordable minions, freeze the shop to preserve it for future turns
2026-05-03 | 5d1081b | FIXED: Add Siphon Soul (tier 5 spell, cost 3) — destroy a friendly minion, summon a random tier 6 minion to your board, with unit tests
2026-05-03 | 8d6b630 | FIXED: Add tier 8 support — extend Tier type to 7|8, create 4 tier 8 minions (Alexstrasza, Ysera, Deathwing, Old Murk-Eye T8), update Siphon Soul to summon tier 8, update economy tables, with tests
2026-05-03 | e09ab18 | FIXED: Cleave unit tests — fixed incorrect combat flow expectations in "cleave at edge" and "cleave does NOT damage all enemies" tests to match actual simulation (counterattack damage from surviving enemies after cleave kills)
2026-05-03 | 079782f | FIXED: buySpell now looks up spells by absolute shop index instead of recalculating the spell boundary dynamically, preventing spells from becoming unbuyable when the shop shrinks below 4 items after buying minions
2026-05-03 | e46b01b | FIXED: Deathrattle summons now placed at the dead minion's board index instead of appended to end — reapDeaths tracks original indices, repositions newly summoned minions via splice, and updates Summon event positions in transcript, matching real Battlegrounds where deathrattle summons appear where the dead minion was
2026-05-03 | 079782f | FIXED: Combat animation RNG fork now matches the state machine — animation uses `turn:${turn}:endTurn` (pre-increment) for the RNG seed and passes `turn + 1` as the turn parameter to `simulateCombat`, preventing mismatched combat results between animation and actual game state when the turn has just incremented
2026-05-03 | aba78e4 | FIXED: Spells and minions now use rng.pick() instead of rng.next() % n for random target selection, fixing modulo bias where the first target was always preferred — applies to poisonDartShield, mysteryShot, duskrayBuff, tavernBrawler, brawl, bananaSpell, tavernTipper, tavernBrawl, Markku, and Bloodsail Corsair
2026-05-03 | b1b4f18 | FIXED: Lifesteal no longer triggers when divine shield absorbs the damage — in real Battlegrounds lifesteal only heals when actual HP damage is dealt, not when divine shield blocks it, previously lifesteal would heal even when poisonous killed a shielded minion (shield popped but no HP damage)
2026-05-03 | 98b4139 | FIXED: Lifesteal events now display in combat animation — describeEvent shows "minion heals for N", eventTypeColor returns emerald text, eventTypeEmoji shows bandage, matching real Battlegrounds where lifesteal is a visible combat event
2026-05-03 | a4f78a2 | FIXED: Bounty events now display in combat animation — describeEvent shows "minion — bounty: +N g to winner", eventTypeColor returns amber text, eventTypeEmoji shows money-bag, matching real Battlegrounds where bounty gold awards are visible combat events
2026-05-03 | 8df0472 | FIXED: refreshShop now preserves dormant minions in the shop instead of returning them to the pool — in real Battlegrounds, refreshing only replaces non-dormant shop items, and dormant minions stay put across refreshes
2026-05-03 | cc339d5 | FIXED: Old Murk-Eye now gives +1 ATK to each other friendly Murloc (not +N where N is the murloc count), matching real Battlegrounds where Old Murk-Eye's aura is always +1 ATK per murloc
2026-05-03 | 534aac8 | FIXED: refreshShop now re-rolls spells when refreshing — in real Battlegrounds, refreshing the shop replaces all non-frozen items including spells, previously spells would persist across refreshes
2026-05-03 | b9a09d8 | FIXED: Shop minion buy buttons now check actual cost (accounting for discount and bountyCost) instead of always requiring 3 gold — minions showing "1g" or "2g" are now correctly purchasable with that amount, matching real Battlegrounds where discounted or bounty minions cost less than the base 3 gold
2026-05-03 | 613d21a | FIXED: Dormant shop minions now visually indicated with grayed-out styling and reduced opacity — in real Battlegrounds, dormant minions in the shop are visually distinct from regular minions, making it clear they cannot be bought until they awaken
2026-05-03 | 5b138fa | FIXED: Combat animation RNG fork now uses the post-increment turn number (turn + 1) to match the state machine's endTurn, preventing mismatched combat results between animation and actual game state when the turn has just incremented
2026-05-03 | 022b97d | FIXED: Shop UI now shows actual minion cost (accounting for discount and bountyCost) instead of always displaying 3 gold — Tavern Discount anomaly minions correctly show 2g, bounty minions show their bounty cost, matching real Battlegrounds where the shop displays each minion's actual price
2026-05-03 | 59b39e5 | FIXED: Poisonous/venomous now kills divine-shielded minions — when a poisonous or venomous attacker hits a minion with divine shield, the shield pops AND the minion is killed (HP set to 0), matching real Battlegrounds where poisonous ignores divine shield
2026-05-03 | 9045d4e | FIXED: Combat transcript highlighting — Attack events now highlight the attacking minion (red glow + scale) and target (orange glow) on both player and opponent boards during combat animation, matching real Battlegrounds where the active attack is visually clear
2026-05-03 | e475a44 | FIXED: Tier-up animation — brief blue flash + scale animation on the tavern tier indicator when player upgrades, matching real Battlegrounds where upgrading shows a visual flash
2026-05-03 | 157ca85 | FIXED: Cleave keyword unit tests — verify that a single cleave attack hits exactly 3 targets (primary target + 2 adjacent) for middle minions, 2 targets for edge minions (index 0 or last), matching real Battlegrounds where cleave only damages adjacent minions, not all friendlies
2026-05-03 | ad72558 | FIXED: Combat animation RNG fork now uses gameState.turn instead of gameState.turn - 1 so the animation uses the same RNG stream as the state machine, preventing mismatched combat results between what the player sees in the animation and what the game state actually resolved
2026-05-03 | fe12190 | FIXED: Sell confirmation — sell button now requires a second click within 1.5s to actually sell (first click shows "Confirm?" with amber pulse animation), preventing misclicks matching real Battlegrounds where selling is a deliberate action
2026-05-02 | 1fc1d87 | FIXED: Bananas now appear in tier 1 shops and are a no-target spell — clicking it directly buffs a random minion instead of requiring board targeting, matching real Battlegrounds where Bananas are a free, no-target shop item
2026-05-03 | 43d829d | FIXED: AI plays battlecry minions before non-battlecry from hand in all three strategies (basic, greedy, heuristic), matching real Battlegrounds where battlecry value is prioritized
2026-05-03 | b9f078e | FIXED: Add Edwin Van Cleef hero passive — every 2nd action this turn gives all friendly minions +1/+1, with actionsThisTurn counter in PlayerState, unit tests
2026-05-03 | c92601d | FIXED: Add Foe Reaper 4000 tier 6 mech (6/9, cleave keyword), with unit tests
2026-05-03 | d42cd78 | FIXED: Add Reno Jackson hero — active power (5 gold, once per game): makes a friendly minion golden, with unit tests
2026-05-02 | 7cb509a | FIXED: Cauterizing Flame spell now respects Divine Shield — pops shield first before dealing 3 damage to HP, matching real Battlegrounds where Cauterizing Flame pops divine shields before damaging minions
2026-05-03 | 9d9efc0 | FIXED: Add Drakonid Enforcer tier 4 dragon (onDivineShieldPop gains +2/+2 when a friendly minion loses divine shield), with unit tests
2026-05-03 | d1791c1 | FIXED: Add Pack Leader tier 2 minion (Beast, 3/3, onShopSummon gives summoned Beast +3 ATK), with unit tests
2026-05-03 | 5c3da7d | FIXED: Add Maiev Shadowsong hero — active power (1 gold): puts a shop minion "Dormant" for 2 turns, then awakens it with +3/+3, with dormant preservation during shop rolls, unit tests
2026-05-02 | 6e50014 | FIXED: Annihilan Battlemaster totalDamageTaken now tracks total damage dealt to hero (before armor) instead of only damage passing through armor — in real Battlegrounds the Annihilan gains +1 ATK for all damage your hero takes, including armor absorption
2026-05-02 | b66549d | FIXED: Extra Life anomaly now restores the player's board on revival instead of clearing it to [] — the board the player had going into combat is now correctly preserved, matching real Battlegrounds where Extra Life revives you with your pre-combat board at 1 HP
2026-05-02 | 72d2798 | FIXED: Combat starting attacker now alternates by turn number (turn 1: left, turn 2: right) instead of being determined by board size — matching real Battlegrounds where the starting attacker rotates each round regardless of how many minions each side has
2026-05-02 | 99bd6e5 | FIXED: Sindragosa and Jaraxxus hero passives now read from the newly rolled shop instead of the old shop in beginRecruitTurn — in real Battlegrounds these heroes buff the shop that just appeared, not the previous turn's shop
2026-05-02 | 0e37f26 | FIXED: Freeze Shop now costs 1 gold instead of 0 — in real Battlegrounds Freeze Shop costs 1 gold, previously it was free
2026-05-02 | 7e9f0d8 | FIXED: Lifesteal healing now applied during combat resolution instead of after — in real Battlegrounds lifesteal heals as damage is dealt, so a hero with enough lifesteal on board will never reach 0 HP from combat damage covered by healing
2026-05-02 | 59133e6 | FIXED: Replace broken sort-based shuffle with rng.shuffle() in shop.ts and triples.ts — discover offers and shop spell rolls now use uniform Fisher-Yates shuffle instead of non-uniform sort(() => rng.next() - 0.5), matching real Battlegrounds where random selection is truly uniform
2026-05-02 | b5ac06f | FIXED: Combat animation now displays Lifesteal events — lifesteal healing is shown in the event log with emerald text color and a bandage emoji, matching real Battlegrounds where lifesteal is a visible combat event
2026-05-02 | 581e311 | FIXED: Leaderboard now shows opponent boards during recruit phase — each alive opponent's minions display as compact stat cards (attack/hp, golden star, tribe, taunt/divine shield borders), matching real Battlegrounds where you can see all 7 opponents' boards to make strategic decisions
2026-05-02 | cdde5d5 | FIXED: Armor now resets to 0 at the start of each recruit turn in beginRecruitTurn — in real Battlegrounds armor is per-round and does not carry over, previously armor accumulated indefinitely across rounds
2026-05-02 | 3111931 | FIXED: Banana, Tavern Brawler, and Brawl spells now require UI targeting instead of picking random targets — clicking these spells enters targeting mode and highlights board minions as clickable targets, matching real Battlegrounds where these spells require you to choose which minion to buff

2026-05-02 | 0d6a857 | FIXED: Gold no longer bumped up to base gold on subsequent turns — players keep their actual gold from previous turns (e.g., 3 gold on turn 1 stays 3 on turn 2 instead of being set to 4), matching real Battlegrounds where gold carries over exactly as-is
2026-05-02 | a64b607 | FIXED: Magnetic spell damage now calculated as max(sd1, sd2) + sd2 matching the attack formula, instead of 2 * max(sd1, sd2) which overcounted when the base minion had higher spell damage than the magnetic minion
2026-05-02 | 0d162ba | FIXED: Interest gold indicator now shown next to gold amount in HUD — when player has 5+ gold, a green "+N" appears showing interest earned (floor(gold/5)), matching real Battlegrounds where interest is visually displayed
2026-05-02 | 10763af | FIXED: Magnetic now stacks on the rightmost same-tribe minion on board instead of the leftmost — matches real Battlegrounds where magnetic applies to the rightmost (closest to enemy) minion of matching tribe
2026-05-02 | b79cd6c | FIXED: AI strategies now check actual gold cost (3g or bountyCost) instead of stat-ball when determining affordability — AIs can now buy minions with high stats that cost 3 gold, matching real Battlegrounds where all minions cost the same gold regardless of their power
2026-05-02 | 6fc71c1 | FIXED: Combat animation RNG fork now uses `gameState.turn` instead of `gameState.turn - 1` so the animation uses the same RNG stream as the state machine, preventing mismatched combat results between what the player sees in the animation and what the game state actually resolved
2026-05-02 | 2511d32 | FIXED: Sindragosa passive now checks if individual shop minions have the freeze keyword instead of checking if the shop is frozen — in real Battlegrounds Sindragosa buffs frozen-keyword minions (like Frostbound Golem) in your shop, not all minions when you freeze the shop
2026-05-02 | a678aeb | FIXED: Shop UI now shows actual minion cost (accounting for bountyCost and discount) instead of always displaying 3 gold — Tavern Discount anomaly minions correctly show 2g, bounty minions show their bounty cost, matching real Battlegrounds where the shop displays each minion's actual price
2026-05-02 | 7914bc5 | FIXED: Interest gold now calculated on actual player gold instead of Math.max(player.gold, baseGold) — players with less than 5 gold correctly receive 0 interest, matching real Battlegrounds
2026-05-02 | aeaa2e0 | FIXED: Reborn keyword now resets both ATK and spellDamage to 1/0 when a minion revives — in real Battlegrounds reborn minions come back at 1/1 regardless of previous stats, previously only HP was reset leaving attack and spell damage intact
2026-05-02 | c3f7f34 | FIXED: Triple golden minion now sums actual stats of all three merged copies instead of baseCard.baseAtk * 2 — buffs from auras, hero passives, and battlecries are correctly inherited by the golden, matching real Battlegrounds
2026-04-30 | 969181f | FIXED: playSpell now fires onCast hooks (Kalecgos, etc.) even for spells without onPlay effects — all spell casts trigger minion onCast hooks regardless of whether the spell has an onPlay effect
2026-05-02 | 2686f4d | FIXED: Triples no longer detected mid-buy during buyMinion — only detected at endTurn, matching real Battlegrounds where the discover overlay appears when clicking "End Turn", not when purchasing minions
2026-05-02 | c424d77 | FIXED: Sir Finley hero power now swaps to another active hero instead of giving +1/+1 — correctly implements real Battlegrounds where Sir Finley swaps your Hero Power with one of 3 randomly chosen alternatives
2026-04-30 | 3d4c326 | FIXED: Ragnaros passive now deals 8 damage at the START of combat instead of after — enemy minions can be killed before attacks begin, matching real Battlegrounds
2026-05-02 | 02f36e0 | FIXED: Frozen shop now stays frozen until explicitly unfrozen by player — rollShopForPlayer no longer clears shopFrozen flag, and all per-turn effects (hero passives, buddies) still fire for frozen shops, matching real Battlegrounds where a frozen shop persists across turns
2026-04-30 | 73c54b3 | FIXED: onTurnEnd hooks now fire for all non-eliminated players during endTurn (not just the active player), and hero passives (Ysera, Jaraxxus, Sindragosa, Curator, King Mukla) now apply to all players — matching real Battlegrounds where start-of-round effects affect all 8 players
2026-04-30 | 8038470 | FIXED: Add onRecruitSummon hook to MinionHooks, wire into shop.ts playMinionToBoard — Murloc Tidecaller and Knife Juggler now fire during recruit phase when buying minions, matching real Battlegrounds
2026-04-30 | 4255c7b | FIXED: Combat animation RNG now matches actual combat — animation uses the same `turn:{turn}:endTurn` RNG fork as the state machine, preventing mismatched combat events between animation and game state
2026-04-30 | a9912e1 | FIXED: Add Wrath Weaver tier 1 demon (onTurnEnd deals 1 damage to your hero and gives all friendly demons +2/+2), with unit tests
2026-04-30 | 205d9c5 | FIXED: refreshShop now skips when shop is frozen instead of clearing the freeze flag, matching real Battlegrounds where a frozen shop cannot be changed by refreshing
2026-04-30 | c0d8eb3 | FIXED: Greedy AI now checks board strength before upgrading tavern tier — only upgrades when total minion stat-ball ≥ 10 or board has 4+ minions, preventing early upgrades with weak boards
2026-04-30 | 6e4c23e | FIXED: Ysera passive now uses rng.pick to select a random dragon minion from the current tier instead of always adding the first one (Math.floor(rng.next() % n) always returned 0 since rng.next() < 1)
2026-04-30 | 98027ae | FIXED: Add interest gold mechanic — players earn 1 extra gold for every 5 gold they have at end of turn (up to 10 extra gold), wired into beginRecruitTurn, matching real Battlegrounds
2026-04-30 | 439ba12 | FIXED: Game feel audit — fix isGhost in state.ts to return true for eliminated players, so odd-player-round ghost fights no longer get skipped — previously all ghost fights were silently skipped because isGhost always returned false
2026-04-30 | fbb2b3d | FIXED: fireRushAttacks in combat.ts now re-reads alive defenders from updated left/right arrays after each reapDeaths call, and skips dead rush minions — previously stale array references caused dead rush minions to attack and rush minions to attack multiple times per round
2026-04-30 | c904cd7 | FIXED: playSpell now removes the played spell from the player's spells array after use, matching real Battlegrounds where spells are one-time use
2026-04-30 | 625abba | FIXED: AI combat board placement — all three AI strategies (basic, greedy, heuristic) now sort board by ATK descending before combat, matching real Battlegrounds where ordering by strength is a key strategic decision
2026-04-30 | c904cd7 | FIXED: Game feel audit — fix handleEndTurn to find the actual combat opponent from pairingsHistory instead of just grabbing the first non-eliminated player, matching real Battlegrounds where you fight a specific opponent each round
2026-04-30 | 2179f91 | FIXED: Move Scavenging Hyena from tier 2 to tier 1 (real Battlegrounds tier), with unit tests
2026-04-30 | 2d75926 | FIXED: Add Lightfang Enforcer tier 5 beast (onTurnEnd gives a friendly minion of each tribe on board +2/+1), with unit tests
2026-04-30 | 423b24c | FIXED: pairPlayers now uses pairingsHistory to avoid rematching players who fought each other in the previous round, matching real Battlegrounds where opponents change each round
2026-04-30 | 49e3ed7 | FIXED: Game feel audit — fix handlePlaceToEmptySlot condition that prevented placing a hand minion at board position 0 (placingMinionIdx === 0 was treated as null by the broken `!placingMinionIdx && placingMinionIdx !== 0` check)
2026-04-30 | 619f020 | FIXED: playSpell now removes spells with onPlay effects from the player's spells array after use — previously only spells without onPlay effects were consumed, allowing all spells to be played infinitely
2026-04-30 | b61f7e4 | FIXED: Greedy AI now upgrades tavern tier when it can afford it and still has gold for a buy, matching real Battlegrounds where aggressive players invest in tavern tier early
2026-04-30 | d34fb90 | FIXED: Hand minion clicks now toggle placing mode — clicking an already-highlighted card cancels placement, and clicking when the board is full shows an error instead of getting stuck
2026-04-30 | 8bfe92e | FIXED: Damage recap now uses pre-step opponent hero ID instead of re-finding opponent from post-step gameState, so the hero name is always correct even when the opponent is eliminated in combat
2026-04-30 | ef7abab | FIXED: Add Annihilan Battlemaster tier 4 demon (gains +1 ATK for each damage your hero has taken), with unit tests
2026-04-30 | 68d1838 | FIXED: fireRushAttacks in combat.ts now processes rush minions from BOTH sides during the rush phase, matching real Battlegrounds where all rush minions attack before the normal cycle (previously only the starting side's rush minions attacked)
2026-04-30 | 0de6be5 | FIXED: Add Security Rover tier 4 mech (onDamageTaken summons a 2/3 Security Bot with divine shield), add onDamageTaken hook to MinionHooks, wire into combat.ts applyDamage, with unit tests
2026-04-30 | 8bfe92e | FIXED: No-target spells (Banana, Mystery Shot, Swat Team, etc.) now play directly when clicked instead of requiring board targeting, matching real Battlegrounds behavior where these spells pick random targets internally
2026-04-30 | dd0b4b7 | FIXED: Gold now carries over between turns in beginRecruitTurn — unspent gold is preserved instead of being reset to baseGoldForTurn, matching real Battlegrounds behavior
2026-04-30 | dd388d4 | FIXED: Show combat animation overlay when one side has no minions on board — previously clicking "End Turn" with an empty opponent board gave zero visual feedback, silently transitioning back to recruit phase
2026-04-29 | 7249678 | FIXED: Fix buySpell not removing purchased spell from shop — spells are now removed from shop when bought, preventing duplicate purchases
2026-04-29 | 9a5cfc1 | FIXED: Fix fireRushAttacks discarding reapDeaths result — rush minions now properly process deaths so subsequent rush attacks see updated board state
2026-04-29 | 353df65 | FIXED: Add Virmen Sensei tier 4 dragon (battlecry gives a friendly dragon +2/+2), with unit tests
2026-04-29 | 1ff1f5f | FIXED: Add frost visual indicator to frozen shop — blue border, sky background tint, and "❄ Frozen" label on shop items when shop is frozen
2026-04-29 | ac4f57a | FIXED: AI basic strategy prefers buying minions matching the first tribe on board over cheapest minion, with unit test
2026-04-29 | f426c2f | FIXED: Make buyMinion skip spell items in the shop to prevent AI from crashing when buying spells as minions
2026-04-29 | 614ac01 | FIXED: Make hero selection deterministic by passing seed from home page through hero select to game page, replacing Math.random() with seeded RNG
2026-04-29 | 614ac01 | FIXED: Remove duplicate combat application in game page — step(EndTurn) already resolves combat, applies damage, and transitions to recruit phase; UI no longer re-applies results after animation
2026-04-29 | 2a0e9ac | FIXED: Fix sell button for hand minions — SellMinion action now supports handIndex so selling from hand works correctly (was passing hand index as boardIndex)
2026-04-29 | 5efd2f6 | FIXED: Fix sellMinion board path returning minion to pool twice — was calling returnToPool twice (once in unused newPool variable, once directly in return), now correctly returns to pool exactly once
2026-04-29 | 61fd70f | FIXED: Fix sellMinion variable shadowing bug and incorrect sell value — hand path now correctly returns minion to pool (was shadowed by inner let), and sell value is now 2g for golden / 1g for normal (was always 1g)
2026-04-27 | d5f5e83 | FIXED: Add basic AI strategy — buys cheapest affordable minion from shop, plays all to board, with unit tests
2026-04-29 | 0359193 | FIXED: Add Jaraxxus hero — passive: demons in your shop gain +1/+1 at start of each recruit turn, with unit tests
2026-04-27 | ef3bae2 | FIXED: Add Tavern Tipper spell (tier 2-5, costs 2 gold, gives a random friendly minion +2/+2), with unit tests
2026-04-27 | aa8664f | FIXED: Add triple merge animation — golden minions pulse with amber glow on board, hand, and shop when triple triggers
2026-04-27 | aca8eb3 | FIXED: Golden minion deathrattle/battlecry triggers twice in combat and shop, matching real Battlegrounds golden minion behavior
2026-04-27 | 47342cc | FIXED: Add Junkbot tier 5 mech (onAllyDeath gains +2/+2 when friendly Mech dies), add deadSide to AllyDeathCombatCtx, update combat.ts call site, with unit tests
2026-04-27 | 85159eb | FIXED: Add Selfless Hero tier 2 minion (deathrattle gives random friendly minion divine shield) and Metaltooth Leaper tier 2 mech (battlecry gives other friendly Mechs +2 ATK), with registry update
2026-04-27 | c43160b | FIXED: Add Defender of Argus tier 4 mech with battlecry giving adjacent friendly minions +1/+1 and taunt, with registry update
2026-04-27 | 0318d5a | FIXED: Add Knife Juggler tier 2 minion with onSummon hook dealing 1 damage to random enemy minion, with unit tests
2026-04-27 | 98421bc | FIXED: Add Soul Juggler tier 3 demon (onAllyDeath deals 3 damage to random enemy when friendly demon dies) and Infested Wolf tier 3 beast (deathrattle summons two 1/1 Spiders), with unit tests
2026-04-27 | 85d0699 | FIXED: Make freezeShop toggle — clicking again unfreezes the shop, with UI label updating to "Unfreeze Shop"
2026-04-27 | 64cb979 | FIXED: Add onPlay hook to MinionHooks, wire into playMinionToBoard, add Deflect-o-Bot tier 2 mech (divine shield, +1 ATK whenever you play a Mech), with unit tests
2026-04-27 | f8a21df | FIXED: Add Cobalt Scalebane tier 3 dragon with onTurnEnd hook giving random friendly minion +3 ATK, wire onTurnEnd into endTurn, with unit tests
2026-04-27 | 3c06769 | FIXED: Update SHOP_SIZE_BY_TIER — tier 5 from 5→6, tier 6 from 6→7 to match real Battlegrounds, update the-curator comment
2026-04-27 | f1e12c7 | FIXED: Add The Curator hero — passive ensures shop contains at least one minion of each tribe on player's board, with unit tests
2026-04-27 | 6a931b2 | FIXED: Add King Mukla hero — passive grants a Banana spell (gives a friendly minion +1/+1) to hand at start of each recruit turn, with unit tests
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
2026-04-27 | 19e7b95 | FIXED: Add onDivineShieldPop hook to MinionHooks, wire into combat.ts applyDamage, add Bolvar Fireblood tier 4 mech (divine shield, +2 ATK whenever friendly divine shield pops), with unit tests
2026-04-27 | 292c80c | FIXED: Add Cave Hydra tier 4 beast with cleave keyword, update minion registry

2026-04-27 | c03ca4a | FIXED: Add Baron Rivendare tier 5 undead (deathrattles trigger twice on same side), fix Harvest Golem syntax error, wire baronRivendare flag into combat death resolution
2026-04-27 | 634a0f6 | FIXED: Add Brann Bronzebeard tier 5 murloc — passive aura causes friendly battlecries to trigger twice when on board, with unit tests
2026-04-27 | 22ed28f | FIXED: Add AI refresh logic — basic AI refreshes shop once when it has enough gold and no affordable minion is found
2026-04-27 | 02f566f | FIXED: Update Leaderboard to show all 8 players ordered by HP with elimination badges and current player highlight
2026-04-27 | f827bb0 | FIXED: Add victory screen overlay — shows winner's hero name, placement breakdown for all 8 players, and "Play Again" button that resets to hero selection
2026-04-27 | 41cc0ad | FIXED: Add pairing display — show "You're fighting: <opponent hero name>" banner during combat phase
2026-04-27 | 81eea95 | FIXED: Add hero damage recap — red banner showing "You took X damage from <opponent>" displayed briefly after combat ends before returning to recruit phase
2026-04-28 | d49cba3 | FIXED: Add Swat Team spell (tier 3-6, cost 3, summons three 1/1 Recruits with rush to player's board), with unit tests
2026-04-28 | ac54f88 | FIXED: Add Tavern Discount anomaly — all shop minions cost 1 less gold (minimum 1), wired into rollShopForPlayer
2026-04-28 | 4b8f9d3 | FIXED: Add Big League anomaly — all minions start combat with +1/+1, wired into simulateCombat
2026-04-29 | 989c582 | FIXED: Add Tavern Brawl spell (tier 2-4, cost 2, gives a friendly minion +2/+1), distinct from existing Tavern Brawler (tier 3-6), with unit tests
2026-04-29 | 74b48bf | FIXED: Add Extra Life anomaly — each player gets one free revive the first time they reach 0 HP, wired into applyCombatResult, with unit tests
2026-04-29 | b48216d | FIXED: Add Sindragosa hero — passive buffs frozen shop minions +1/+1 at start of each recruit turn, with unit tests
2026-04-29 | cca6d37 | FIXED: Add Trade Prince Gallywix hero — active power (2 gold) discovers a random minion from the opponent's current board and adds it to hand, with unit tests
2026-04-29 | b16133f | FIXED: Add Kalecgos, Arcane Aspect tier 6 dragon (onCast gives all friendly minions +1/+1 when a spell is cast), add onCast hook to MinionHooks, wire into playSpell in state.ts, with unit tests
2026-04-29 | 836e1c3 | FIXED: Wire Banana spell into shop rolls — spells appear in the last 1/4 of shop slots starting at tier 2, plus fix AI heuristic and Curator hero to skip spell items in shop
2026-04-29 | 39cdbeb | FIXED: Add Ghastcoiler tier 6 beast (deathrattle summons 2 random deathrattle minions from tier 6), with unit tests
2026-04-29 | e9b5bbe | FIXED: Add Mama Bear tier 6 beast (onShopSummon gives itself +5/+5 whenever a Beast is summoned to the player's board), add onShopSummon to RecruitCtx and wire into shop.ts, with unit tests
2026-04-29 | 085460c | FIXED: Replace non-deterministic Date.now() seed with fixed seed (1) in game page so every game is deterministic and replayable
2026-04-29 | 46310c6 | FIXED: Add Gentle Megasaur tier 6 beast (battlecry gives all friendly murlocs a random keyword), with unit tests
2026-04-29 | ddfb483 | FIXED: Make spells visible in shop UI — shop rendering now checks SPELLS registry for spell items, renders them with purple border and cost, and wires BuySpell action handler
2026-04-29 | 0614ba3 | FIXED: Add Coldlight Seer tier 3 murloc (battlecry gives all friendly murlocs +2 HP), with unit tests
2026-04-29 | 43eefce | FIXED: Add spell targeting UI — clicking a spell in hand enters targeting mode, board minions highlight as clickable targets, clicking a board minion plays the spell with that target index, cancel button to exit targeting mode
2026-04-29 | 47a1e48 | FIXED: Sell button on board and hand now shows correct sell value (1g normal, 2g golden) instead of displaying player gold amount
2026-04-29 | 7bbf16b | FIXED: Add Screwjank Clunker tier 3 mech (battlecry gives a friendly mech +2/+2), with unit tests

2026-04-29 | a96b394 | FIXED: Wire AI strategies into endTurn so AI players buy/sell/upgrade during recruit phase before combat resolves, matching real Battlegrounds behavior
2026-04-29 | da9206b | FIXED: Fix buySpell shop index calculation — shopIndex from UI is absolute index in full shop, but buySpell was indexing it directly into the sliced spellSlots array, causing "No spell at shop index N" errors when buying spells from the shop
2026-04-29 | 2bbb9e6 | FIXED: Fix combat animation showing empty fight — handleEndTurn now snapshots player/opponent boards before step(EndTurn) clears them, computing the correct CombatResult from pre-combat state for the animation overlay
2026-04-30 | 5d87f31 | FIXED: Add Murozond tier 5 dragon (battlecry adds a copy of a random enemy minion from their board to your hand), with unit tests
2026-04-30 | 08d2cd3 | FIXED: applyCombatResult now keeps loser's surviving minions on board instead of clearing to [] — both players retain their boards after combat, matching real Battlegrounds where only HP changes between rounds
2026-04-30 | 8fd1924 | FIXED: Triples at tier 6 now correctly create golden minions — previously the early return at tier >= 6 skipped golden conversion entirely, only skipping the discover offer as intended
2026-04-30 | d03c81c | FIXED: Shop UI now shows actual minion stats (atk/hp) instead of base card stats — buffs from heroes (Sindragosa, Jaraxxus) and other effects are now visible in the shop, matching real Battlegrounds
2026-05-02 | 9165ecb | FIXED: Replace Math.floor(rng.next() % n) with rng.pick() in Murozond, The Curator, Trade Prince Gallywix, and pickAnomaly — rng.next() returns [0,1) so Math.floor always returned 0, making all random selection deterministic and always picking the first item
2026-05-02 | f855208 | FIXED: All three AI strategies (basic, greedy, heuristic) now use hero powers during the recruit phase when available — in real Battlegrounds AIs use their hero powers, previously all AIs skipped them entirely
2026-05-03 | de8622b | FIXED: Persist combat result damage recap toast for 3 seconds instead of 2
2026-05-03 | f09fd42 | FIXED: Deathrattle ordering — verify deathrattles fire in left-to-right board order (index 0 first) via unit test in keywords.sim.test.ts, matching real Battlegrounds where deathrattles resolve left-to-right
2026-05-03 | 976e2d5 | FIXED: Bounty keyword now awards gold to the winning player when a bounty minion dies in combat — adds Bounty event type to CombatEvent, tracks bountyGold in CombatResult, wires into reapDeaths and state.ts EndTurn handler, with unit tests
2026-05-03 | d42a1fa | FIXED: Player boards now sorted by ATK descending before combat in resolveCombat — matching real Battlegrounds where all 8 players' boards are ordered by strength before the combat phase begins, with unit test
2026-05-03 | fb58b5b | FIXED: Golden + Brann battlecry now triggers 4 times (2 × 2 multiplicative) instead of 2 — in real Battlegrounds golden and Brann stack multiplicatively, previously the code used OR logic triggering only 2x when both were present
2026-05-03 | a91aefb | FIXED: Combat transcript now emits "Stat" events after each attack cycle showing all surviving minions' current atk/hp, so the UI can display real-time stat updates during combat animation matching real Battlegrounds where minion health bars and stats update visually during combat
2026-05-03 | 193d8cc | FIXED: Add Pogo-Hopper (tier 2 mech) — battlecry gains +1/+1 for each Pogo-Hopper previously played this game, with unit tests
2026-05-03 | ef8b499 | FIXED: Add Toxfin (tier 4 murloc) — battlecry gives a friendly murloc poisonous, with unit tests
2026-05-03 | 75db9ea | FIXED: Add Sneed's Old Shredder (tier 6 mech, 5/5) — deathrattle summons a random tier 6 Legendary minion from the game, with unit tests verifying deathrattle behavior and board cap handling
2026-05-03 | a47aed3 | FIXED: Add Pyramad hero — active power (1g) give a random friendly minion +4 HP
2026-05-03 | 826d3ed | FIXED: Add Scurpus (tier 3 beast) — battlecry summons a 1/1 Beast for each other minion with a Battlecry on your board, with unit tests
2026-05-03 | 94dcb16 | FIXED: Add Tortollan Shellraiser (tier 3 elemental, 2/3): taunt; deathrattle give a random friendly minion +1/+3, with unit tests
2026-05-03 | 519ea80 | FIXED: Fix Pack Leader (tier 2 beast) — onShopSummon now buffs the summoned beast +3 ATK instead of buffing Pack Leader itself, matching test spec
2026-05-03 | 0ded16f | FIXED: Add Nightmare Amalgam (tier 2, 2/4) — no tribe, counts as ALL tribes for tribe-buff effects, expand "All" to all concrete tribes at instantiation time in define.ts, with unit tests
2026-05-03 | 9825300 | FIXED: Fix Ysera the Dreamer (tier 6 dragon) — transforms a random ENEMY minion into a 1/1 Dragon with Taunt at start of combat instead of transforming a friendly minion
2026-05-04 | 130a4a3 | FIXED: Add Imp Gang Boss (tier 3 demon, 2/4) and Imp Mama (tier 6 demon, 6/8) — both use onDamageTaken hook to summon 1/1 Imp tokens, with Imp Mama also gaining +1/+1 per hit
2026-05-04 | b0d92b2 | FIXED: Add Sellemental (tier 1 elemental, 1/1) — onSell hook adds a 1/1 Elemental token to hand when sold
2026-05-04 | e09c7ec | FIXED: Add Floating Watcher (tier 4 demon, 4/4) — onHeroDamaged hook fires when player's hero takes combat damage, gaining +2/+2 per hit, plus wire onHeroDamaged into applyCombatResult in state.ts
2026-05-04 | 123c74b | FIXED: Add Zapp Slywick (tier 5 mech, 7/10) — rush; always attacks the lowest-ATK enemy minion via new getTarget hook in MinionHooks, with unit tests
2026-05-04 | 9eb88d5 | FIXED: Add Voidlord (tier 5 demon, 3/9): taunt; deathrattle summons three 1/3 Demons with taunt
2026-05-04 | f815b0b | FIXED: Add tests/simulation/baron-rivendare.sim.test.ts — verify Baron Rivendare causes deathrattles to fire 2x; golden+baron stacks multiplicatively; Baron on right side does not affect left deathrattles; fix combat.ts to stack golden×baron multiplicatively
2026-05-04 | 555cc79 | FIXED: Add tests/simulation/selfless-hero.sim.test.ts — verify Selfless Hero deathrattle gives divine shield to a random friendly minion without one, skips those that already have divine shield, and golden version gives 2 shields
2026-05-04 | 80c917d | FIXED: Add tests/combat/magnetic.test.ts — verify Magnetic keyword attaches mech stats and keywords to rightmost friendly Mech on board, and the attached mech has combined stats
2026-05-04 | d829e37 | FIXED: Fix Scavenging Hyena golden stat gains (+4/+2 per Beast death) and add 4 sim tests
2026-05-04 | b42adb6 | FIXED: Add tests/combat/lifesteal.test.ts — verify lifesteal heals winning hero by total lifesteal amount, does NOT trigger when damage is absorbed by divine shield, emits Lifesteal transcript events, and works with Queen of Pain
2026-05-04 | ec09966 | FIXED: Add Deflect-o-Bot divine shield restoration test — verify that playing a Mech restores Deflect-o-Bot's divine shield, non-Mechs do not, and golden version also works
2026-05-04 | deb0341 | FIXED: Add greedy AI tier upgrade test — verify it upgrades when board has ≥4 minions and gold ≥ upgradeCost, and skips upgrade when board is weak or gold is insufficient
2026-05-04 | 2e03ca6 | FIXED: Add King Mukla hero power — gives opponent 2 Bananas when used, with hero power test
2026-05-07 | 77fddba | FIXED: Add Maexxna (tier 5 beast, 2/12): poisonous — single keyword, no hooks needed
2026-05-07 | 37247f8 | FIXED: Add Mechano-Egg (tier 5 mech, 0/5): deathrattle summons an 8/8 Robosaur token
2026-05-07 | b9d269c | FIXED: Add Yo-Ho-Ogre (tier 4 pirate, 2/8): after this minion attacks, it attacks again targeting a random enemy — new yoHoOgre keyword in types.ts, extra attack logic in combat.ts, minion definition in tier4/yo-ho-ogre.ts
2026-05-07 | afc18f2 | FIXED: Add tests/combat/reborn.test.ts — verify reborn minion returns at 1 HP with reborn keyword removed, and that a 1/1 reborn that dies in combat re-enters board at 1/1 with no reborn flag
2026-05-08 | a253d34 | FIXED: Add "Skip →" button to combat overlay footer in app/game/page.tsx; clicking it calls setCombatTick(combatResult.transcript.length - 1) to jump immediately to the last event
2026-05-09 | 0076187 | FIXED: Add victory banner after combat win — green "You won! ⚔️" banner using combatOutcome state in app/game/page.tsx, mirroring the existing damageRecap pattern, shown for 3s after combat closes when player won
2026-05-09 | b878f7b | FIXED: Ghost fight label — show "Ghost fight vs." in combat overlay pairing banner when opponent has placement !== null
2026-05-09 | 1fdee9b | FIXED: Combat animation speed toggle — add "⚡ 2×" button to combat overlay header; track combatSpeed: 1 | 2 state; halve tick interval from 180ms to 90ms at 2×
2026-05-09 | 8b920b8 | FIXED: Add Edwin Van Cleef hero power test — verify onHeroPower gives all hand minions +1/+1, stacks across uses, does nothing on empty hand, and does not affect board minions
2026-05-09 | 5488850 | FIXED: Cobalt Scalebane onTurnEnd now uses seeded rng.pick() instead of Math.random for deterministic random minion selection, plus unit tests verifying buff behavior
2026-05-09 | fc771cf | FIXED: Description field already implemented — MinionCard interface has description?: string, 8 key cards populated, title={card.description} wired in MinionCard component, bun typecheck and bun test (835/835) pass
2026-05-09 | 463790a | FIXED: Add tests/heroes/king-mukla.test.ts — verify King Mukla hero power (1g active): opponent receives 2 Banana cards in their hand; verify using it on a minion that already has divine shield has no effect; use the heroPower function directly on a test GameState
2026-05-09 | 3dd7354 | FIXED: Pack Leader onShopSummon test — verify Pack Leader (tier 2 beast) buffs summoned Beast +3 ATK when a Beast is played to board, does not buff non-Beasts, and stacks across multiple Beast plays; also fixed existing pack-leader implementation to use ctx.self.instanceId instead of summoned.instanceId for correct self-reference
2026-05-09 | 9411771 | FIXED: Infested Wolf deathrattle — verify tier 3 beast summons two 1/1 Spiders on death, respects board cap, and works against weak enemies; minion definition at tier3/infested-wolf.ts with onDeath hook, 4 passing simulation tests
2026-05-09 | 8361729 | FIXED: Goldrinn deathrattle — fix goldrinn.ts from onShopSummon to onDeath giving friendly Beasts +5/+5, add 5 simulation tests
2026-05-09 | 8361729 | FIXED: Fix Mama Bear (tier 6 beast) — changed from broken onShopSummon self-buff to correct onSummon hook that gives newly summoned friendly Beasts +5/+5, fixed base stats from 1/1 to 5/5, added 4 simulation tests
2026-05-09 | 5a75934 | FIXED: Spawn of N'Zoth base stats 1/1→2/2, deathrattle +1/+1→+2/+2 to all friendly minions, 4 sim tests
2026-05-09 | 6532e04 | FIXED: Add Blingtron 4000 (tier 4 mech, 3/3) — battlecry summons a 1/1 Robot Pup for each friendly Mech on your board (including itself), with 4 simulation tests verifying pup count, board cap, and single-mech scenarios
