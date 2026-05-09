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

- [x] [S] Add tests/simulation/cave-hydra.sim.test.ts — verify Cave Hydra (tier 4 beast, 2/4, cleave) damages the attacked target AND its two adjacent enemies; board: [Cave Hydra] vs [3/3, 3/3, 3/3]; Cave Hydra attacks, all 3 enemies take damage; verify transcript has 3 Damage events; also verify a 2-minion board correctly damages just 1 adjacent — tests/simulation/cave-hydra.sim.test.ts

- [x] [S] Add tests/simulation/voidlord.sim.test.ts — verify Voidlord (tier 5 demon, 3/9, taunt) deathrattle summons three 1/3 Demons with taunt; board: [Voidlord] vs [4/1 attacker]; Voidlord dies → deathrattle fires → three 1/3 Demon taunts appear; verify survivorsLeft.length ≥ 1 and all new Demons have taunt — tests/simulation/voidlord.sim.test.ts

- [x] [S] Add tests/simulation/mechano-egg.sim.test.ts — verify Mechano-Egg (tier 5 mech, 0/5) deathrattle summons an 8/8 Robosaur; board: [Mechano-Egg] vs [6/1]; Egg takes a hit and dies → deathrattle fires → 8/8 Robosaur appears and wins; verify survivorsLeft includes the Robosaur — tests/simulation/mechano-egg.sim.test.ts

- [x] [S] Add tests/simulation/zapp-slywick.sim.test.ts — verify Zapp Slywick (tier 5 mech, 7/10) always attacks the lowest-ATK enemy minion regardless of position; board: [Zapp] vs [1/1 murloc (position 1), 5/5 beast (position 0)]; verify the 1/1 dies first (Zapp targeted it) despite being at index 1; check transcript Attack events (kind: "Attack") for target ordering — tests/simulation/zapp-slywick.sim.test.ts

- [x] [S] Add tests/simulation/petrified-imp-quest.test.ts — verify Petrified Imps Quest gives 3x 1/1 Demons with Rush on first completion, stacks to 6x at progress=2, 9x at progress=3 (capped at board 7), all with Demon tribe and Rush keyword — tests/simulation/petrified-imp-quest.test.ts (verified 10/10 pass, bun typecheck clean, bun test 963/963 pass)

- [x] [S] Add tests/simulation/bolvar-fireblood.sim.test.ts — verify Bolvar Fireblood (tier 4 mech, 1/4 divineShield) gains +2 ATK each time a friendly divine shield is lost; board: [Bolvar] vs [3/3 enemy]; Bolvar attacks, enemy counterattacks popping Bolvar's shield, Bolvar gains +2 ATK → now 3 ATK; verify the Stat event in transcript shows atk=3; then verify Bolvar eventually wins (3 ATK vs remaining enemy HP); also add a test with [Bolvar, Annoy-o-Tron] vs [3/20] where the enemy lives long enough for both shields to pop — tests/simulation/bolvar-fireblood.sim.test.ts

- [x] [S] Add tests/simulation/southsea-captain.sim.test.ts — verify Southsea Captain (tier 3 pirate, 3/3) aura gives all other friendly Pirates +1/+1 at start of combat; board: [Southsea Captain, Bloodsail Pirate 2/3] vs [10/10]; verify Bloodsail Pirate has 3 ATK and 4 HP before first attack; also verify non-Pirates are NOT buffed — tests/simulation/southsea-captain.sim.test.ts

- [x] [S] Add tests/simulation/imp-mama.sim.test.ts — done
- [x] [S] Add tests/shop/amalgadon.test.ts — done
- [x] [S] Add tests/shop/murozond.test.ts — done
- [x] [S] Add tests/heroes/jandice-barov.test.ts — done

- [x] [S] Add tests/simulation/ghastcoiler.sim.test.ts — DONE (file exists)

- [x] [S] Add tests/simulation/malganis.sim.test.ts — verify Mal'Ganis (tier 5 demon, 9/7) onStartOfCombat gives all OTHER friendly Demons +2/+2; board: [Malganis, 1/1 Imp Demon] vs [10/10]; verify Imp has 3/3 before first attack; Malganis itself NOT buffed; non-Demon allies also NOT buffed — tests/simulation/malganis.sim.test.ts

