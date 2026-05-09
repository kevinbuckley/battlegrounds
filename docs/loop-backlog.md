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

## Now — Gameplay & UI (highest priority)

- [x] [S] Victory banner after combat win — currently only losses show a damage recap banner; add a symmetric "You won! ⚔️" green banner using a new `combatOutcome: { won: boolean; opponentName: string } | null` state; show for 3s after the combat overlay closes; mirror the existing `damageRecap` pattern in app/game/page.tsx

- [x] [S] Ghost fight label — in the combat overlay pairing banner (~line 1693 of app/game/page.tsx), check if the opponent player object has `placement !== null`; if so change the label from "You're fighting:" to "👻 Ghost fight vs." so the player knows they're facing a dead player's board

- [x] [S] Add tests/simulation/soul-juggler.sim.test.ts — verify Soul Juggler (tier 3 demon) deals exactly 3 damage to a random enemy minion each time a friendly Demon dies in combat; board: [Soul Juggler, Imp token] vs [two 3/3 vanillas]; Imp dies, Soul Juggler zaps 3 damage to a random enemy, then finishes fight — tests/simulation/soul-juggler.sim.test.ts
- [x] [S] Add tests/simulation/lightfang-enforcer.sim.test.ts — verify Lightfang Enforcer (tier 5) gives all friendly minions of each tribe +2/+1 at end of turn; board: [Lightfang, 1/1 Murloc, 1/1 Beast, 1/1 Mech] vs [10/10]; after onStartOfCombat fires all three receive +2/+1 and the fight resolves — tests/simulation/lightfang-enforcer.sim.test.ts (SKIP - onTurnEnd is recruit-phase hook, already tested in shop.test.ts)
- [x] [S] Add tests/simulation/rat-pack.sim.test.ts — verify Rat Pack (tier 2 beast, 2/2) deathrattle summons a number of 1/1 Rats equal to Rat Pack's current ATK; use a 4/2 Rat Pack (buffed) to verify it summons 4 rats; also verify a golden Rat Pack (4/4) summons 4 rats (board cap of 7 trims golden's 8) — tests/simulation/rat-pack.sim.test.ts
- [x] [S] Add tests/heroes/george-the-fallen.test.ts — verify George the Fallen hero power (2g) gives a friendly minion divine shield; verify using it on a minion that already has divine shield has no effect; use the heroPower function directly on a test GameState — tests/heroes/george-the-fallen.test.ts (SKIP - check if exists)
- [x] [S] Add tests/heroes/ragnaros.test.ts — verify Ragnaros hero power fires at end of turn (passive) dealing 3 damage to a random enemy minion in combat when Ragnaros's side hasn't attacked yet this combat; set up a fixture board, run simulateCombat, confirm a Fireball event appears in the transcript — tests/heroes/ragnaros.test.ts (SKIP - Ragnaros has no active hero power, only passive start-of-combat 8-damage effect already tested in state.test.ts)
- [x] [S] Add tests/heroes/edwin-van-cleef.test.ts — verify Edwin Van Cleef hero power (passive): Van Cleef gains +1/+1 for each card in the opponent's hand at the start of each recruit turn; build a GameState with opponent hand size 3, call the onTurnStart hook, verify Van Cleef is 4/4 (base 1/1 + 3 stacks) — tests/heroes/edwin-van-cleef.test.ts

