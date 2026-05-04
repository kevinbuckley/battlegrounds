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

## Now (highest priority, model should pick from here first)

- [x] [S] Add `Rat Pack` (tier 2 beast, 2/2): deathrattle summon ATK-many 1/1 Rat tokens — src/game/minions/tier2/rat-pack.ts

- [x] [S] Add tests/combat/reborn.test.ts — verify reborn minion returns at 1 HP with reborn keyword removed

- [x] [S] Add `onDamageTaken` hook to MinionHooks and wire into combat.ts applyDamage after shield resolution

- [x] [S] Add `Voidlord` (tier 5 demon, 3/9): taunt; deathrattle summon three 1/3 demons with taunt — src/game/minions/tier5/voidlord.ts

- [x] [S] Add `Zapp Slywick` (tier 5 mech, 7/10): rush; always attacks the lowest-ATK enemy — src/game/minions/tier5/zapp-slywick.ts

- [x] [S] Add `Imp Gang Boss` (tier 3 demon, 2/4): whenever this minion takes damage summon a 1/1 Imp — onDamageTaken hook in src/game/minions/tier3/imp-gang-boss.ts

- [x] [S] Add `Rat Pack` (tier 2 beast, 2/2): deathrattle summon ATK-many 1/1 Rat tokens — src/game/minions/tier2/rat-pack.ts

- [x] [S] Add tests/combat/reborn.test.ts — verify reborn minion returns at 1 HP with reborn keyword removed

### Combat correctness tests

- [x] [S] Add tests/combat/reborn.test.ts — verify reborn minion returns at 1 HP with reborn keyword removed, and that a 1/1 reborn that dies in combat re-enters board at 1/1 with no reborn flag
- [x] [S] Add tests/economy/upgrade-cost.test.ts — verify tier upgrade cost decreases by 1 each turn it isn't taken (beginRecruitTurn reduces upgradeCost), and resets to base on upgrade
- [x] [S] Add tests/shop/refresh.test.ts — verify shop refresh deducts 1 gold from player, and that refreshing costs exactly COST_REFRESH (currently 1g)
- [x] [S] Add tests/simulation/lifesteal.sim.test.ts — verify lifesteal keyword heals the attacking minion for damage dealt in combat, but NOT when damage is absorbed by divine shield

### New minions — Tier 1

- [x] [S] Add `Fiendish Servant` (tier 1 demon, 2/1): deathrattle give its ATK to a random friendly minion — src/game/minions/tier1/fiendish-servant.ts
- [x] [S] Add `Righteous Protector` (tier 1 paladin, 1/1): divine shield + taunt — src/game/minions/tier1/righteous-protector.ts

### New minions — Tier 2

- [x] [S] Add `Rat Pack` (tier 2 beast, 2/2): deathrattle summon a number of 1/1 Rat tokens equal to this minion's ATK at time of death — src/game/minions/tier2/rat-pack.ts
- [x] [S] Add `Menagerie Magician` (tier 4, 4/4): battlecry give a random friendly Beast, Dragon, and Murloc each +2/+2 — src/game/minions/tier4/menagerie-magician.ts
- [x] [S] Add `Grombi the Rotunda` (tier 2 murloc, 2/3): magnetic; whenever a friendly minion scores a kill during combat, gain +2/+2 — onAllyKill hook in src/game/minions/tier2/grombi-the-rotunda.ts

### New minions — Tier 3

- [x] [S] Add `Imp Gang Boss` (tier 3 demon, 2/4): whenever this minion takes damage, summon a 1/1 Imp — onDamageTaken hook in src/game/minions/tier3/imp-gang-boss.ts
- [x] [S] Add `Bloodsail Cannoneer` (tier 3 pirate, 2/3): battlecry give a friendly Pirate +3 ATK — src/game/minions/tier3/bloodsail-cannoneer.ts
- [x] [S] Add `Grombi the Rotunda` (tier 3 elemental, 3/3): whenever a friendly minion scores a kill during combat, gain +2/+2 — onAllyKill hook in src/game/minions/tier3/grombi-the-rotunda.ts