- [x] [S] Add tests/simulation/kaboom-bot.sim.test.ts — verify Kaboom Bot (tier 2 mech, 3/2) deathrattle deals 4 damage to a random enemy; board: [Kaboom Bot] vs [3/6 enemy]; Kaboom Bot dies → 4 damage to the enemy → 1/2 remains; also verify 4 damage kills a 1/4 enemy (right board empty) — tests/simulation/kaboom-bot.sim.test.ts

- [x] [S] Add tests/simulation/glyph-guardian.sim.test.ts — verify Glyph Guardian (tier 2 dragon, 2/4) doubles its own ATK each time IT attacks; board: [Glyph Guardian] vs [1/1, 1/1, 1/1]; after first attack ATK becomes 4, after second 8; verify Stat events in transcript show the ATK doubling — tests/simulation/glyph-guardian.sim.test.ts

- [x] [S] Add tests/simulation/drakonid-enforcer.sim.test.ts — verify Drakonid Enforcer (tier 4 dragon, 3/6) gains +2/+2 when a FRIENDLY divine shield pops; board: [Drakonid, Annoy-o-Tron (has taunt+divineShield)] vs [3/10 enemy]; enemy targets Annoy-o-Tron (taunt), shield pops → Drakonid gains +2/+2 → 5/8; also verify a second test: [Drakonid] vs [Annoy-o-Tron] where the enemy's shield pops but Drakonid does NOT gain stats — tests/simulation/drakonid-enforcer.sim.test.ts

- [x] [S] Add tests/simulation/nadina.sim.test.ts — DONE (file exists)

- [x] [S] Add tests/simulation/ripsnarl-captain.sim.test.ts — verify Ripsnarl Captain (tier 4 pirate, 3/5) onAllyAttack gains +2/+2 when a friendly Pirate attacks; board: [Ripsnarl Captain, Bloodsail Pirate 2/3] vs [1/1, 1/1, 1/1]; each time Bloodsail Pirate attacks, Ripsnarl gains +2/+2; verify Stat events show ATK/HP growing — tests/simulation/ripsnarl-captain.sim.test.ts

- [x] [S] Add tests/simulation/security-rover.sim.test.ts — verify Security Rover (tier 4 mech, 1/4) spawns a 2/3 Mech with divine shield each time IT takes damage; board: [Security Rover] vs [3/3, 3/3]; first hit on Rover spawns a divine-shield bot; verify survivorsLeft grows after each hit on Rover — tests/simulation/security-rover.sim.test.ts

- [x] [S] Add tests/shop/defender-of-argus.test.ts — verify Defender of Argus (tier 4, 1/3) battlecry gives adjacent friendly minions +1/+1 and taunt; board: [minion A, Defender, minion B] at indices 0,1,2; play Defender at index 1 → minion A and B both gain +1/+1 and taunt; test with Defender at board edge (index 0) → only right neighbor gets buff — tests/shop/defender-of-argus.test.ts

- [x] [S] Add tests/shop/coldlight-seer.test.ts — verify Coldlight Seer (tier 3 murloc, 2/3) battlecry gives all friendly Murlocs +2 HP; board: [Murloc 1/1, Murloc 2/2, non-Murloc 3/3]; play Coldlight Seer → both Murlocs gain +2 HP (1/3 and 2/4); non-Murloc unchanged; Coldlight itself unchanged — tests/shop/coldlight-seer.test.ts

- [x] [S] Add tests/shop/houndmaster.test.ts — verify Houndmaster (tier 3, 4/3) battlecry gives a friendly Beast +2/+2 and taunt; board with [Beast 1/1, non-Beast 2/2]; play Houndmaster → Beast becomes 3/3 with taunt; non-Beast unchanged; board with no Beasts → no buff applied — tests/shop/houndmaster.test.ts

- [x] [S] Add tests/shop/strongshell-scavenger.test.ts — verify Strongshell Scavenger (tier 5, 2/3) battlecry gives all friendly minions with taunt +2/+2; board: [Taunt-minion 1/1, non-Taunt 2/2, Taunt-minion2 3/3]; play Strongshell → only taunt minions gain +2/+2 (3/3 and 5/5); non-taunt unchanged — tests/shop/strongshell-scavenger.test.ts

