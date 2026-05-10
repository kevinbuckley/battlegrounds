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

## Now — Hero tests & content (pick these first)

- [x] [S] Fix Jaraxxus passive — wire onTurnStart in src/game/shop.ts: when player.heroId === "jaraxxus", buff all Demons in player.shop by +1/+1 (just like Sindragosa buffs frozen); add tests/heroes/jaraxxus.test.ts: state with Demon in shop + Jaraxxus hero; trigger TurnStart step → Demon becomes 2/2; non-Demon shop minion unchanged — src/game/shop.ts + tests/heroes/jaraxxus.test.ts

- [x] [S] Add tests/heroes/yogg-saron.test.ts — verify Yogg-Saron hero power (2g): with seeded RNG, board minions all gain the same randomly chosen keyword after onHeroPower; board with 2 minions → both have identical new keyword; empty board → state unchanged; use heroPower helper and makeRng(42) — tests/heroes/yogg-saron.test.ts

- [x] [S] Add tests/heroes/maiev-shadowsong.test.ts — verify Maiev Shadowsong hero power (1g): targeting shop index 0 adds "dormant" to shop[0].keywords and sets shop[0].attachments.dormantTurnsLeft = 2; targeting out-of-range index is a no-op; other shop slots unaffected — tests/heroes/maiev-shadowsong.test.ts  (ALREADY COVERED in src/game/heroes.test.ts lines 770-835)

- [x] [S] Add tests/shop/gentle-megasaur.test.ts — verify Gentle Megasaur (tier 6 beast, 5/4) battlecry gives all friendly Murlocs a random keyword (seeded RNG); board: [Murloc Scout 1/1, Beast 2/2]; play Megasaur → Scout.keywords has 1 new keyword, Beast unchanged; empty board (no Murlocs) → no keyword added — tests/shop/gentle-megasaur.test.ts

- [x] [S] Add tests/shop/mogor-the-curse-golem.test.ts — verify Mogor the Curse-Golem (tier 5 mech, 4/5) battlecry gives all friendly Mechs +2/+2; board: [Mech 1/1, non-Mech 2/2]; play Mogor → Mech becomes 3/3; non-Mech unchanged; no Mechs → no buff — tests/shop/mogor-the-curse-golem.test.ts

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

- [x] [S] Add 3 new trinkets — `golden_scales` (random friendly minion +3/+3 and divineShield), `demonic_pact` (all friendly Demons +1 ATK), `beastly_tooth` (all friendly Beasts +2 ATK); add to TRINKETS registry; write 3 describe blocks in src/game/trinkets.test.ts verifying each onApply mutates board correctly — src/game/trinkets/index.ts + src/game/trinkets.test.ts

- [x] [S] Add 3 new anomalies — `big_stats` (all shop minions +2/+2 on setup), `pirate_cove` (all Pirates in shop +2 ATK on setup), `undead_plague` (all minions gain reborn on setup); export and register in ANOMALIES; create src/game/anomalies/anomalies.test.ts with 3 tests verifying each onSetup — src/game/anomalies/index.ts + tests

- [x] [S] Add `Dragon Diplomacy` quest — trigger: win 3 combats while having 3+ Dragons on board; reward: all friendly Dragons +3/+3; onProgress checks dragon count and combat win; isComplete when progress >= 3; add to QUESTS; 2 tests — src/game/quests/index.ts + src/game/quests.test.ts

- [x] [S] Add `Beast Mastery` quest — trigger: sell 4 Beasts from board (onSell hook); reward: all friendly Beasts +2/+2; onProgress increments when a Beast is sold; add to QUESTS; 2 tests verifying progress and reward — src/game/quests/index.ts + src/game/quests.test.ts

- [x] [S] Add tests/simulation/cave-hydra.sim.test.ts — verify Cave Hydra (tier 4 beast, 2/4, cleave) deals its attack damage to ALL adjacent enemies when it attacks; board: [Cave Hydra 2/4] vs [1/3, 1/3, 1/3]; Hydra attacks center enemy → center takes 2, both flanking enemies each take 2 too; all 3 enemies die; verify Damage events in transcript for all 3 — tests/simulation/cave-hydra.sim.test.ts

