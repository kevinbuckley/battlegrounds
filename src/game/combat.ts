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
): CombatResult {
  if (leftBoard.length === 0 && rightBoard.length === 0) return resolved("draw", [], []);
  if (leftBoard.length === 0) return resolved("right", [], [...rightBoard]);
  if (rightBoard.length === 0) return resolved("left", [...leftBoard], []);

  const transcript: CombatEvent[] = [];
  const emit = (e: CombatEvent) => transcript.push(e);

  let left = leftBoard.map(cloneMinion);
  let right = rightBoard.map(cloneMinion);

  // Determine starting attacker
  const startSide: Side =
    left.length > right.length
      ? "left"
      : right.length > left.length
        ? "right"
        : rng.next() < 0.5
          ? "left"
          : "right";

  // Fire start-of-combat hooks (interleaved, attacker side first)
  fireStartOfCombat(left, right, startSide, emit, rng);

  let side: Side = startSide;
  let leftPtr = 0;
  let rightPtr = 0;

  for (let i = 0; i < SAFETY_LIMIT && left.length > 0 && right.length > 0; i++) {
    const isLeft = side === "left";
    const ptr = (isLeft ? leftPtr : rightPtr) % (isLeft ? left : right).length;

    const attacker = (isLeft ? left : right)[ptr]!;

    // Pick primary target (taunt-aware)
    const target = pickTarget(isLeft ? right : left, rng);

    // How many times does this attacker attack this turn?
    const attackCount = attacker.keywords.has("windfury") ? 2 : 1;

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
      const hitTargets = [currentTarget];

      // Apply damage from attacker to all hit targets
      for (const t of hitTargets) {
        applyDamage(attacker, t, emit);
      }

      // Counterattack: primary target hits back (only once, regardless of cleave)
      applyDamage(currentTarget, attacker, emit);

      // Process deaths (including deathrattle chains)
      const result = reapDeaths(left, right, emit, rng);
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
  return { transcript, survivorsLeft: left, survivorsRight: right, winner };
}

// ---------------------------------------------------------------------------
// Death processing (handles chains from deathrattle effects)
// ---------------------------------------------------------------------------
function reapDeaths(
  left: MinionInstance[],
  right: MinionInstance[],
  emit: (e: CombatEvent) => void,
  rng: Rng,
): { left: MinionInstance[]; right: MinionInstance[] } {
  let l = left;
  let r = right;

  // Keep processing deaths until no new ones appear (handles deathrattle chains)
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
      dead.hooks?.onDeath?.(deadCtx);

      // Reborn
      if (dead.keywords.has("reborn") && !dead.attachments.rebornUsed) {
        const ghost: MinionInstance = {
          ...dead,
          hp: 1,
          maxHp: 1,
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
): void {
  const dmg = source.atk;
  if (dmg <= 0) return;

  if (target.keywords.has("divineShield")) {
    target.keywords.delete("divineShield");
    emit({ kind: "DivineShield", target: target.instanceId });
    return;
  }

  target.hp -= dmg;
  emit({ kind: "Damage", target: target.instanceId, amount: dmg });

  if (source.keywords.has("poisonous") || source.keywords.has("venomous")) {
    target.hp = Math.min(target.hp, 0);
  }
  if (source.keywords.has("venomous")) {
    source.keywords.delete("venomous");
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
  };
}