- [x] [S] Add tests/shop/virmen-sensei.test.ts — verify Virmen Sensei (tier 4 dragon, 3/4) battlecry gives a friendly Dragon +2/+2; board: [Dragon 1/1, non-Dragon 2/2]; play Virmen Sensei → Dragon gains +2/+2 (3/3); non-Dragon unchanged; board with no Dragons → no buff — tests/shop/virmen-sensei.test.ts

- [x] [S] Add tests/shop/toxfin.test.ts — verify Toxfin (tier 4 murloc, 1/3) battlecry gives ALL friendly Murlocs poisonous; board: [Murloc1, Murloc2, non-Murloc]; play Toxfin → both Murlocs gain poisonous keyword; non-Murloc is unchanged; Toxfin itself does not get poisonous — tests/shop/toxfin.test.ts

- [x] [S] Add tests/shop/sellemental.test.ts — verify Sellemental (tier 1 elemental, 1/1) onSell hook adds a 1/1 Elemental token to the player's hand; build GameState with Sellemental on board; dispatch("sell") → hand grows by 1; new card is an Elemental with tribe=["Elemental"] and atk=1/hp=1; selling a non-Sellemental does NOT add a token — tests/shop/sellemental.test.ts

- [x] [S] Add tests/simulation/siegebreaker.sim.test.ts — verify Siegebreaker (tier 4 demon, 5/8, taunt) onStartOfCombat gives all OTHER friendly Demons +1 ATK; board: [Siegebreaker, Imp 2/2 Demon] vs [10/10]; after onStartOfCombat the Imp should have 3 ATK (2+1 from Siegebreaker); Siegebreaker itself is NOT buffed; also verify non-Demons are NOT buffed — tests/simulation/siegebreaker.sim.test.ts  <!-- DONE: 4 tests pass -->

- [x] [S] Add tests/shop/murloc-tidecaller.test.ts — verify Murloc Tidecaller (tier 1 murloc, 1/1) gains +1 ATK via onRecruitSummon when a Murloc is summoned to the board during recruit phase; board: [Tidecaller 1/1]; play Murloc Scout (a Murloc) → Tidecaller becomes 2/1; play a non-Murloc → Tidecaller does NOT gain ATK; two Murlocs played → Tidecaller gains +2 ATK total — tests/shop/murloc-tidecaller.test.ts

- [x] [S] Add tests/shop/rockpool-hunter.test.ts — verify Rockpool Hunter (tier 1 murloc, 1/2) battlecry gives a random friendly Murloc +1/+1; board: [Murloc Scout 1/1]; play Rockpool Hunter → Murloc Scout becomes 2/2; board with no Murlocs → no buff; board with two Murlocs → one of them gains +1/+1 — tests/shop/rockpool-hunter.test.ts

- [x] [S] Add tests/simulation/micro-machine.sim.test.ts — verify Micro Machine (tier 2 mech, 1/2) gains +1 ATK at start of combat via onStartOfCombat; board: [Micro Machine 1/2] vs [2/10]; after onStartOfCombat Micro Machine should have 2 ATK; verify transcript Stat event shows atk=2; also verify two Micro Machines each gain +1 independently — tests/simulation/micro-machine.sim.test.ts

- [x] [S] Add tests/simulation/old-murk-eye.sim.test.ts — verify Old Murk-Eye (tier 4 murloc, 2/4) gains +1 ATK at start of combat for each other Murloc on the battlefield (both sides); board: [Old Murk-Eye, Murloc Scout 1/1] vs [Murloc Tidehunter 2/1, vanilla 3/3]; Murk-Eye should gain +3 ATK (3 other Murlocs) → 5 ATK total; verify via Stat events; also verify with no other Murlocs → no buff — tests/simulation/old-murk-eye.sim.test.ts  <!-- DONE: 5 tests pass -->

- [x] [S] Add tests/shop/lil-rag.test.ts — verify Lil' Rag (tier 5 elemental, 1/1) onPlay gives all OTHER friendly Elementals +1/+1 when Lil' Rag itself is played to board; board: [Elemental 1/1, non-Elemental 2/2]; play Lil' Rag → Elemental becomes 2/2, non-Elemental unchanged, Lil' Rag not buffed — tests/shop/lil-rag.test.ts

