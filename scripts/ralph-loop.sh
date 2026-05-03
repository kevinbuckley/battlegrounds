#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# ralph-loop.sh — Overnight autonomous Battlegrounds builder
#
# Stack: OpenCode + MLX (mlx_lm) + MCP sidecar (web/browser tools)
#
# Each iteration:
#   1. snapshots HEAD
#   2. runs OpenCode with the supercharged prompt (scripts/ralph-prompt.md)
#   3. verifies bun test + bun typecheck pass
#   4. reverts to snapshot if anything failed
#   5. logs the FIXED: line to logs/ralph-fixed-<date>.log
#
# Usage:
#   ./scripts/ralph-loop.sh                    # run forever (until --max-time)
#   ./scripts/ralph-loop.sh --iters 5
#   ./scripts/ralph-loop.sh --iters 1 --debug  # single iteration, full output
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PROMPT_FILE="$REPO/scripts/ralph-prompt.md"
MODEL="mlx//Users/kbux/.cache/mlx/Qwen3.6-35B-A3B-4bit"
APP_URL="http://localhost:3000"
MLX_URL="http://localhost:8080/v1/models"

LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y%m%d-%H%M)
LOG="$LOG_DIR/ralph-$STAMP.log"
FIXED_LOG="$LOG_DIR/ralph-fixed-$STAMP.log"

MAX_ITERS=999
SLEEP_BETWEEN=20
MAX_TIME_HOURS=12
DEBUG=0
ITER_TIMEOUT=1800   # 30 min per iteration
STUCK_THRESHOLD=5   # consecutive reverts before injecting a recovery task

while [[ $# -gt 0 ]]; do
  case $1 in
    --iters)     MAX_ITERS="$2";       shift 2 ;;
    --sleep)     SLEEP_BETWEEN="$2";   shift 2 ;;
    --max-time)  MAX_TIME_HOURS="$2";  shift 2 ;;
    --timeout)   ITER_TIMEOUT="$2";    shift 2 ;;
    --debug)     DEBUG=1;              shift   ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

log()      { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }
say()      { echo "$*" | tee -a "$LOG"; }
log_fixed(){ echo "$*" | tee -a "$FIXED_LOG" >> "$LOG"; }

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
preflight() {
  local fail=0

  # Check MLX server (not Ollama — we use mlx_lm now)
  curl -s --max-time 3 "$MLX_URL" >/dev/null 2>&1 \
    || { log "FAIL: MLX server not responding at $MLX_URL — run ./scripts/start-mlx-server.sh first"; fail=1; }

  # Start dev server if not running (needed for browser step)
  if ! curl -s --max-time 3 "$APP_URL" >/dev/null 2>&1; then
    log "INFO: dev server not running — starting it in background"
    (cd "$REPO" && bun dev >> "$LOG_DIR/dev-server.log" 2>&1) &
    sleep 5
    curl -s --max-time 5 "$APP_URL" >/dev/null 2>&1 \
      && log "INFO: dev server started OK" \
      || log "WARN: dev server still not responding — browser tests will fail"
  fi

  command -v opencode >/dev/null 2>&1 \
    || { log "FAIL: opencode not in PATH"; fail=1; }

  command -v bun >/dev/null 2>&1 \
    || { log "FAIL: bun not in PATH"; fail=1; }

  python3 -c "import mcp, playwright" 2>/dev/null \
    || { log "FAIL: missing python deps (mcp, playwright)"; fail=1; }

  # Sync with remote before starting
  git -C "$REPO" pull --ff-only origin main >/dev/null 2>&1 || true

  if ! git -C "$REPO" diff --quiet || ! git -C "$REPO" diff --cached --quiet; then
    log "FAIL: repo has uncommitted changes — commit/stash first"
    fail=1
  fi

  [[ $fail -eq 0 ]] || exit 1
  log "Preflight OK."
}