- [x] [S] Add tests/simulation/virmen-sensei.sim.test.ts — verify Virmen Sensei (tier 4 murloc, 4/5) onBattlecry gives a random friendly Murloc +2/+2; board: [Murloc Scout 1/1]; play Virmen → Scout becomes 3/3; board with no Murloc → no buff; golden Virmen gives +4/+4 — tests/simulation/virmen-sensei.sim.test.ts  (ALREADY COVERED by tests/shop/virmen-sensei.test.ts — battlecry fires during shop play, not combat)

- [x] [S] Add tests/simulation/toxfin.sim.test.ts — verify Toxfin (tier 4 murloc, 1/2) onBattlecry gives a random friendly Murloc poisonous; board: [Murloc Scout 1/1]; play Toxfin → Scout.keywords includes "poisonous"; board with no Murloc → no keyword added; Toxfin does not gain poisonous itself — tests/simulation/toxfin.sim.test.ts  (ALREADY COVERED by tests/shop/toxfin.test.ts — battlecry fires during shop play, not combat)

- [x] [S] Add tests/simulation/defender-of-argus.sim.test.ts — verify Defender of Argus (tier 4, 2/3) battlecry gives adjacent board minions +1/+1 and taunt; play to position 1 with [2/2] at pos 0 and [3/3] at pos 2; both adjacents become 3/3 and gain "taunt"; verify no buff when no adjacents exist — tests/simulation/defender-of-argus.sim.test.ts  (ALREADY COVERED by tests/shop/defender-of-argus.test.ts — battlecry fires during shop play, not combat)

- [x] [S] Add tests/heroes/george-the-fallen.test.ts — verify George the Fallen hero power (2g active): targeting board index 0 adds "divineShield" to board[0].keywords; targeting an invalid index throws or is a no-op; using twice gives divineShield to two different minions — tests/heroes/george-the-fallen.test.ts

- [x] [S] Add tests/heroes/millificent-manastorm.test.ts — verify Millificent Manastorm hero power: when refresh or start-of-turn populates shop, all Mechs in shop gain +1/+1; build state with Manastorm hero, rollShopForPlayer → all Mechs in shop have atk+1, hp+1; non-Mechs unchanged — tests/heroes/millificent-manastorm.test.ts

- [x] [S] Add tests/heroes/pyramad.test.ts — verify Pyramad hero power (2g): calling onHeroPower gives a random friendly board minion +4 HP; board with 1 minion → that minion gains +4 HP; board with 3 minions → exactly 1 gains +4 HP (seeded RNG); empty board → state unchanged — tests/heroes/pyramad.test.ts

- [x] [S] Add tests/simulation/razorgore.sim.test.ts — verify Razorgore the Untamed (tier 6 dragon, 2/4) onStartOfCombat gains +1/+1 for each Dragon on board (including itself); board: [Razorgore, Dragon 2/2, Dragon 3/3] vs [10/10]; Razorgore gains +3/+3 → 5/7; solo Razorgore gains +1/+1 → 3/5; non-Dragon allies NOT counted — tests/simulation/razorgore.sim.test.ts

- [x] [S] Add tests/heroes/rakanishu.test.ts — verify Rakanishu hero power (2g): each Elemental in the shop gives a random friendly minion +2 ATK; build state with Rakanishu hero, 2 Elementals in shop, 1 board minion; fire heroPower → that minion gains +4 ATK (2×2); no Elementals in shop → no buff; empty board → no buff — tests/heroes/rakanishu.test.ts

- [x] [S] Add tests/heroes/scabbs-cutterbutter.test.ts — verify Scabbs Cutterbutter hero power (passive): after buying a minion, the next minion in the shop costs 1 less gold; build state with Scabbs hero, buy a minion → shop[0].discount increases by 1; buying again resets the discount; verify via discount field on shop minion — tests/heroes/scabbs-cutterbutter.test.ts  (ALREADY COVERED in tests/heroes/scabbs-cutterbutter.test.ts — active hero power giving +1/+1 to board minion)