- [x] [S] Add tests/shop/kalecgos.test.ts — verify Kalecgos (tier 6 dragon) onCast gives ALL friendly board minions +1/+1 each time a spell is cast; build GameState with Kalecgos and 2 board minions; cast one spell → both gain +1/+1; cast second spell → both gain another +1/+1 — tests/shop/kalecgos.test.ts

- [x] [S] Add tests/simulation/queen-of-pain-lifesteal.sim.test.ts — DONE (already covered by tests/simulation/lifesteal.sim.test.ts with 8 tests covering lifesteal healing, divine shield interaction, and Queen of Pain)

- [x] [S] Add `Deathwing` (tier 8 dragon, 10/10): deathrattle destroys ALL other minions on both boards — onDeath hook in src/game/minions/tier8/deathwing.ts, requires modifying combat.ts reapDeaths to clear both boards, with 4 simulation tests — tests/simulation/deathwing.sim.test.ts

- [ ] [S] Add tests/shop/metaltooth-leaper.test.ts — verify Metaltooth Leaper (tier 2 mech, 3/3) battlecry gives ALL friendly Mechs +2 ATK; board: [Mech 1/1, Mech 2/2, non-Mech 1/1]; play Metaltooth → only Mechs gain +2 ATK; golden version gives +4 ATK — tests/shop/metaltooth-leaper.test.ts

- [ ] [S] Add tests/simulation/houndmaster-shaw.sim.test.ts — verify Houndmaster Shaw (tier 4 beast, 3/6) onStartOfCombat gives ALL other friendly minions the Rush keyword; board: [Shaw, vanilla 1/1, vanilla 2/2] vs [taunt 5/5]; verify both vanillas gain Rush (can attack any target), Shaw itself does NOT gain Rush; also verify a solo Shaw board gives no Rush to anyone — tests/simulation/houndmaster-shaw.sim.test.ts

- [ ] [S] Add tests/simulation/fiendish-servant.sim.test.ts — verify Fiendish Servant (tier 1 demon, 2/1) onDeath gives its current ATK to a random friendly minion; board: [Fiendish Servant 2/1, vanilla 1/4] vs [3/3]; Fiendish Servant attacks and dies → friendly vanilla gains +2 ATK (3/4); also verify a buffed Servant (4 ATK) gives +4; also verify with no other friendly minions → no crash — tests/simulation/fiendish-servant.sim.test.ts

- [ ] [S] Add tests/simulation/lil-exorcist.sim.test.ts — verify Lil' Exorcist (tier 3, 2/2, taunt) battlecry gives itself +1/+1 for each Deathrattle minion on both boards; build shop state with [Lil Exorcist in hand] and [Infested Wolf (deathrattle), plain 2/2] on board, enemy board has [Kaboom Bot (deathrattle)]; play Lil' Exorcist → it should gain +2/+2 (2 deathrattle minions); also verify 0 deathrattles → no buff — tests/simulation/lil-exorcist.sim.test.ts

- [ ] [S] Add tests/simulation/righteous-protector.sim.test.ts — verify Righteous Protector (tier 1, 1/1, taunt+divineShield) forces enemies to target it first (taunt) and absorbs the first hit with its divine shield; board: [Righteous Protector, 3/3] vs [2/4]; enemy must attack the Protector (taunt), divine shield pops (Protector stays alive at 1/1), then next enemy attack kills Protector; the 3/3 ally survives — tests/simulation/righteous-protector.sim.test.ts

- [x] [S] Add tests/heroes/scabbs-cutterbutter.test.ts — DONE (4 tests: gives friendly board minion +1/+1, does nothing with empty board, stacks across uses, does not affect shop minions)

- [ ] [S] Add tests/heroes/maiev-shadowsong.test.ts — verify Maiev Shadowsong hero power (active, 1g): make a shop minion dormant (gains the dormant keyword, stats doubled, removed from shop until next turn); verify heroPower() on a GameState with a shop minion makes it dormant; verify a dormant minion returns with doubled stats next turn via onTurnStart — tests/heroes/maiev-shadowsong.test.ts

- [x] [S] Add tests/heroes/ysera.test.ts — verify Ysera passive: at start of each turn, a random Dragon at your current Tavern Tier is added to the shop; build a GameState with Ysera at tier 3, advance a turn (beginRecruitTurn), verify shop contains at least one Dragon minion it didn't have before — tests/heroes/ysera.test.ts

