#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# ralph-loop.sh — Overnight autonomous Battlegrounds builder
#
# Stack: OpenCode + Ollama (qwen3:32b) + MCP sidecar (web/browser tools)
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
MODEL="ollama/qwen3.6:35b"
APP_URL="http://localhost:3000"
OLLAMA_URL="http://localhost:11434/api/tags"

LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y%m%d-%H%M)
LOG="$LOG_DIR/ralph-$STAMP.log"
FIXED_LOG="$LOG_DIR/ralph-fixed-$STAMP.log"

MAX_ITERS=999
SLEEP_BETWEEN=20
MAX_TIME_HOURS=12
DEBUG=0
ITER_TIMEOUT=1200   # 20 min per iteration

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

  curl -s --max-time 3 "$OLLAMA_URL" >/dev/null 2>&1 \
    || { log "FAIL: Ollama not responding at $OLLAMA_URL"; fail=1; }

  curl -s --max-time 3 "$APP_URL" >/dev/null 2>&1 \
    || log "WARN: dev server not responding at $APP_URL — browser tests will fail"

  command -v opencode >/dev/null 2>&1 \
    || { log "FAIL: opencode not in PATH"; fail=1; }

  command -v bun >/dev/null 2>&1 \
    || { log "FAIL: bun not in PATH"; fail=1; }

  python3 -c "import mcp, playwright" 2>/dev/null \
    || { log "FAIL: missing python deps (mcp, playwright)"; fail=1; }

  if ! git -C "$REPO" diff --quiet || ! git -C "$REPO" diff --cached --quiet; then
    log "FAIL: repo has uncommitted changes — commit/stash first"
    fail=1
  fi

  [[ $fail -eq 0 ]] || exit 1
  log "Preflight OK."
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

  # Build the prompt: project prompt + current ledger context
  local prompt
  prompt=$(cat "$PROMPT_FILE")
  prompt+=$'\n\n## Current ledger (do NOT redo these)\n\n'
  prompt+="$(tail -50 "$REPO/docs/loop-ledger.md" 2>/dev/null || echo '(empty)')"

  cd "$REPO"
  local iter_log="$LOG_DIR/iter-$STAMP-$(printf '%03d' "$n").log"

  if [[ $DEBUG -eq 1 ]]; then
    opencode run -m "$MODEL" --print-logs "$prompt" 2>&1 | tee "$iter_log" | tee -a "$LOG" || true
  else
    opencode run -m "$MODEL" "$prompt" > "$iter_log" 2>&1 || true
  fi

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
    fixed_line=$(grep -E '^FIXED:' "$iter_log" | tail -1 || echo 'FIXED: (no marker found)')
    log_fixed "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $current | $fixed_line"
    log "  ✓ iteration succeeded — $fixed_line"
  else
    log "  ✗ iteration failed (typecheck=$typecheck_ok tests=$tests_ok real_diff=$real_diff new_commit=$([[ "$current" != "$snap" ]] && echo 1 || echo 0) dirty=$has_dirty) — reverting"
    git -C "$REPO" reset --hard "$snap" >/dev/null
    git -C "$REPO" clean -fd src/ app/ tests/ 2>/dev/null || true
    log_fixed "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $snap | REVERTED: iteration $n failed"
  fi
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
preflight

log "Starting ralph loop"
log "  model      = $MODEL"
log "  max iters  = $MAX_ITERS"
log "  max time   = ${MAX_TIME_HOURS}h"
log "  sleep      = ${SLEEP_BETWEEN}s"
log "  log        = $LOG"
log "  fixed log  = $FIXED_LOG"

START_TS=$(date +%s)
DEADLINE=$(( START_TS + MAX_TIME_HOURS * 3600 ))

for ((i=1; i<=MAX_ITERS; i++)); do
  if [[ $(date +%s) -ge $DEADLINE ]]; then
    log "Hit max-time deadline after $((i-1)) iterations."
    break
  fi
  run_iteration "$i" || log "  (run_iteration error swallowed; continuing)"

  if (( i < MAX_ITERS )); then
    log "  sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
  fi
done

log "Loop complete."
log "Summary:"
[[ -f "$FIXED_LOG" ]] && tail -50 "$FIXED_LOG" | tee -a "$LOG" || log "  (no fixed log)"