- [x] [S] Add tests/heroes/ysera.test.ts — verify Ysera hero power (2g): calling onHeroPower adds one Dragon to the player's hand; the added card has tribes including "Dragon"; hand.length increases by 1; using twice adds 2 Dragons; seeded RNG — tests/heroes/ysera.test.ts  (ALREADY COVERED in tests/heroes/ysera.test.ts — passive adds Dragon to shop each turn)

- [x] [S] Add tests/heroes/ragnaros.test.ts — verify Ragnaros passive: start of combat, deal 8 damage to lowest-ATK enemy minion; build state with Ragnaros hero and 1 board minion; run combat; verify that minion's attack contribution matches the +6 bonus from ragnaros — tests/heroes/ragnaros.test.ts

- [x] [S] Add tests/simulation/amalgadon.sim.test.ts — verify Amalgadon (tier 6, 0/0) battlecry gains a random keyword for each different tribe among friendly board minions; board: [Beast 1/1, Mech 2/2, Murloc 1/1]; play Amalgadon → gains 3 keywords (one per tribe); board with 2 Beasts → only 1 tribe → gains 1 keyword; empty board → no keywords — tests/simulation/amalgadon.sim.test.ts  (ALREADY COVERED by tests/shop/amalgadon.test.ts — 6 passing tests, battlecry fires during shop play)

- [x] [S] Add tests/simulation/elistra.sim.test.ts — verify Elistra the Immortal (tier 6 dragon) deathrattle: when Elistra dies, a copy is added to the board; board: [Elistra 7/5] vs [10/10]; Elistra dies → new 7/5 Elistra appears (without deathrattle keyword to prevent infinite loop); survivorsLeft contains a Dragon after combat — tests/simulation/elistra.sim.test.ts  (ALREADY COVERED by existing tests/simulation/elistra.sim.test.ts — reborn behavior tested: returns at 1/1 with reborn removed, golden fires twice)


- [ ] [M] Fix quest win-detection in processQuests — onProgress in murlocMania/mechMayhem/demonDiplomacy uses flawed board-HP heuristics instead of actual combat result; rewrite processQuests in state.ts to pass the CombatResult winner field into quest progress calls; update all 4 quest cards' onProgress signatures to accept `winner: Side | "draw"`; add 2 regression tests — src/game/state.ts + src/game/quests/index.ts + src/game/quests.test.ts

---

## Soon — UI improvements

- [x] [S] Show active tribes in HUD — add an "Active Tribes" row in app/game/page.tsx HUD showing the 5 tribe names from `gameState.tribesInLobby` as small slate-700 pills with text-xs; position it below the tier indicator row; bun typecheck must pass — app/game/page.tsx

- [x] [S] Show active anomaly in HUD — if `gameState.modifierState.anomaly` is set, show the anomaly name as an amber badge in the HUD with a `title` tooltip showing its description; add a `getAnomaly(id)` export to anomalies/index.ts; bun typecheck — app/game/page.tsx + src/game/anomalies/index.ts

- [x] [S] Show quest progress in HUD — if `player.quests[0]` exists, show "Quest: <name> N/M" below the hero power button; a thin amber div with width proportional to progress/target; completed shows "✓ Done" in green; look up name via QUESTS[quest.cardId]; bun typecheck — app/game/page.tsx

---

## Soon — AI improvements

- [x] [M] AI tribe synergy scoring — replace `matchingTribeIndex` in basic.ts with `scoreBuy(minion, board)`: +3 for completing a triple, +2 for matching primary board tribe, +1 for any board tribe, 0 otherwise; rank all affordable shop minions by score and buy the highest-scored one; add a test: AI with Murloc board prefers a Murloc over same-cost non-Murloc — src/ai/heuristics/basic.ts + tests/ai/greedy-upgrade.test.ts

- [x] [S] AI sells weakest minion when board full — read sell-to-make-room logic in basic.ts; if it doesn't score before selling, update it to sell the board minion with lowest (atk+hp) score; ties broken by highest board index; add a test: AI with 7 minions buys a high-stat minion → weakest is sold — src/ai/heuristics/basic.ts + tests/ai/greedy-upgrade.test.ts

---

## Now — New tasks (pick these next)