- [x] [S] Victory banner after combat win — currently only losses show a damage recap banner; add a symmetric "You won! ⚔️" green banner using a new `combatOutcome: { won: boolean; opponentName: string } | null` state; show for 3s after the combat overlay closes; mirror the existing `damageRecap` pattern in app/game/page.tsx

- [x] [S] Ghost fight label — in the combat overlay pairing banner (~line 1693 of app/game/page.tsx), check if the opponent player object has `placement !== null`; if so change the label from "You're fighting:" to "👻 Ghost fight vs." so the player knows they're facing a dead player's board

- [x] [S] Add tests/simulation/soul-juggler.sim.test.ts — verify Soul Juggler (tier 3 demon) deals exactly 3 damage to a random enemy minion each time a friendly Demon dies in combat; board: [Soul Juggler, Imp token] vs [two 3/3 vanillas]; Imp dies, Soul Juggler zaps 3 damage to a random enemy, then finishes fight — tests/simulation/soul-juggler.sim.test.ts
- [x] [S] Add tests/simulation/lightfang-enforcer.sim.test.ts — verify Lightfang Enforcer (tier 5) gives all friendly minions of each tribe +2/+1 at end of turn; board: [Lightfang, 1/1 Murloc, 1/1 Beast, 1/1 Mech] vs [10/10]; after onStartOfCombat fires all three receive +2/+1 and the fight resolves — tests/simulation/lightfang-enforcer.sim.test.ts (SKIP - onTurnEnd is recruit-phase hook, already tested in shop.test.ts)
- [x] [S] Add tests/simulation/rat-pack.sim.test.ts — verify Rat Pack (tier 2 beast, 2/2) deathrattle summons a number of 1/1 Rats equal to Rat Pack's current ATK; use a 4/2 Rat Pack (buffed) to verify it summons 4 rats; also verify a golden Rat Pack (4/4) summons 4 rats (board cap of 7 trims golden's 8) — tests/simulation/rat-pack.sim.test.ts
- [x] [S] Add tests/heroes/george-the-fallen.test.ts — verify George the Fallen hero power (2g) gives a friendly minion divine shield; verify using it on a minion that already has divine shield has no effect; use the heroPower function directly on a test GameState — tests/heroes/george-the-fallen.test.ts (SKIP - check if exists)
- [x] [S] Add tests/heroes/ragnaros.test.ts — verify Ragnaros hero power fires at end of turn (passive) dealing 3 damage to a random enemy minion in combat when Ragnaros's side hasn't attacked yet this combat; set up a fixture board, run simulateCombat, confirm a Fireball event appears in the transcript — tests/heroes/ragnaros.test.ts (SKIP - Ragnaros has no active hero power, only passive start-of-combat 8-damage effect already tested in state.test.ts)
- [x] [S] Add tests/heroes/edwin-van-cleef.test.ts — verify Edwin Van Cleef hero power (passive): Van Cleef gains +1/+1 for each card in the opponent's hand at the start of each recruit turn; build a GameState with opponent hand size 3, call the onTurnStart hook, verify Van Cleef is 4/4 (base 1/1 + 3 stacks) — tests/heroes/edwin-van-cleef.test.ts

