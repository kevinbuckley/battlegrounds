import type { Rng } from "@/lib/rng";
import { MINIONS } from "./minions/index";
import type {
  AllyDeathCombatCtx,
  AllyKillCtx,
  AttackCombatCtx,
  CombatCtx,
  CombatEvent,
  CombatResult,
  MinionInstance,
  Side,
  SummonCombatCtx,
} from "./types";

const SAFETY_LIMIT = 500;

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function simulateCombat(
  leftBoard: readonly MinionInstance[],
  rightBoard: readonly MinionInstance[],
  rng: Rng,
  anomaly?: import("./types").AnomalyId,
  turn?: number,
): CombatResult {
  if (leftBoard.length === 0 && rightBoard.length === 0) return resolved("draw", [], []);
  if (leftBoard.length === 0) return resolved("right", [], [...rightBoard]);
  if (rightBoard.length === 0) return resolved("left", [...leftBoard], []);

  const transcript: CombatEvent[] = [];
  const emit = (e: CombatEvent) => transcript.push(e);
  const lifestealAccum = { total: 0 };
  let totalBountyGold = 0;

  const isBigLeague = anomaly === "big_league";

  let left = leftBoard.map((m) => {
    const cloned = cloneMinion(m);
    if (isBigLeague) {
      cloned.atk += 1;
      cloned.hp += 1;
      cloned.maxHp += 1;
    }
    return cloned;
  });
  let right = rightBoard.map((m) => {
    const cloned = cloneMinion(m);
    if (isBigLeague) {
      cloned.atk += 1;
      cloned.hp += 1;
      cloned.maxHp += 1;
    }
    return cloned;
  });

  // Determine starting attacker: alternates by turn number, matching real
  // Battlegrounds where the starting attacker rotates each round regardless
  // of board sizes. Turn 1: left goes first, turn 2: right goes first, etc.
  const baronOnLeft = left.some((m) => m.baronRivendare);
  const baronOnRight = right.some((m) => m.baronRivendare);

  const startSide: Side =
    turn !== undefined ? (turn % 2 === 1 ? "left" : "right") : rng.next() < 0.5 ? "left" : "right";

  // Fire start-of-combat hooks (interleaved, attacker side first)
  fireStartOfCombat(left, right, startSide, emit, rng);

  // Fire rush attacks before the normal attack cycle
  fireRushAttacks(
    left,
    right,
    startSide,
    transcript,
    emit,
    rng,
    baronOnLeft,
    baronOnRight,
    lifestealAccum,
    {
      total: 0,
    },
  );

  let side: Side = startSide;
  let leftPtr = 0;
  let rightPtr = 0;

  for (let i = 0; i < SAFETY_LIMIT && left.length > 0 && right.length > 0; i++) {
    const isLeft = side === "left";
    const ptr = (isLeft ? leftPtr : rightPtr) % (isLeft ? left : right).length;

    const attacker = (isLeft ? left : right)[ptr]!;

    // Skip frozen minions — they cannot attack
    if (attacker.keywords.has("freeze")) {
      side = isLeft ? "right" : "left";
      continue;
    }

    // Pick primary target (taunt-aware)
    const target = pickTarget(isLeft ? right : left, rng, attacker, left, right);

    // How many times does this attacker attack this turn?
    // Windfury allows 2 attacks, megaWindfury allows 4.
    const attackCount = attacker.keywords.has("megaWindfury")
      ? 4
      : attacker.keywords.has("windfury")
        ? 2
        : 1;

    for (let a = 0; a < attackCount && left.length > 0 && right.length > 0; a++) {
      const currentDefenders = isLeft ? right : left;

      // Re-pick target for extra windfury attacks (first target chosen above)
      const currentTarget =
        a === 0 ? target : pickTarget(currentDefenders, rng, attacker, left, right);
      if (!currentTarget) break;

      // Fire onAttack hook
      attacker.hooks?.onAttack?.({
        self: attacker,
        selfSide: side,
        left,
        right,
        emit,
        rng,
        target: currentTarget,
      });

      // Fire onAllyAttack hook on all friendly minions
      const allies = side === "left" ? left : right;
      for (const ally of allies) {
        if (ally.instanceId !== attacker.instanceId) {
          ally.hooks?.onAllyAttack?.({
            self: ally,
            selfSide: side,
            left,
            right,
            emit,
            rng,
            target: currentTarget,
          });
        }
      }

      emit({ kind: "Attack", attacker: attacker.instanceId, target: currentTarget.instanceId });

      // Collect all targets this hit affects (main + adjacent if cleave)
      const hitTargets = attacker.keywords.has("cleave")
        ? getWithAdjacent(currentDefenders, currentTarget)
        : [currentTarget];

      // Fire onAttacked hook on all hit targets (defenders)
      const targetSide = isLeft ? "right" : "left";
      for (const t of hitTargets) {
        t.hooks?.onAttacked?.({
          self: t,
          selfSide: targetSide,
          left,
          right,
          emit,
          rng,
          target: attacker,
        });
      }

      // Fire onAllyAttacked on friendly Taunt minions when a Taunt is being attacked
      const friendlyBoard = isLeft ? right : left;
      for (const friendly of friendlyBoard) {
        if (friendly.keywords.has("taunt")) {
          const attackCtx: AttackCombatCtx = {
            self: friendly,
            selfSide: targetSide,
            left,
            right,
            emit,
            rng,
            target: attacker,
          };
          friendly.hooks?.onAllyAttacked?.(attackCtx);
        }
      }

      // Apply damage from attacker to all hit targets
      for (const t of hitTargets) {
        applyDamage(attacker, t, emit, left, right, rng, lifestealAccum);
      }

      // Counterattack: primary target hits back (only once, regardless of cleave)
      applyDamage(currentTarget, attacker, emit, left, right, rng, lifestealAccum);

      // Process deaths (including deathrattle chains)
      const result = reapDeaths(
        left,
        right,
        transcript,
        emit,
        rng,
        baronOnLeft,
        baronOnRight,
        attacker,
      );
      left = result.left;
      right = result.right;
      totalBountyGold += result.bountyGold;

      // Emit stat updates for all surviving minions so the UI can show real-time changes
      for (const m of left) {
        emit({ kind: "Stat", target: m.instanceId, atk: m.atk, hp: m.hp });
      }
      for (const m of right) {
        emit({ kind: "Stat", target: m.instanceId, atk: m.atk, hp: m.hp });
      }
    }

    // Yo-Ho-Ogre: after normal attacks, attack one more time targeting a random enemy
    if (attacker.keywords.has("yoHoOgre") && left.length > 0 && right.length > 0) {
      const yoDefenders = isLeft ? right : left;
      const yoTarget = pickTarget(yoDefenders, rng, attacker, left, right);
      if (yoTarget) {
        emit({ kind: "Attack", attacker: attacker.instanceId, target: yoTarget.instanceId });
        const yoHitTargets = attacker.keywords.has("cleave")
          ? getWithAdjacent(yoDefenders, yoTarget)
          : [yoTarget];
        const yoTargetSide = isLeft ? "right" : "left";
        for (const t of yoHitTargets) {
          t.hooks?.onAttacked?.({
            self: t,
            selfSide: yoTargetSide,
            left,
            right,
            emit,
            rng,
            target: attacker,
          });
        }
        for (const t of yoHitTargets) {
          applyDamage(attacker, t, emit, left, right, rng, lifestealAccum);
        }
        applyDamage(yoTarget, attacker, emit, left, right, rng, lifestealAccum);
        const yoResult = reapDeaths(
          left,
          right,
          transcript,
          emit,
          rng,
          baronOnLeft,
          baronOnRight,
          attacker,
        );
        left = yoResult.left;
        right = yoResult.right;
        totalBountyGold += yoResult.bountyGold;
        for (const m of left) {
          emit({ kind: "Stat", target: m.instanceId, atk: m.atk, hp: m.hp });
        }
        for (const m of right) {
          emit({ kind: "Stat", target: m.instanceId, atk: m.atk, hp: m.hp });
        }
      }
    }

    if (isLeft) leftPtr++;
    else rightPtr++;

    side = isLeft ? "right" : "left";
  }

  const winner: Side | "draw" =
    left.length > 0 && right.length === 0
      ? "left"
      : right.length > 0 && left.length === 0
        ? "right"
        : "draw";

  emit({ kind: "End", winner });
  return {
    transcript,
    survivorsLeft: left,
    survivorsRight: right,
    winner,
    lifestealHealing: lifestealAccum.total,
    bountyGold: totalBountyGold,
  };
}