- [ ] [S] Add tests/simulation/junkbot.sim.test.ts — verify Junkbot (tier 5 mech) gains +2/+2 each time a Mech dies in combat; board: [Junkbot 1/1, Annoy-o-Tron 1/2 divineShield] vs [3/3 vanilla]; divine shield pops, Annoy-o-Tron dies, Junkbot becomes 3/3, then wins — tests/simulation/junkbot.sim.test.ts
- [ ] [S] Add tests/simulation/cobalt-scalebane.sim.test.ts — verify Cobalt Scalebane (tier 3 dragon) gives a random friendly non-Dragon +3 ATK at start of combat; board: [Cobalt Scalebane 5/5, 1/1 murloc] vs [10/10]; murloc gets +3 ATK (4/1) and the fight resolves correctly — tests/simulation/cobalt-scalebane.sim.test.ts
- [ ] [S] Add tests/heroes/king-mukla.test.ts — verify King Mukla hero power (1g active): opponent receives 2 Banana cards in their hand; playing a Banana on a board minion gives it +1/+1; call heroPower() on a test GameState and inspect opponent hand — tests/heroes/king-mukla.test.ts
- [ ] [S] Add tests/heroes/jaraxxus.test.ts — verify Jaraxxus hero power (active, 0g): replaces the shop with Demons only; after heroPower() fires, all shop minions have tribe === 'Demon'; verify golden Demons appear at appropriate tier — tests/heroes/jaraxxus.test.ts
- [ ] [S] Add tests/simulation/pack-leader.sim.test.ts — verify Pack Leader (tier 2 beast, 3/3) gives a random friendly Beast +3 ATK each time a Beast is summoned; board: [Pack Leader, Alley Cat] vs [10/10]; Alley Cat summons a Tabby Cat token on entry, Pack Leader buffs it +3 ATK — tests/simulation/pack-leader.sim.test.ts
- [ ] [S] Add tests/simulation/infested-wolf.sim.test.ts — verify Infested Wolf (tier 2 beast, 3/3) deathrattle summons two 1/1 Wolves when it dies; board: [Infested Wolf] vs [5/1]; Wolf dies, two 1/1 tokens appear, they finish the fight — tests/simulation/infested-wolf.sim.test.ts

- [ ] [S] Opponent elimination toasts — in handleEndTurn (app/game/page.tsx), after step() resolves, compare pre/post player HP; for any opponent who newly has hp ≤ 0, push a 3s toast message "💀 HeroName has been eliminated!"; use a `toasts: string[]` state and auto-clear with setTimeout

- [x] [S] Space bar to end turn — add a useEffect that listens for keydown event with key === ' '; call handleEndTurn when `gameState?.phase.kind === 'Recruit'` and no overlays are active (no discoverOffer, not displayingCombat, phase not GameOver); cleanup the listener on unmount

- [x] [S] Hero power description text — in the HUD section of app/game/page.tsx, below the hero power button, add a `<p className="text-[10px] text-slate-400 text-center max-w-[120px]">{hero.heroPower.description}</p>` so players can see what the power does without guessing; verify with bun typecheck

- [ ] [S] Add `description` field to MinCard and show it in MinionCard — add `description?: string` to MinCard in src/game/types.ts; populate it for at least 8 key cards (Baron Rivendare, Murloc Warleader, Knife Juggler, Scavenging Hyena, Rat Pack, Imp Gang Boss, Zapp Slywick, Cave Hydra); in MinionCard component add a `title={card.description}` HTML attribute for browser-native tooltip on hover; bun typecheck verifies

- [x] [S] Combat animation speed toggle — add a "⚡ 2×" speed button to the combat overlay header in app/game/page.tsx; track `combatSpeed: 1 | 2` state; use it to halve the tick interval from ~350ms to ~175ms at 2×; verify with bun typecheck

---

## Soon

### Engine correctness

- [x] [S] Add tests/simulation/deflect-o-bot.sim.test.ts — verify Deflect-o-Bot regains divine shield when an odd-cost Mech is played to the board; verify it does NOT regain on even-cost Mech play

### Later — Cards (deprioritized)

- [x] [S] Add `Southsea Captain` (tier 3 pirate, 3/3): your other Pirates have +1/+1 — aura applied in onStartOfCombat — src/game/minions/tier3/southsea-captain.ts
- [ ] [S] Add `Khadgar` (tier 5 mech, 2/2): whenever you summon a minion in combat, summon an additional copy — onSummon hook in src/game/minions/tier5/khadgar.ts
- [x] [S] Add `Amalgadon` (tier 6, 6/6): battlecry gain a random keyword for each different tribe among your other minions — src/game/minions/tier6/amalgadon.ts