### New minions — Tier 4

- [x] [S] Add `Siegebreaker` (tier 4 demon, 5/8): taunt; your other Demons have +1 ATK — onStartOfCombat aura buff in src/game/minions/tier4/siegebreaker.ts
- [x] [S] Add `Floating Watcher` (tier 4 demon, 4/4): whenever your hero takes damage, gain +2/+2 — onHeroDamaged hook in src/game/minions/tier4/floating-watcher.ts
- [x] [S] Add `Ripsnarl Captain` (tier 4 pirate, 3/5): whenever a friendly Pirate attacks, give it +2/+2 — onAllyAttack hook in src/game/minions/tier4/ripsnarl-captain.ts

### New minions — Tier 5

- [x] [S] Add `Zapp Slywick` (tier 5 mech, 7/10): rush; always attacks the lowest-ATK enemy minion instead of random — src/game/minions/tier5/zapp-slywick.ts
- [x] [S] Add `Voidlord` (tier 5 demon, 3/9): taunt; deathrattle summon three 1/3 Demons with taunt — src/game/minions/tier5/voidlord.ts

### New minions — Tier 6

- [x] [S] Add `Imp Mama` (tier 6 demon, 6/8): whenever this minion takes non-zero damage, gain +1/+1 and summon a 1/1 Imp — onDamageTaken hook in src/game/minions/tier6/imp-mama.ts
- [x] [S] Add `King of Beasts` (tier 6 beast, 2/6): taunt; battlecry gain +1 ATK for each other Beast on your board — src/game/minions/tier6/king-of-beasts.ts
- [x] [S] Add `Razorgore the Untamed` (tier 6 dragon, 2/4): at start of combat, gain +2/+2 for each friendly Dragon on your board — onStartOfCombat counting dragons in src/game/minions/tier6/razorgore.ts
- [x] [S] Add `Nadina the Red` (tier 6 human, 7/4): deathrattle give all friendly non-divine-shield Deathrattle minions divine shield — onDeath in src/game/minions/tier6/nadina.ts
- [x] [S] Add `Elistra the Immortal` (tier 6 dragon, 8/8): reborn — single keyword, no hooks needed, src/game/minions/tier6/elistra.ts

### New minions — Tier 1 (additional)

- [x] [S] Add `Sellemental` (tier 1 elemental, 1/1): when you sell this minion, add a 1/1 Elemental to your hand — uses existing onMinionSold hook in src/game/minions/tier1/sellemental.ts
- [x] [S] Add `Deck Swabbie` (tier 1 pirate, 2/2): battlecry give a friendly Pirate +1/+1 — src/game/minions/tier1/deck-swabbie.ts

### New minions — Tier 2 (additional)

- [x] [S] Add `Micro Machine` (tier 2 mech, 1/2): at the start of combat, gain +1 ATK — onStartOfCombat in src/game/minions/tier2/micro-machine.ts

### New minions — Tier 3 (additional)

- [x] [S] Add `Bronze Warden` (tier 3 dragon, 2/1): divine shield + rush — no hooks needed, just keywords in src/game/minions/tier3/bronze-warden.ts
- [x] [S] Add `Houndmaster` (tier 3 human, 4/3): battlecry give a friendly Beast +2/+2 and Taunt — src/game/minions/tier3/houndmaster.ts
- [x] [S] Add `Soul Devourer` (tier 3 demon, 3/3): battlecry consume a friendly Demon (remove it from board), gain its ATK and HP — src/game/minions/tier3/soul-devourer.ts

### New minions — Tier 5 (additional)