// ---------------------------------------------------------------------------
// Death processing (handles chains from deathrattle effects)
// ---------------------------------------------------------------------------
function reapDeaths(
  left: MinionInstance[],
  right: MinionInstance[],
  transcript: CombatEvent[],
  emit: (e: CombatEvent) => void,
  rng: Rng,
  baronOnLeft: boolean,
  baronOnRight: boolean,
  attacker?: MinionInstance,
): { left: MinionInstance[]; right: MinionInstance[]; bountyGold: number } {
  let l = left;
  let r = right;
  let totalBountyGold = 0;

  // Keep processing deaths until no new ones appear (handles deathrattle chains)
  // Baron Rivendare causes deathrattles to trigger twice for all deathrattles
  // on the same side where he exists.
  for (;;) {
    const deadLeft = l.filter((m) => m.hp <= 0);
    const deadRight = r.filter((m) => m.hp <= 0);
    if (deadLeft.length === 0 && deadRight.length === 0) break;

    // Record original indices of dead minions before filtering, so we can
    // reposition deathrattle summons to the correct board position.
    const originalIndices = new Map<string, number>();
    for (const m of l) {
      if (m.hp <= 0) originalIndices.set(m.instanceId, l.indexOf(m));
    }
    for (const m of r) {
      if (m.hp <= 0) originalIndices.set(m.instanceId, r.indexOf(m));
    }

    l = l.filter((m) => m.hp > 0);
    r = r.filter((m) => m.hp > 0);

    for (const dead of [...deadLeft, ...deadRight]) {
      const deadSide: Side = deadLeft.includes(dead) ? "left" : "right";
      emit({ kind: "Death", source: dead.instanceId });

      // Fire onBoardRemove hook on all surviving minions
      const allBoard = [...l, ...r];
      for (const m of allBoard) {
        m.hooks?.onBoardRemove?.({
          self: m,
          selfSide: deadSide,
          left: l,
          right: r,
          emit,
          rng,
        });
      }

      // Fire onAllyKill on all friendly minions of the attacker
      if (attacker) {
        const attackerSide: Side = deadSide === "left" ? "right" : "left";
        const allies = attackerSide === "left" ? l : r;
        for (const ally of allies) {
          const killCtx: AllyKillCtx = {
            self: ally,
            selfSide: attackerSide,
            left: l,
            right: r,
            emit,
            rng,
            dead,
          };
          ally.hooks?.onAllyKill?.(killCtx);
        }
      }

      // Bounty: award gold to the opposing side when a bounty minion dies
      const card = MINIONS[dead.cardId];
      if (card && card.baseKeywords.includes("bounty" as import("./types").Keyword)) {
        const bountyAmount = card.bountyCost ?? 1;
        totalBountyGold += bountyAmount;
        emit({ kind: "Bounty", source: dead.instanceId, amount: bountyAmount });
      }

      // Reversed aura: when an aura-source minion (onStartOfCombat) dies,
      // restore all minions' stats to their base values. This handles
      // Murloc Warleader, Mal'Ganis, Siegebreaker, Old Murk-Eye, etc.
      if (dead.hooks?.onStartOfCombat) {
        const board = deadSide === "left" ? l : r;
        for (const m of board) {
          m.atk = m.baseAtk;
          m.hp = m.hp <= m.baseHp ? m.hp : m.baseHp;
          m.maxHp = m.baseHp;
          emit({ kind: "Stat", target: m.instanceId, atk: m.atk, hp: m.hp });
        }
      }

      // Record array length before deathrattle fires, so we can detect
      // newly summoned minions and reposition them to the dead minion's index.
      const boardBefore = deadSide === "left" ? l.length : r.length;

      // Deathrattle
      const deadCtx: CombatCtx = { self: dead, selfSide: deadSide, left: l, right: r, emit, rng };
      const baronOnSide = deadSide === "left" ? baronOnLeft : baronOnRight;
      dead.hooks?.onDeath?.(deadCtx);
      const triggers = dead.golden ? 2 : 1;
      const baronMult = baronOnSide ? 2 : 1;
      const totalTriggers = triggers * baronMult;
      for (let i = 1; i < totalTriggers; i++) {
        dead.hooks?.onDeath?.(deadCtx);
      }

      // Reposition any newly summoned minions to the dead minion's original index.
      const boardAfter = deadSide === "left" ? l.length : r.length;
      if (boardAfter > boardBefore) {
        const board = deadSide === "left" ? l : r;
        const originalIdx = originalIndices.get(dead.instanceId) ?? board.length;
        const insertPos = Math.max(0, Math.min(originalIdx, board.length - 1));
        // Move newly added minions (from boardBefore to end) to the correct position.
        const newMinions = board.splice(boardBefore);
        board.splice(insertPos, 0, ...newMinions);
        // Update the position in the last Summon event in the transcript to match.
        const lastSummonIdx = transcript.findLastIndex((e: CombatEvent) => e.kind === "Summon");
        if (lastSummonIdx !== -1 && transcript[lastSummonIdx]) {
          const lastSummon = transcript[lastSummonIdx]!;
          if (lastSummon.kind === "Summon") {
            (lastSummon as { position: number }).position = insertPos;
          }
        }
        // Fire onSummon hooks for each newly spawned token so minions like
        // Bigfernal react to deathrattle-summoned demons.
        for (const spawned of newMinions) {
          fireSummon(spawned, deadSide, l, r, emit, rng);
        }
      }

      // Enforce board cap of 7 minions. If deathrattle summons pushed the
      // board beyond 7, remove excess minions from the end (they were
      // summoned out of order of priority; trim the least valuable).
      const board = deadSide === "left" ? l : r;
      while (board.length > 7) {
        const removed = board.pop();
        if (removed) {
          emit({ kind: "Summon", card: removed.cardId, side: deadSide, position: board.length });
        }
      }

      // Reborn
      if (dead.keywords.has("reborn") && !dead.attachments.rebornUsed) {
        const ghost: MinionInstance = {
          ...dead,
          atk: 1,
          hp: 1,
          maxHp: 1,
          spellDamage: 0,
          keywords: new Set(dead.keywords),
          attachments: { ...dead.attachments, rebornUsed: true },
        };
        ghost.keywords.delete("reborn");
        if (deadSide === "left") l.push(ghost);
        else r.push(ghost);
        const pos = deadSide === "left" ? l.length - 1 : r.length - 1;
        emit({ kind: "Summon", card: dead.cardId, side: deadSide, position: pos });
        fireSummon(ghost, deadSide, l, r, emit, rng);
      }

      // Notify allies of death
      const allies = deadSide === "left" ? l : r;
      for (const ally of allies) {
        const ctx: AllyDeathCombatCtx = {
          self: ally,
          selfSide: deadSide,
          left: l,
          right: r,
          emit,
          rng,
          dead,
          deadSide,
        };
        ally.hooks?.onAllyDeath?.(ctx);
      }
    }
  }

  return { left: l, right: r, bountyGold: totalBountyGold };
}

