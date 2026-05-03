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

### Combat correctness — high impact, easy to test

- [x] [S] Add unit test verifying poisonous + divine shield interaction: poisonous attacker hits a divine-shielded defender → shield pops, defender survives at full HP, poisonous keyword lost (one-shot). Test in tests/combat/ (already covered by existing test in keywords.sim.test.ts line 83-89)
- [ ] [S] Add unit test verifying cleave damage hits exactly the two minions adjacent to the defender (left and right), not all friendlies — tests/combat/cleave.test.ts
- [ ] [S] Add unit test verifying windfury attacks twice per turn, megaWindfury attacks four times — tests/combat/windfury.test.ts
- [ ] [S] Add unit test verifying reborn minions return at 1 HP with reborn keyword removed — tests/combat/reborn.test.ts (extend existing if present)
- [ ] [S] Add unit test verifying deathrattle of a minion that summons new minions: the summoned minions arrive at the dead minion's index (not appended) — tests/combat/deathrattle-position.test.ts
- [ ] [S] Add unit test verifying golden minions trigger battlecry/deathrattle exactly twice — tests/combat/golden.test.ts
- [ ] [S] Verify Brann + non-golden battlecry triggers 2x and Brann + golden triggers 4x — add unit test

### New minions — Tier 2 (only those NOT yet on disk)

- [ ] [S] Add `Pack Leader` (tier 2 beast): whenever a beast is summoned on your side, give it +3 ATK — onSummonAlly hook in src/game/minions/tier2/pack-leader.ts
- [ ] [S] Add `Pogo-Hopper` (tier 2 mech): battlecry gain +1/+1 for each Pogo-Hopper you've played this game — uses player.history counter
- [x] [S] Add `Nightmare Amalgam` (tier 2): no tribe, +0/+0 vanilla 2/4, but counts as ALL tribes for tribe-buff effects

### New minions — Tier 4 (only those NOT yet on disk)

- [ ] [S] Add `Old Murk-Eye` (tier 4 murloc): +1 ATK for each other murloc on the battlefield (both sides) — onStartOfCombat aura recompute
- [ ] [S] Add `Drakonid Enforcer` (tier 4 dragon): whenever a friendly minion loses divine shield, gain +2/+2 — onDivineShieldPop hook
- [x] [S] Add `Toxfin` (tier 4 murloc): battlecry give a friendly murloc poisonous

### New minions — Tier 5 (only those NOT yet on disk)

- [ ] [S] Add `Strongshell Scavenger` (tier 5): battlecry give all friendly taunt minions +2/+2
- [ ] [S] Add `Bigfernal` (tier 5 demon): whenever another friendly demon is summoned gain +2/+2

### New minions — Tier 6 (only those NOT yet on disk)

- [ ] [S] Add `Foe Reaper 4000` (tier 6 mech): cleave keyword (no other text)
- [ ] [S] Add `Sneed's Old Shredder` (tier 6 mech): deathrattle summon a random Legendary minion

### AI improvements

- [ ] [M] Greedy AI: upgrade tavern tier when it can afford it AND has at least 4 minions on board — implement as `greedy` strategy in src/ai/heuristics/greedy.ts (file may already exist as stub — check first)
- [ ] [S] AI tribe preference: basic AI prefers buying minions matching the most-frequent tribe on its current board over random
- [ ] [M] AI combat board placement: AI sorts board minions by ATK descending before combat starts (use existing sortBoardByAttack util if present)
- [ ] [S] AI plays battlecry minions before non-battlecry minions from hand each turn — alters takeAITurn ordering
- [ ] [S] AI freezes shop when it has ≥1 minion it can't afford this turn — current AIs never freeze

### New heroes (only those NOT yet on disk)

- [ ] [S] Add `Maiev Shadowsong` hero: active power (1g) — give a shop minion "Dormant for 2 turns, awakens with +3/+3" (file may exist — verify behavior)
- [ ] [S] Add `Reno Jackson` hero: active power (5g, once per game) — make a friendly minion golden (file may exist — verify cost is 5)
- [ ] [S] Add `Pyramad` hero: active power (1g) — give a random friendly minion +4 HP

### UI polish (no browser needed — verifiable by reading code)

- [ ] [S] Combat result toast: persist "You took X damage from Y" banner for 5 seconds (currently 3) — tweak CombatResultToast component or app/game/page.tsx
- [ ] [S] Tier-up animation: add a 500ms pulse on the Tavern Tier indicator when player upgrades (state: lastTierUpAt timestamp; CSS class on tier badge)
- [ ] [S] Sell undo: after selling, show a 1.5s "Undo" button that restores the minion to hand (use sellHistory state)

---

## Soon

### Game-rule fixes (verify spec in docs/game-rules/, then test)

- [ ] [S] Verify `applyDamageToPlayer` damage calculation matches spec in docs/game-rules/07-damage.md (1 base + 1 per surviving enemy minion + bonus for tier ≥4) — add unit test
- [ ] [S] Verify shop refresh cost is 1 gold (not 0) — add unit test in tests/shop/refresh.test.ts
- [ ] [S] Verify upgrade tier cost decreases by 1 each turn it isn't taken (tavern price reduction) — check src/game/economy.ts and add test

### Engine extensions