- [x] [S] Add `Mal'Ganis` (tier 5 demon, 9/7): at start of combat, give all other friendly Demons +2/+2 — onStartOfCombat aura in src/game/minions/tier5/malganis.ts
- [x] [S] Add `Goldrinn the Great Wolf` (tier 5 beast, 4/4): whenever a friendly Beast is played to board, give ALL friendly Beasts +5 ATK — onShopSummon tribe check in src/game/minions/tier5/goldrinn.ts
- [x] [S] Add `Lil' Rag` (tier 5 elemental, 1/1): when you play an Elemental in the tavern, give all other friendly Elementals +1/+1 — onShopSummon tribe=Elemental check in src/game/minions/tier5/lil-rag.ts

### Simulation tests — existing minions need coverage

- [x] [S] Add tests/simulation/baron-rivendare.sim.test.ts — verify Baron on left side causes deathrattles to fire 2x; golden+baron stacks multiplicatively; Baron on right side does not affect left deathrattles
- [x] [S] Add tests/simulation/knife-juggler.sim.test.ts — verify Knife Juggler fires 1 damage to a random enemy whenever a friendly minion is summoned (including tokens from deathrattles)
- [x] [S] Add tests/simulation/scavenging-hyena.sim.test.ts — verify Scavenging Hyena gains +2/+1 each time a friendly Beast dies in combat; golden Hyena gains double
- [x] [S] Add tests/simulation/selfless-hero.sim.test.ts — verify Selfless Hero deathrattle gives divine shield to a random friendly minion that doesn't already have one
- [x] [S] Add tests/simulation/unstable-ghoul.sim.test.ts — verify Unstable Ghoul deathrattle deals 1 damage to ALL other minions on both sides
- [x] [S] Add tests/combat/magnetic.test.ts — verify Magnetic keyword attaches mech's stats and keywords to the rightmost friendly Mech on board, and the attached mech has combined stats
- [x] [S] Add tests/combat/lifesteal.test.ts — verify lifesteal heals attacking minion's HP equal to damage dealt; verify lifesteal does NOT trigger when damage is fully absorbed by divine shield
- [x] [S] Add tests/simulation/murloc-warleader-death.sim.test.ts — verify that when Murloc Warleader dies mid-combat, the +2 ATK aura is removed and buffed murlocs revert to base ATK immediately

### AI improvements

- [x] [M] Greedy AI: add unit test verifying it upgrades tavern tier when board has ≥4 minions and gold ≥ upgradeCost — tests/ai/greedy-upgrade.test.ts
- [x] [S] AI plays battlecry minions before non-battlecry minions from hand each turn — sort hand by hasBattlecry before play loop in all three AI strategies
- [x] [S] Heuristic AI: sell weakest board minion (lowest atk+hp) when hand is at capacity (≥10) to make room — sell-to-make-room check already exists in heuristic.ts lines 152-164

### UI polish (verifiable by reading code, no browser needed)

- [x] [S] Tier-up animation: add a 500ms CSS pulse class on the Tavern Tier badge when player upgrades — tierFlashKey state + @keyframes tierFlash already implemented in app/game/page.tsx lines 499, 539, 827, 1546-1551
- [x] [S] Sell undo: after selling a board or hand minion, show a 1.5s "Undo" floating button that restores the minion to hand at no cost — add sellHistory: MinionInstance | null state, show UndoSell button with setTimeout cleanup (already implemented in app/game/page.tsx lines 506-555, 924-930)
- [x] [S] Show turn number in HUD — display current turn as "Turn N" badge next to gold; read from gameState.turn in app/game/page.tsx (already displayed at line 866)

### Game-rule completeness

- [x] [S] Add `onDamageTaken` hook to MinionHooks — fires when a minion takes damage (used by Imp Gang Boss, Imp Mama); wire into combat.ts applyDamage after divine-shield resolution, passing damage amount
- [x] [S] Add `onAllyAttack` hook to MinionHooks — fires when a friendly minion attacks (used by Ripsnarl Captain); wire into main combat loop just before applyDamage, passing attacker reference
- [x] [S] Add `onHeroDamaged` hook to RecruitCtx and wire into applyCombatResult — fires when the player's hero takes damage from combat; pass damage amount to all board minions
- [x] [S] Add `onDiscover` hook to MinionHooks — fires when a discover offer is presented (triples, hero powers, Yogg-Saron), wired into dismiss/pick discover in state.ts