// ---------------------------------------------------------------------------
// Start-of-combat hooks (interleaved, attacker side first)
// ---------------------------------------------------------------------------

function fireStartOfCombat(
  left: MinionInstance[],
  right: MinionInstance[],
  startSide: Side,
  emit: (e: CombatEvent) => void,
  rng: Rng,
): void {
  const [first, second] = startSide === "left" ? [left, right] : [right, left];
  const [firstSide, secondSide]: [Side, Side] =
    startSide === "left" ? ["left", "right"] : ["right", "left"];
  const maxLen = Math.max(first.length, second.length);

  for (let i = 0; i < maxLen; i++) {
    for (const [board, bSide] of [
      [first, firstSide],
      [second, secondSide],
    ] as [MinionInstance[], Side][]) {
      const m = board[i];
      if (!m) continue;
      const hook = m.hooks?.onStartOfCombat;
      if (!hook) continue;
      emit({ kind: "StartOfCombat", source: m.instanceId });
      hook({ self: m, selfSide: bSide, left, right, emit, rng });
    }
  }
}

// ---------------------------------------------------------------------------
// Rush: allow minions with Rush to attack before the normal cycle
// ---------------------------------------------------------------------------

function fireRushAttacks(
  left: MinionInstance[],
  right: MinionInstance[],
  startSide: Side,
  transcript: CombatEvent[],
  emit: (e: CombatEvent) => void,
  rng: Rng,
  baronOnLeft: boolean,
  baronOnRight: boolean,
  lifestealAccum: { total: number },
  bountyGoldAccum: { total: number },
): void {
  // Process ALL rush minions from both sides before the normal cycle.
  // In real Battlegrounds, every minion with Rush attacks before the normal
  // attack order, regardless of who goes first.
  const isLeft = startSide === "left";

  // First loop: process rush minions from the starting side.
  for (const m of [...(isLeft ? left : right)]) {
    if (!m.keywords.has("rush")) continue;
    if (m.hp <= 0) continue;
    const aliveDefenders = (isLeft ? right : left).filter((d) => d.hp > 0);
    if (aliveDefenders.length === 0) continue;
    if (m.keywords.has("freeze")) continue;
    const target = pickTarget(aliveDefenders, rng, m, left, right);
    if (!target) continue;

    emit({ kind: "Attack", attacker: m.instanceId, target: target.instanceId });
    applyDamage(m, target, emit, left, right, rng, lifestealAccum);
    const result = reapDeaths(left, right, transcript, emit, rng, baronOnLeft, baronOnRight, m);
    left = result.left;
    right = result.right;
    bountyGoldAccum.total += result.bountyGold;
  }

  // Second loop: process rush minions from the OTHER side (defenders with rush).
  for (const m of [...(isLeft ? right : left)]) {
    if (!m.keywords.has("rush")) continue;
    if (m.hp <= 0) continue;
    const aliveDefenders = (isLeft ? left : right).filter((d) => d.hp > 0);
    if (aliveDefenders.length === 0) continue;
    if (m.keywords.has("freeze")) continue;
    const target = pickTarget(aliveDefenders, rng, m, left, right);
    if (!target) continue;

    emit({ kind: "Attack", attacker: m.instanceId, target: target.instanceId });
    applyDamage(m, target, emit, left, right, rng, lifestealAccum);
    const result = reapDeaths(left, right, transcript, emit, rng, baronOnLeft, baronOnRight, m);
    left = result.left;
    right = result.right;
    bountyGoldAccum.total += result.bountyGold;
  }
}