- [x] [S] Add tests/simulation/junkbot.sim.test.ts — verify Junkbot (tier 5 mech) gains +2/+2 each time a Mech dies in combat; board: [Junkbot 1/1, Annoy-o-Tron 1/2 divineShield] vs [3/3 vanilla]; divine shield pops, Annoy-o-Tron dies, Junkbot becomes 3/3, then wins — tests/simulation/junkbot.sim.test.ts
- [x] [S] Add tests/simulation/cobalt-scalebane.sim.test.ts — verify Cobalt Scalebane (tier 3 dragon) gives a random friendly non-Dragon +3 ATK at start of combat; board: [Cobalt Scalebane 5/5, 1/1 murloc] vs [10/10]; murloc gets +3 ATK (4/1) and the fight resolves correctly — tests/simulation/cobalt-scalebane.sim.test.ts
- [x] [S] Add tests/heroes/king-mukla.test.ts — verify King Mukla hero power (1g active): opponent receives 2 Banana cards in their hand; playing a Banana on a board minion gives it +1/+1; call heroPower() on a test GameState and inspect opponent hand — tests/heroes/king-mukla.test.ts
- [x] [S] Add tests/heroes/jaraxxus.test.ts — verify Jaraxxus hero power (passive): at the start of each recruit turn, all Demons in the shop get +1/+1; build a GameState with Jaraxxus and Demon minions in shop, call onTurnStart, verify each Demon's ATK and HP increased by 1; non-Demons should not be buffed — tests/heroes/jaraxxus.test.ts (SKIP - already tested in heroes.test.ts Jaraxxus passive describe block)
- [x] [S] Add tests/heroes/pyramad.test.ts — verify Pyramad hero power (active, 1g): gives a random friendly board minion +4 HP; build a GameState with Pyramad and 2 minions on board, call heroPower(), verify exactly one minion gained +4 HP and the other is unchanged; verify heroPowerUsed becomes true — tests/heroes/pyramad.test.ts
- [x] [S] Add tests/heroes/sindragosa.test.ts — verify Sindragosa hero power (passive): at start of each turn, frozen shop minions get +1/+1; build a GameState with Sindragosa, freeze 2 shop minions, call onTurnStart, verify frozen minions each gained +1/+1; un-frozen minions should not be buffed — tests/heroes/sindragosa.test.ts  <!-- DONE: tested in heroes.test.ts Sindragosa passive describe block (lines 377-449) -->
- [x] [S] Add tests/simulation/goldrinn.sim.test.ts — verify Goldrinn the Great Wolf (tier 5 beast, 4/4): onDeath gives all friendly Beasts +5/+5; board: [Goldrinn, 1/1 Alley Cat] vs [5/1 killer]; killer dies on exchange with Goldrinn, Goldrinn dies, Alley Cat becomes 6/6, then wins vs nothing — tests/simulation/goldrinn.sim.test.ts  <!-- DONE: 5 tests pass, also fixed goldrinn.ts from onShopSummon to onDeath -->
- [x] [S] Add tests/simulation/mama-bear.sim.test.ts — verify Mama Bear (tier 6 beast, 5/5): onSummon gives newly summoned friendly Beasts +5/+5; board: [Mama Bear, Rat Pack (2/2)] vs [10/10]; Rat Pack dies, summons 2 rats (each gets +5/+5 → 6/6), rats fight the 10/10 — tests/simulation/mama-bear.sim.test.ts (DONE: fixed implementation from onShopSummon to onSummon, fixed base stats 1/1→5/5, 4 tests pass)
- [x] [S] Fix Spawn of N'Zoth (tier 2 mech) — base stats 1/1→2/2, deathrattle +1/+1→+2/+2 to all friendly minions; 4 sim tests verify correct buff amount, self-exclusion, and enemy non-buffing — tests/simulation/spawn-of-nzoth.sim.test.ts + src/game/minions/tier2/spawn-of-nzoth.ts
- [x] [S] Add tests/heroes/lich-bazhial.test.ts — verify Lich Baz'hial hero power (active, 2g): lose 3 HP and gain 2 gold; verify using it reduces HP by 3, increases gold by 2, and works multiple times — tests/heroes/lich-bazhial.test.ts  <!-- DONE: 3 tests in heroes.test.ts Lich Baz'hial describe block -->
- [x] [S] Add tests/shop/pack-leader.test.ts — verify Pack Leader (tier 2 beast) onShopSummon gives a random friendly Beast +3 ATK when a Beast is played to board; build a GameState with Pack Leader on board and a Murloc Scout in hand; buy/play the Murloc Scout (non-Beast) → no buff; then with a Alley Cat in hand, play it → Pack Leader should buff it +3 ATK; test via state.ts reducer dispatch("play") — tests/shop/pack-leader.test.ts
- [x] [S] Add tests/simulation/infested-wolf.sim.test.ts — verify Infested Wolf (tier 3 beast, 3/3) deathrattle summons two 1/1 Spiders when it dies; board: [Infested Wolf] vs [5/1]; Wolf dies, two 1/1 tokens appear, they finish the fight — tests/simulation/infested-wolf.sim.test.ts