---

## Soon

### Engine extensions

- [x] [S] Pool depletion: track removed minions in a global pool per cardId; rollShop should never offer more copies than remain in the pool — pool tracking already implemented in shop.ts (buildPool, drawFromPool, returnToPool), GameState.pool, and pool.test.ts
- [x] [S] Add `onSpellPlay` hook to RecruitCtx alongside onCast — fires when player plays any spell, so future minions can react to spell plays in the recruit phase (distinct from onCast which is combat-only)
- [x] [S] Validate board-size cap in combat deathrattle summoning: new tokens should not push either board past 7 minions — add guard in the deathrattle summon path in combat.ts

### More minions

- [x] [S] Add `Imprisoner` golden test — verify golden Imprisoner (2/6) summons two 2/2 Imps on death (deathrattle fires 2x for golden)
- [x] [S] Add `Murloc Warleader` interaction test — verify that when Murloc Warleader dies mid-combat, the aura is removed and previously-buffed murlocs revert to their base ATK
- [x] [S] Add `Deflect-o-Bot` divine-shield test — verify that every odd-cost mech played to board restores divine shield on Deflect-o-Bot

### Hero completeness

- [x] [S] Add `Millificent Manastorm` hero test — verify hero power buffs ALL friendly Mechs +1/+1 when a Mech is bought from the shop, and that golden Mechs also get buffed
- [x] [S] Add `King Mukla` hero test — verify hero power gives the opponent 2 Bananas in their hand, and that playing a Banana on a minion gives +1/+1

### Combat hook completeness

- [x] [S] Add `onAttacked` hook to MinionHooks and wire into combat.ts applyDamage — fires when a minion is the target of an attack (as defender), used by future minions that react to being attacked
- [x] [S] Add `onAllyKill` hook to MinionHooks and wire into combat.ts death handling — fires when a friendly minion scores a kill, used by future minions that react to kills
- [x] [S] Add `onSell` hook to combat.ts — fires when a minion is sold during combat (e.g., from deathrattle summons), so minions can react to sell events in combat
- [x] [S] Wire `onBuy` hook into buyMinion in shop.ts — fires when a minion is bought from the shop (before it is played from hand to board)
- [x] [S] Add `onTurnStart` hook to MinionHooks and wire into beginRecruitTurn — fires at start of each recruit phase for all board minions, used by future minions that react to turn starts (already implemented: types.ts:112, state.ts:1005-1016)
- [x] [S] Add `onDiscover` hook to MinionHooks — fires when a discover offer is presented (triples, hero powers, Yogg-Saron), wired into dismiss/pick discover in state.ts

---

### New minions — Tier 3

- [ ] [S] Add `Buccaneer` (tier 3 pirate, 3/2): battlecry give a friendly Pirate +2/+2 — src/game/minions/tier3/buccaneer.ts

### New minions — Tier 4

- [ ] [S] Add `Gnoma Tinker` (tier 4 mech, 3/3): battlecry summon a 1/1 Mech token — src/game/minions/tier4/gnoma-tinker.ts

### New minions — Tier 5

- [ ] [S] Add `Blingtron 3000` (tier 5 mech, 3/8): battlecry summon two 1/1 Mechs with Rush — src/game/minions/tier5/blingtron-3000.ts

## Done (completed items — do NOT redo)