// ---------------------------------------------------------------------------
// onSummon: notify all surviving minions when a new minion enters the board
// ---------------------------------------------------------------------------

function fireSummon(
  summoned: MinionInstance,
  summonedSide: Side,
  left: MinionInstance[],
  right: MinionInstance[],
  emit: (e: CombatEvent) => void,
  rng: Rng,
): void {
  const sides: [MinionInstance[], Side][] = [
    [left, "left"],
    [right, "right"],
  ];
  for (const [board, bSide] of sides) {
    for (const m of board) {
      const hook = m.hooks?.onSummon;
      if (!hook) continue;
      const ctx: SummonCombatCtx = {
        self: m,
        selfSide: bSide,
        left,
        right,
        emit,
        rng,
        summoned,
      };
      void summonedSide; // available for future filtering (friendly-only checks)
      hook(ctx);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickTarget(
  defenders: MinionInstance[],
  rng: Rng,
  attacker: MinionInstance,
  left: MinionInstance[],
  right: MinionInstance[],
): MinionInstance {
  // Check for custom target selector (e.g. Zapp Slywick).
  const customTarget = attacker.hooks.getTarget?.({
    self: attacker,
    selfSide: undefined as unknown as Side,
    left,
    right,
    emit: () => {},
    rng,
  });
  if (customTarget && defenders.includes(customTarget)) {
    return customTarget;
  }

  const tauntTargets = defenders.filter((m) => m.keywords.has("taunt"));
  const pool = tauntTargets.length > 0 ? tauntTargets : defenders;
  return rng.pick(pool);
}

function getWithAdjacent(board: MinionInstance[], target: MinionInstance): MinionInstance[] {
  const idx = board.indexOf(target);
  if (idx === -1) return [target];
  const result: MinionInstance[] = [target];
  if (idx > 0 && board[idx - 1]) result.unshift(board[idx - 1]!);
  if (board[idx + 1]) result.push(board[idx + 1]!);
  return result;
}

function applyDamage(
  source: MinionInstance,
  target: MinionInstance,
  emit: (e: CombatEvent) => void,
  left: MinionInstance[],
  right: MinionInstance[],
  rng: Rng,
  lifestealAccum: { total: number },
): void {
  const dmg = source.atk;
  if (dmg <= 0) return;

  let actualHpDamage = 0;

  if (target.keywords.has("divineShield")) {
    target.keywords.delete("divineShield");
    emit({ kind: "DivineShield", target: target.instanceId });
    const isOnLeft = left.includes(target);
    const allies = isOnLeft ? left : right;
    for (const ally of allies) {
      const allySide: Side = isOnLeft ? "left" : "right";
      ally.hooks?.onDivineShieldPop?.({
        self: ally,
        selfSide: allySide,
        left,
        right,
        emit,
        rng,
      });
    }
    if (source.keywords.has("poisonous") || source.keywords.has("venomous")) {
      target.hp = 0;
      emit({ kind: "Damage", target: target.instanceId, amount: dmg });
    } else {
      return;
    }
  } else {
    actualHpDamage = dmg;
  }

  target.hp -= dmg;
  emit({ kind: "Damage", target: target.instanceId, amount: dmg });

  // Fire onDamageTaken hook on the target
  const isOnLeft = left.includes(target);
  target.hooks?.onDamageTaken?.({
    self: target,
    selfSide: isOnLeft ? "left" : "right",
    left,
    right,
    emit,
    rng,
  });

  if (source.keywords.has("poisonous") || source.keywords.has("venomous")) {
    target.hp = Math.min(target.hp, 0);
  }
  if (source.keywords.has("venomous")) {
    source.keywords.delete("venomous");
  }
  if (source.keywords.has("lifesteal") && actualHpDamage > 0) {
    emit({ kind: "Lifesteal", target: source.instanceId, amount: actualHpDamage });
    lifestealAccum.total += actualHpDamage;
  }
}

function cloneMinion(m: MinionInstance): MinionInstance {
  return { ...m, keywords: new Set(m.keywords), attachments: { ...m.attachments } };
}

function resolved(
  winner: Side | "draw",
  left: MinionInstance[],
  right: MinionInstance[],
): CombatResult {
  return {
    transcript: [{ kind: "End", winner }],
    survivorsLeft: left,
    survivorsRight: right,
    winner,
    lifestealHealing: 0,
    bountyGold: 0,
  };
}