- [ ] [S] Add `onMinionSold` hook to effect hooks framework — fires when player sells a minion (used by future sell-synergy minions)
- [ ] [S] Combat transcript: include attacker's and defender's instanceIds in every "attack" event (UI uses to highlight which minion is fighting)
- [ ] [S] Add `onSpellCast` hook param including the cast spell's cardId so reactive minions can branch on spell type (Kalecgos already exists — verify it uses this)

### More minions for variety

- [ ] [S] Add `Murloc Tinyfin` (tier 1): vanilla 1/1 murloc (cheap warm-body)
- [ ] [S] Add `Dragonspawn Lieutenant` golden test: verify golden version has correct stats (4/6 if base is 2/3) — tests/minions/
- [ ] [S] Add `Tortollan Shellraiser` (tier 3 elemental): taunt; deathrattle give a random friendly minion +1/+3
- [ ] [S] Add `Tide-Razor` (tier 5 murloc): deathrattle summon three random murlocs

---

## Done (mirror of `loop-ledger.md` for human readability)

All entries below are already committed and must not be redone.

- [x] All keywords: taunt, divineShield, windfury, megaWindfury, poisonous, reborn, venomous, cleave, lifesteal, rush, freeze, collateralDamage, magnetic, combo, bounty, spellDamage — wired + tested
- [x] Wire battlecry hook into playMinionToBoard
- [x] Wire deathrattle hook (onDeath) into combat death resolution
- [x] Wire start-of-combat hook (onStartOfCombat) before first attack
- [x] Wire onDivineShieldPop hook into combat applyDamage
- [x] Gold-per-turn ramp: 3 gold turn 1, +1/turn up to 10 (economy.ts `baseGoldForTurn`)
- [x] Shop size scaling by tavern tier: 3/4/4/5/6/7
- [x] Board size cap: max 7 minions enforced
- [x] Reborn in combat: returns at 1 HP, reborn keyword removed
- [x] Divine shield: first damage absorbed, shield removed, event logged
- [x] Full UI: shop, board, hand, HUD, combat animation, leaderboard
- [x] Combat state machine: pair, resolve, damage, eliminations, GameOver
- [x] Triple detection + discover overlay; golden minion (battlecry/deathrattle 2x)
- [x] Heroes: Rakanishu, Patchwerk, Lich Baz'hial, Ysera, Jandice Barov, Yogg-Saron, The Curator, King Mukla, George the Fallen, Ragnaros, Sir Finley, Scabbs Cutterbutter, AF Kay, Edwin Van Cleef, Millificent Manastorm, Trade Prince Gallywix, Sindragosa, Jaraxxus, Reno Jackson — with hero select + HP/armor tests
- [x] Spells framework + Mystery Shot, Cauterizing Flame, Tavern Brawler, Brawl, Tavern Tipper, Bananas, Swat Team
- [x] Anomalies framework + Golden Touch, Heavy Hitters, Double Down, Liquified, Armored Up
- [x] Quest framework (Murloc Mania, Mech Mayhem, Demon Diplomacy)
- [x] Buddy framework (Ymber, RoLo, Goblin Minion)
- [x] Trinket framework + leaderboard display
- [x] Bounty keyword: gold awarded to winner when bounty minion dies in combat
- [x] Lifesteal does NOT trigger on divine-shield-absorbed hits
- [x] Combat boards sorted by ATK descending before combat
- [x] Bananas spell appears in tier 1 shops as no-target buff
- [x] Combat alternation by turn number (not board size)
- [x] Frozen shop stays frozen across turns; per-turn effects still fire
- [x] Reborn resets ATK/spellDamage to base 1/0
- [x] Magnetic stacks on rightmost same-tribe minion
- [x] Combat animation RNG matches state machine
- [x] Triples at tier 6 still create golden minions
- [x] Shop UI shows actual buffed stats, not base card stats
- [x] Sir Finley hero power swaps to another active hero
- [x] All 3 AI strategies use hero powers during recruit
- [x] Math.floor(rng.next() % n) replaced with rng.pick() across spells/minions/anomalies
- [x] Sindragosa passive checks freeze keyword on individual shop minions
- [x] Spell targeting UI requires player click (Banana, Brawl, Tavern Brawler)
- [x] Armor resets to 0 at start of recruit turn
- [x] Cauterizing Flame respects divine shield
- [x] Annihilan Battlemaster tracks total damage including damage absorbed by armor
- [x] Combat animation logs Lifesteal events (emerald color, bandage emoji)
- [x] Freeze Shop costs 1 gold (was 0)
- [x] Sindragosa/Jaraxxus passives read from newly rolled shop in beginRecruitTurn
- [x] sort-based shuffle replaced with rng.shuffle (Fisher-Yates) in shop/triples
- [x] Triples no longer fire mid-buy, only on EndTurn
- [x] Leaderboard shows opponent boards during recruit phase
- [x] Combat transcript emits Stat events after each attack cycle
- [x] Combat damage recap toast persists 3 seconds
- [x] Deathrattles fire left-to-right by board index
- [x] Buddies activate in beginRecruitTurn
- [x] buySpell uses absolute shop index correctly (not slice-relative)
- [x] applyCombatResult retains loser's surviving minions on board

---

## Quarantined (failed multiple times — DO NOT pick)

(Tasks added by the harness when an iteration's CHOSEN TASK fails go here.)