# ---------------------------------------------------------------------------
# Stuck recovery — inject a fresh task if we've been spinning on the same commit
# ---------------------------------------------------------------------------
inject_recovery_task() {
  local snap="$1"
  local count="$2"
  log "  ⚠ STUCK: same commit failed $count times in a row — injecting recovery task"
  # Pick the next concrete [S] task from "Soon" and prepend it to "Now"
  # This avoids injecting vague browser tasks that fail when Playwright is unavailable
  local next_task
  next_task=$(grep -m1 '^\- \[ \] \[S\]' "$REPO/docs/loop-backlog.md" | head -1)
  if [[ -z "$next_task" ]]; then
    next_task="- [ ] [S] Add a unit test in tests/combat that verifies cleave damage hits exactly the two minions adjacent to the defender, not all friendlies"
  fi
  sed -i '' "s|## Now (highest priority.*)|## Now (highest priority, model should pick from here first)\n\n$next_task|" \
    "$REPO/docs/loop-backlog.md" 2>/dev/null || true
  log "  → Added recovery task to top of backlog: $next_task"
}

# ---------------------------------------------------------------------------
# Iteration
# ---------------------------------------------------------------------------
run_iteration() {
  local n="$1"
  log "========================================"
  log "  ITERATION $n"
  log "========================================"

  local snap
  snap=$(git -C "$REPO" rev-parse HEAD)
  log "  snapshot: $snap"

  # Build the prompt: project prompt + full ledger + current file inventory
  local prompt
  prompt=$(cat "$PROMPT_FILE")

  # Full ledger — model needs ALL entries to avoid redoing old work
  prompt+=$'\n\n## Current ledger (every line is DONE — do NOT redo any of these)\n\n'
  prompt+="$(cat "$REPO/docs/loop-ledger.md" 2>/dev/null || echo '(empty)')"

  # Minion + hero file inventory so model can check existence without a bash call
  prompt+=$'\n\n## Already-implemented files (skip any backlog item whose file is listed here)\n\n'
  prompt+="### Minions on disk\n"
  prompt+="$(find "$REPO/src/game/minions" -name '*.ts' ! -name 'index.ts' ! -name 'define.ts' | sed "s|$REPO/||" | sort)"
  prompt+=$'\n\n### Heroes on disk\n'
  prompt+="$(find "$REPO/src/game/heroes" -name '*.ts' ! -name 'index.ts' ! -name 'stub.ts' | sed "s|$REPO/||" | sort)"

  # Sync with remote so the model sees the latest commits
  git -C "$REPO" pull --ff-only origin main >/dev/null 2>&1 || true

  cd "$REPO"
  local iter_log="$LOG_DIR/iter-$STAMP-$(printf '%03d' "$n").log"

  if [[ $DEBUG -eq 1 ]]; then
    gtimeout "$ITER_TIMEOUT" opencode run -m "$MODEL" --print-logs "$prompt" 2>&1 | tee "$iter_log" | tee -a "$LOG" || true
  else
    gtimeout "$ITER_TIMEOUT" opencode run -m "$MODEL" "$prompt" > "$iter_log" 2>&1 || true
  fi
  log "  opencode exited (timeout=${ITER_TIMEOUT}s)"

  # Verify the iteration actually worked
  log "  verifying..."
  local current
  current=$(git -C "$REPO" rev-parse HEAD)
  local has_dirty=0
  if ! git -C "$REPO" diff --quiet || ! git -C "$REPO" diff --cached --quiet; then
    has_dirty=1
  fi

  local typecheck_ok=0
  local tests_ok=0
  if (cd "$REPO" && bun typecheck) >/dev/null 2>&1; then typecheck_ok=1; fi
  if (cd "$REPO" && bun test)      >/dev/null 2>&1; then tests_ok=1; fi

  # Require the iteration's diff to touch real source — not just metadata.
  local real_diff=0
  if [[ "$current" != "$snap" ]]; then
    if git -C "$REPO" diff --name-only "$snap" "$current" \
        | grep -E '^(src/|app/|tests/|docs/game-rules/|docs/loop-ledger\.md)' >/dev/null; then
      real_diff=1
    fi
  fi

  if [[ $typecheck_ok -eq 1 && $tests_ok -eq 1 && $real_diff -eq 1 ]]; then
    local fixed_line
    fixed_line=$(grep -oE 'FIXED: .+' "$iter_log" | tail -1 || echo 'FIXED: (no marker found)')
    log_fixed "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $current | $fixed_line"
    log "  ✓ iteration succeeded — $fixed_line"
    CONSECUTIVE_FAILS=0
  else
    log "  ✗ iteration failed (typecheck=$typecheck_ok tests=$tests_ok real_diff=$real_diff new_commit=$([[ "$current" != "$snap" ]] && echo 1 || echo 0) dirty=$has_dirty) — reverting"
    git -C "$REPO" reset --hard "$snap" >/dev/null
    git -C "$REPO" clean -fd src/ app/ tests/ docs/ 2>/dev/null || true
    log_fixed "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $snap | REVERTED: iteration $n failed"
    CONSECUTIVE_FAILS=$(( CONSECUTIVE_FAILS + 1 ))

    # Circuit breaker: inject a recovery task if truly stuck
    if [[ $CONSECUTIVE_FAILS -ge $STUCK_THRESHOLD ]]; then
      inject_recovery_task "$snap" "$CONSECUTIVE_FAILS"
      CONSECUTIVE_FAILS=0
    fi
  fi
}