- [x] [S] Add tests/heroes/af-kay.test.ts — verify A.F. Kay hero definition: id=af_kay, startHp=40, startArmor=3, power kind=start_of_game, exists in HEROES registry — tests/heroes/af-kay.test.ts

- [x] [M] Wire A.F. Kay start_of_game power in makeInitialState — when player's heroId is 'af_kay', set player.tier=3, set player.shopRefreshesLeft=0 (shop already full), skip turns 1-2 (do not give gold, do not roll shop), apply on turn 3: roll full tier-3+ shop, set shopRefreshesLeft=2 — src/game/state.ts + tests/heroes/af-kay.test.ts

- [x] [S] Opponent elimination toasts — in handleEndTurn (app/game/page.tsx), after step() resolves, compare pre/post player HP; for any opponent who newly has hp ≤ 0, push a 3s toast message "💀 HeroName has been eliminated!"; use a `toasts: string[]` state and auto-clear with setTimeout

- [x] [S] Space bar to end turn — add a useEffect that listens for keydown event with key === ' '; call handleEndTurn when `gameState?.phase.kind === 'Recruit'` and no overlays are active (no discoverOffer, not displayingCombat, phase not GameOver); cleanup the listener on unmount

- [x] [S] Hero power description text — in the HUD section of app/game/page.tsx, below the hero power button, add a `<p className="text-[10px] text-slate-400 text-center max-w-[120px]">{hero.heroPower.description}</p>` so players can see what the power does without guessing; verify with bun typecheck

- [x] [S] Add `description` field to MinCard and show it in MinionCard — add `description?: string` to MinCard in src/game/types.ts; populate it for at least 8 key cards (Baron Rivendare, Murloc Warleader, Knife Juggler, Scavenging Hyena, Rat Pack, Imp Gang Boss, Zapp Slywick, Cave Hydra); in MinionCard component add a `title={card.description}` HTML attribute for browser-native tooltip on hover; bun typecheck verifies

- [x] [S] Combat animation speed toggle — add a "⚡ 2×" speed button to the combat overlay header in app/game/page.tsx; track `combatSpeed: 1 | 2` state; use it to halve the tick interval from ~350ms to ~175ms at 2×; verify with bun typecheck

- [x] [S] Add replay URL sharing — add 'Share Replay' button to GameOverOverlay that serializes the game state and copies a URL with the serialized replay as a base64 hash fragment; app/game/page.tsx parses #replay/<base64> hash on mount and restores the game state via deserializeReplay

- [x] [S] Add serializeReplay + deserializeReplay functions in src/game/state.ts — serializeReplay takes a GameState and returns a JSON string containing {seed, turn, players: [{id, heroId, hp, armor, tier, board: [{cardId, atk, hp, keywords, golden}], gold}], phase}; deserializeReplay takes the string and returns a GameState with the same state; verify with 3 tests: round-trip through makeInitialState, preserves board state, preserves gold/tier

---

## Soon

### Engine correctness

- [x] [S] Add tests/simulation/deflect-o-bot.sim.test.ts — verify Deflect-o-Bot regains divine shield when an odd-cost Mech is played to the board; verify it does NOT regain on even-cost Mech play  <!-- DONE: fixed wiring in shop.ts + tests/shop/deflect-o-bot.test.ts with 4 tests -->

### Later — Cards (deprioritized)

- [x] [S] Add tests/simulation/baelgun.sim.test.ts — verify Baelgun (tier 5, 4/5) battlecry gives a friendly Mech +2/+2 and Magnetic, does nothing when no friendly Mechs exist, stacks Magnetic across multiple Baelguns, and does not buff non-Mech minions
- [x] [S] Add `Khadgar` (tier 5 mech, 2/2): whenever you summon a minion in combat, summon an additional copy — onSummon hook in src/game/minions/tier5/khadgar.ts
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

- [x] [M] Add `Khadgar` (tier 5 mech, 2/2) — onSummon hook summons a copy of a random friendly minion when any minion is summoned in combat. Requires adding `summonedSide` field to `SummonCombatCtx` in types.ts and wiring it in `fireSummon` in combat.ts — tests/simulation/khadgar.sim.test.ts  <!-- DONE: khadgar.ts + khadgar.sim.test.ts exist and pass -->
