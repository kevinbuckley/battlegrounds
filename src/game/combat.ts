import type { Rng } from "@/lib/rng";
import type {
  AllyDeathCombatCtx,
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
  fireRushAttacks(left, right, startSide, emit, rng, baronOnLeft, baronOnRight, lifestealAccum);

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
    const target = pickTarget(isLeft ? right : left, rng);

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
      const currentTarget = a === 0 ? target : pickTarget(currentDefenders, rng);
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

      emit({ kind: "Attack", attacker: attacker.instanceId, target: currentTarget.instanceId });

      // Collect all targets this hit affects (main + adjacent if cleave)
      const hitTargets = attacker.keywords.has("cleave")
        ? getWithAdjacent(currentDefenders, currentTarget)
        : [currentTarget];

      // Apply damage from attacker to all hit targets
      for (const t of hitTargets) {
        applyDamage(attacker, t, emit, left, right, rng, lifestealAccum);
      }

      // Counterattack: primary target hits back (only once, regardless of cleave)
      applyDamage(currentTarget, attacker, emit, left, right, rng, lifestealAccum);

      // Process deaths (including deathrattle chains)
      const result = reapDeaths(left, right, emit, rng, baronOnLeft, baronOnRight);
      left = result.left;
      right = result.right;
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
  };
}

// ---------------------------------------------------------------------------
// Death processing (handles chains from deathrattle effects)
// ---------------------------------------------------------------------------
function reapDeaths(
  left: MinionInstance[],
  right: MinionInstance[],
  emit: (e: CombatEvent) => void,
  rng: Rng,
  baronOnLeft: boolean,
  baronOnRight: boolean,
): { left: MinionInstance[]; right: MinionInstance[] } {
  let l = left;
  let r = right;

  // Keep processing deaths until no new ones appear (handles deathrattle chains)
  // Baron Rivendare causes deathrattles to trigger twice for all deathrattles
  // on the same side where he exists.
  for (;;) {
    const deadLeft = l.filter((m) => m.hp <= 0);
    const deadRight = r.filter((m) => m.hp <= 0);
    if (deadLeft.length === 0 && deadRight.length === 0) break;

    l = l.filter((m) => m.hp > 0);
    r = r.filter((m) => m.hp > 0);

    for (const dead of [...deadLeft, ...deadRight]) {
      const deadSide: Side = deadLeft.includes(dead) ? "left" : "right";
      emit({ kind: "Death", source: dead.instanceId });

      // Deathrattle
      const deadCtx: CombatCtx = { self: dead, selfSide: deadSide, left: l, right: r, emit, rng };
      const baronOnSide = deadSide === "left" ? baronOnLeft : baronOnRight;
      dead.hooks?.onDeath?.(deadCtx);
      if (baronOnSide || dead.golden) {
        dead.hooks?.onDeath?.(deadCtx);
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

  return { left: l, right: r };
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
  emit: (e: CombatEvent) => void,
  rng: Rng,
  baronOnLeft: boolean,
  baronOnRight: boolean,
  lifestealAccum: { total: number },
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
    const target = pickTarget(aliveDefenders, rng);
    if (!target) continue;

    emit({ kind: "Attack", attacker: m.instanceId, target: target.instanceId });
    applyDamage(m, target, emit, left, right, rng, lifestealAccum);
    const result = reapDeaths(left, right, emit, rng, baronOnLeft, baronOnRight);
    left = result.left;
    right = result.right;
  }

  // Second loop: process rush minions from the OTHER side (defenders with rush).
  for (const m of [...(isLeft ? right : left)]) {
    if (!m.keywords.has("rush")) continue;
    if (m.hp <= 0) continue;
    const aliveDefenders = (isLeft ? left : right).filter((d) => d.hp > 0);
    if (aliveDefenders.length === 0) continue;
    if (m.keywords.has("freeze")) continue;
    const target = pickTarget(aliveDefenders, rng);
    if (!target) continue;

    emit({ kind: "Attack", attacker: m.instanceId, target: target.instanceId });
    applyDamage(m, target, emit, left, right, rng, lifestealAccum);
    const result = reapDeaths(left, right, emit, rng, baronOnLeft, baronOnRight);
    left = result.left;
    right = result.right;
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

function pickTarget(defenders: MinionInstance[], rng: Rng): MinionInstance {
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
    return;
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
  if (source.keywords.has("lifesteal") && dmg > 0) {
    emit({ kind: "Lifesteal", target: source.instanceId, amount: dmg });
    lifestealAccum.total += dmg;
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
  };
}