- [x] All keywords: taunt, divineShield, windfury, megaWindfury, poisonous, reborn, venomous, cleave, lifesteal, rush, freeze, collateralDamage, magnetic, combo, bounty, spellDamage
- [x] Wire battlecry / deathrattle / start-of-combat / onDivineShieldPop hooks
- [x] Gold-per-turn ramp, shop size scaling, board size cap
- [x] Reborn in combat (1 HP, keyword removed), Divine shield (absorb + remove)
- [x] Full UI: shop, board, hand, HUD, combat animation, leaderboard, victory screen
- [x] Combat state machine, triple detection, golden minions (battlecry/deathrattle 2x)
- [x] Heroes: Rakanishu, Patchwerk, Lich Baz'hial, Ysera, Jandice Barov, Yogg-Saron, The Curator, King Mukla, George the Fallen, Ragnaros, Sir Finley, Scabbs Cutterbutter, AF Kay, Edwin Van Cleef, Millificent Manastorm, Trade Prince Gallywix, Sindragosa, Jaraxxus, Reno Jackson, Maiev Shadowsong, Pyramad
- [x] Spells: Mystery Shot, Cauterizing Flame, Tavern Brawler, Brawl, Tavern Tipper, Bananas, Swat Team
- [x] Anomalies: Golden Touch, Heavy Hitters, Double Down, Liquified, Armored Up, Tavern Discount, Big League, Extra Life
- [x] Quests (Murloc Mania, Mech Mayhem, Demon Diplomacy), Buddies (Ymber, RoLo, Goblin Minion), Trinkets
- [x] Bounty keyword (gold on death), Lifesteal no-trigger on divine shield, Frozen shop persistence
- [x] Combat boards sorted ATK desc, combat alternation by turn, reborn resets stats
- [x] Magnetic stacks on rightmost mech, golden + Brann 4x multiplicative battlecry
- [x] rng.pick() replaces Math.floor(rng.next() * n) across all random selection
- [x] Spell targeting UI, shop shows buffed stats, combat transcript Stat events
- [x] Combat result toast (5s), AI uses hero powers, AI freezes shop, AI prefers tribe match
- [x] Deathrattles fire left-to-right, deathrattle summons placed at dead minion's index
- [x] onMinionSold hook, spellCardId on onCast, onShopSummon hook
- [x] Minions: Alley-Cat, Bloodsail Pirate, Boarlog Captain, Bristleback Boys, Dragonspawn Lieutenant, Flame Imp, Gnoma Tinker, Murloc Tidecaller, Murloc Tidehunter, Murloc Tinyfin, Rockpool Hunter, Righteous Protector, Venomous Crasher, Windfury Minion, Wrath Weaver (tier 1)
- [x] Minions: Annoy-o-Tron, Deflect-o-Bot, Glyph Guardian, Harvest Golem, Imprisoner, Kaboom Bot, Knife Juggler, Metaltooth Leaper, Murloc Warleader, Nightmare Amalgam, Pack Leader, Pogo-Hopper, Scavenging Hyena, Selfless Hero, Spawn of N'Zoth, Unstable Ghoul, Vulgar Homunculus (tier 2)
- [x] Minions: Arcane Tinker, Cobalt Scalebane, Coldlight Seer, Imp Gang Boss (stub), Infested Wolf, Queen of Pain, Screwjank Clunker, Scurpus, Soul Juggler, Stonehill Defender, Tortollan Shellraiser (tier 3)
- [x] Minions: Annihilan Battlemaster, Bolvar Fireblood, Boulderfog Ogre, Broodkin Zealot, Cave Hydra, Crystalweaver, Defender of Argus, Drakonid Enforcer, Naga Secret Guardian, Old Murk-Eye, Security Rover, Toxfin, Virmen Sensei (tier 4)
- [x] Minions: Alexstrasza, Baron Rivendare, Bigfernal, Blingtron 5000, Brann Bronzebeard, Junkbot, Lightfang Enforcer, Mogor, Murozond, Strongshell Scavenger, Tide-Razor (tier 5)
- [x] Minions: Foe Reaper 4000, Gentle Megasaur, Ghastcoiler, Kalecgos, Mama Bear, Sneed's Old Shredder, Ysera the Dreamer (tier 6)
- [x] Tests: cleave, windfury/megaWindfury, deathrattle-position, golden, brann, combo, poisonous+divine-shield, sell-synergy, damage calculation

---

## Quarantined (failed multiple times — DO NOT pick)

(Tasks added by the harness when an iteration's CHOSEN TASK fails go here.)