- [x] [S] Add tests/shop/lil-rag.test.ts — verify Lil' Rag (tier 5, 1/1 Elemental) onPlay buffs all OTHER friendly Elementals +1/+1; board: [Elemental 2/2, non-Elemental 3/3]; play Lil' Rag → Elemental becomes 3/3; non-Elemental unchanged; Lil' Rag does NOT buff itself; second Elemental on board also buffed — src/game/minions/tier5/lil-rag.ts is already implemented (onPlay hook) — tests/shop/lil-rag.test.ts

- [x] [S] Add tests/shop/murozond.test.ts — verify Murozond (tier 5 dragon, 4/5) onBattlecry: adds a copy of a random enemy minion to hand; build state with Murozond in shop, opponent board has [Murloc Scout 1/1]; play Murozond → hand contains 1 new MinionInstance whose cardId matches the chosen enemy; empty enemy boards → hand unchanged — src/game/minions/tier5/murozond.ts is already implemented — tests/shop/murozond.test.ts

- [x] [S] Wire collateralDamage in combat.ts — when attacker.keywords has "collateralDamageN" (N=1,2,3), after the main attack resolves, deal N damage to every OTHER enemy (not the main defender); the defender still counterattacks normally; NOTE: bloodsail_pirate has collateralDamage1 — update the ripsnarl-captain.sim.test.ts hp assertion from 5 to the correct value based on actual collateral damage (pirate attacks e1: e1 takes 1+counterattacks, e2+e3 each take 1 collateral from pirate — captain hp changes accordingly); add tests/simulation/collateral-damage.sim.test.ts with 3 tests: [bloodsail_pirate 1/2] vs [5/5, 5/5] — both enemies take 1 collateral; [deathwing_raze_to_bone 8/8] vs [4/4, 4/4, 4/4] — 2 non-targets each take 3; no collateral when attacking solo target — src/game/combat.ts + tests/simulation/collateral-damage.sim.test.ts

- [x] [S] Add tests/simulation/murozond.sim.test.ts — verify Murozond (tier 5 dragon, 4/5) in combat simply attacks like a 4/5; it has no combat hooks; board: [Murozond] vs [3/3]; Murozond attacks (left turn=1): 3/3 takes 4 → dead, Murozond takes 3 → 4/2; left wins — tests/simulation/murozond.sim.test.ts

- [x] [S] Add tests/shop/strongshell-scavenger.test.ts — verify Strongshell Scavenger (tier 5, 2/3) onBattlecry gives all friendly Taunt minions +2/+2; board: [Taunt 1/1, non-Taunt 2/2]; play Strongshell → Taunt becomes 3/3; non-Taunt unchanged; board with 2 Taunt minions → both get +2/+2; no Taunts on board → no buff — src/game/minions/tier5/strongshell-scavenger.ts is already implemented — tests/shop/strongshell-scavenger.test.ts

- [x] [S] Add tests/simulation/deathwing-raze-to-bone.sim.test.ts — verify Deathwing, Raze to Bone (tier 8 dragon, 8/8, collateralDamage3) deals 3 bonus damage to all OTHER enemies when it attacking; board: [DRtB 8/8] vs [4/5, 4/5, 4/5]; DRtB attacks first enemy (4/5 → dead, DRtB takes 4 → 8/4); 2 other enemies each take 3 collateral (4/2, 4/2); verify both survive with 2 HP; also test: [DRtB] vs [4/4] — only one enemy, no collateral — tests/simulation/deathwing-raze-to-bone.sim.test.ts

- [x] [S] Add tests/shop/kalecgos.test.ts — verify Kalecgos, Arcane Aspect (tier 6 dragon, 4/8) onCast: when a spell is played, all friendly minions gain +1/+1; read kalecgos-arcane-aspect.ts to find the exact hook (onCast); find how to trigger a spell cast on a minion (look at src/game/shop.ts castSpell or similar); board: [minion 2/2]; cast a spell → minion becomes 3/3; board with 2 minions → both buffed — tests/shop/kalecgos.test.ts