# ---------------------------------------------------------------------------
# Main loop — wrapped in caffeinate so the Mac never sleeps during the run
# ---------------------------------------------------------------------------
preflight

log "Starting ralph loop"
log "  model      = $MODEL"
log "  max iters  = $MAX_ITERS"
log "  max time   = ${MAX_TIME_HOURS}h"
log "  sleep      = ${SLEEP_BETWEEN}s"
log "  stuck threshold = $STUCK_THRESHOLD consecutive fails"
log "  log        = $LOG"
log "  fixed log  = $FIXED_LOG"

# Keep display + system awake for the duration (works even if macOS setting lapsed)
caffeinate -d -i -s &
CAFFEINATE_PID=$!
trap "kill $CAFFEINATE_PID 2>/dev/null" EXIT

STOP_FILE="$REPO/.ralph-stop"
# Clean up any leftover stop file from a previous run
rm -f "$STOP_FILE"
log "  stop file  = $STOP_FILE  (touch it to stop gracefully after current iteration)"

START_TS=$(date +%s)
DEADLINE=$(( START_TS + MAX_TIME_HOURS * 3600 ))
CONSECUTIVE_FAILS=0

for ((i=1; i<=MAX_ITERS; i++)); do
  # Graceful stop: check for sentinel file before each iteration
  if [[ -f "$STOP_FILE" ]]; then
    log "Stop file detected (.ralph-stop) — exiting loop gracefully after $((i-1)) iterations."
    rm -f "$STOP_FILE"
    break
  fi

  if [[ $(date +%s) -ge $DEADLINE ]]; then
    log "Hit max-time deadline after $((i-1)) iterations."
    break
  fi
  run_iteration "$i" || log "  (run_iteration error swallowed; continuing)"

  if (( i < MAX_ITERS )); then
    # Check stop file again after iteration completes (before sleeping)
    if [[ -f "$STOP_FILE" ]]; then
      log "Stop file detected after iteration $i — exiting gracefully."
      rm -f "$STOP_FILE"
      break
    fi
    log "  sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
  fi
done

log "Loop complete."
log "Summary:"
[[ -f "$FIXED_LOG" ]] && tail -50 "$FIXED_LOG" | tee -a "$LOG" || log "  (no fixed log)"