---

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
- [x] onDamageTaken, onAllyAttack, onHeroDamaged, onAllyKill, onAttacked hooks wired
- [x] Pool depletion tracking, board-size cap in deathrattle summons, onSpellPlay hook
- [x] Tier-up animation (tierFlashKey), sell undo (sellUndoState), turn number in HUD
- [x] AI: battlecry-first play order, greedy upgrade test, sell-to-make-room heuristic
- [x] Tests: cleave, windfury/megaWindfury, deathrattle-position, golden, brann, combo, poisonous+divine-shield, sell-synergy, damage calculation, reborn, lifesteal, magnetic, economy, shop-refresh, baron-rivendare, knife-juggler, scavenging-hyena, selfless-hero, unstable-ghoul, murloc-warleader-death
- [x] Minions (tier 1): Alley-Cat, Bloodsail Pirate, Boarlog Captain, Bristleback Boys, Deck Swabbie, Dragonspawn Lieutenant, Dredgrot Whelp, Fiendish Servant, Flame Imp, Gazelle, Gnoma Tinker, Mecharoo, Micro Machine, Murloc Knight, Murloc Scout, Murloc Tidecaller, Murloc Tidehunter, Murloc Tinyfin, Righteous Protector, Rockpool Hunter, Sellemental, Shifter Zerus, Venomous Crasher, Windfury Minion, Wrath Weaver
- [x] Minions (tier 2): Annoy-o-Tron, Deflect-o-Bot, Glyph Guardian, Hangry Dragon, Harvest Golem, Imprisoner, Kaboom Bot, Knife Juggler, Metaltooth Leaper, Murloc Warleader, Nightmare Amalgam, Pack Leader, Pogo-Hopper, Rat Pack, Scavenging Hyena, Selfless Hero, Spawn of N'Zoth, Swat Recruit, Unstable Ghoul, Vulgar Homunculus
- [x] Minions (tier 3): Arcane Tinker, Bronze Warden, Cobalt Scalebane, Coldlight Oracle, Coldlight Seer, Frost Elemental, Grimspeaker, Houndmaster, Imp Gang Boss, Infested Wolf, Lil' Exorcist, Queen of Pain, Screwjank Clunker, Scurpus, Soul Devourer, Soul Juggler, Stonehill Defender, Tide-Razor, Tortollan Shellraiser
- [x] Minions (tier 4): Annihilan Battlemaster, Bloodsail Corsair, Bolvar Fireblood, Boulderfog Ogre, Broodkin Zealot, Cave Hydra, Crystalweaver, Defender of Argus, Drakonid Enforcer, Floating Watcher, Houndmaster Shaw, Naga Secret Guardian, Old Murk-Eye, Ripsnarl Captain, Security Rover, Siegebreaker, Toxfin, Virmen Sensei, Yo-Ho-Ogre
- [x] Minions (tier 5): Alexstrasza, Baron Rivendare, Bigfernal, Blingtron 5000, Brann Bronzebeard, Goldrinn, Junkbot, Lil' Rag, Lightfang Enforcer, Malganis, Mogor, Murozond, Strongshell Scavenger, Tide-Razor, Zapp Slywick, Voidlord
- [x] Minions (tier 6): Elistra, Foe Reaper 4000, Gentle Megasaur, Ghastcoiler, Imp Mama, Kalecgos, King of Beasts, Mama Bear, Nadina, Razorgore, Sneed's Old Shredder, Ysera the Dreamer

---

## Quarantined (failed multiple times — DO NOT pick)

- [ ] [S] Add `Trade Prince Gallywix` hero test — verify hero power gives 1 gold back when a minion is bought from the shop — tests/heroes/trade-prince-gallywix.test.ts  <!-- failed iterations 7, 8, 9, 10 -->