- [x] [S] Add tests/simulation/friggent-northvalley.sim.test.ts — verify Friggent Northvalley (tier 6, 5/7 Beast) deathrattle summons a 2/3 Stalker to the ally side; read src/game/minions/tier6/friggent-northvalley.ts — it defines a local STALKER_CARD and on onDeath pushes it to the side array; test 1: [Friggent 5/7, ally 2/100] vs [6/6]; Friggent attacks 6/6 and both die; deathrattle fires — Stalker appears on ally side; survivorsLeft has 2 minions (ally + Stalker); test 2: board full (7 total) when Friggent dies → Stalker IS summoned (6 remain after filter, 6 >= 7 = false, room for 1) — tests/simulation/friggent-northvalley.sim.test.ts

- [x] [S] Add tests/simulation/terestian-manferris.sim.test.ts — verify Terestian Manferris (tier 6, 5/5 Mech) deathrattle gives a random friendly Mech +3/+3; NOTE: implementation bug fixed — must exclude ctx.self from filter (was picking itself); 3 tests: ally mech buffed, self NOT buffed, non-Mech unchanged — tests/simulation/terestian-manferris.sim.test.ts

- [x] [S] Add tests/shop/zixor-project-hope.test.ts — verify Zixor, Project Hope (tier 6, 3/6 Elemental) onBattlecry summons a random tier-5 minion directly to the player's board (NOT hand); read src/game/minions/tier6/zixor-project-hope.ts; build state: Zixor in shop, board has 1 minion, gold=10, tier=6; buy + play Zixor → board.length increases by 1 (Zixor + original + summoned tier-5); the summoned minion must have tier===5 (check MINIONS[summoned.cardId].tier); test 2: board full (6 minions + Zixor about to play = 7 full) → summon blocked (board.length stays at 7 after play) — tests/shop/zixor-project-hope.test.ts

- [x] [S] Add tests/shop/grimspeaker.test.ts — verify Grimspeaker (tier 3, 3/3 Demon) onBattlecry gives the first friendly Demon on board +2/+2 and adds taunt; read src/game/minions/tier3/grimspeaker.ts; board: [Vulgar Homunculus 3/4 Demon, Alley Cat 1/1 Beast]; play Grimspeaker → Homunculus becomes 5/6 and gains taunt; Beast unchanged; board with no Demons → no buff; Grimspeaker does NOT buff itself (it targets board[i] before being played) — tests/shop/grimspeaker.test.ts

- [ ] [S] Add tests/simulation/maexxna.sim.test.ts — verify Maexxna (tier 5, 2/12 Beast, poisonous) kills any minion in one hit regardless of HP; test 1: [Maexxna 2/12] vs [1/1000]; Maexxna attacks 1/1000 → 1000-HP enemy dies from poisonous (1 hit = instant death); Maexxna takes 1 → 2/11; left wins; test 2: [1/1000, plain] vs [Maexxna 2/12]; 1000-HP minion attacks Maexxna → Maexxna takes 1000 damage → dies; enemy survives (1/1000 minus 2 from counterattack = 1/998); right wins with Maexxna dead; test 3: [Maexxna 2/12] vs [taunt 3/5, 2/2]; Maexxna must attack taunt first → taunt dies instantly from poisonous; then attacks 2/2 → 2/2 dies; Maexxna wins — tests/simulation/maexxna.sim.test.ts

- [ ] [S] Add tests/simulation/grombi-the-rotunda.sim.test.ts — verify Grombi the Rotunda (tier 2, 2/3 Murloc, magnetic) onAllyKill gives itself +2/+2 each time ANY ally kills a minion (including Grombi itself); read src/game/minions/tier2/grombi-the-rotunda.ts — hook has no emit, directly mutates self.atk/hp; IMPORTANT: onAllyKill fires on ALL friendly minions when a kill happens (including the attacker), so Grombi gains +2/+2 even when Grombi itself kills; test 1: [Grombi 2/3, 10/10 ally] vs [1/1, 1/1]; 10/10 kills first 1/1 → Grombi gains +2/+2 → 4/5; 10/10 kills second → Grombi 6/7; survivor Grombi has atk=6; test 2: [Grombi 2/3] vs [1/1]; Grombi attacks and kills 1/1 → Grombi's own onAllyKill fires (self is in the allies list) → Grombi gains +2/+2 → 4/5; left wins with Grombi atk=4 — tests/simulation/grombi-the-rotunda.sim.test.ts

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
