#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# pi-loop.sh — Overnight Battlegrounds gap-finder using pi + Ollama qwen3:32b
#
# Requires:
#   - Ollama running with qwen3:32b pulled
#   - pi coding agent: npm install -g @mariozechner/pi-coding-agent
#   - ~/.pi/agent/models.json configured (already done)
#
# Usage:
#   ./scripts/pi-loop.sh               # run forever
#   ./scripts/pi-loop.sh --iters 5     # cap at 5 iterations
#   ./scripts/pi-loop.sh --sleep 30    # 30s between iterations
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PI="$HOME/.npm-global/bin/pi"
MODEL="qwen3:32b"
LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/pi-loop-$(date +%Y%m%d-%H%M).log"

MAX_ITERS=9999
SLEEP_BETWEEN=15

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --iters)  MAX_ITERS="$2";  shift 2 ;;
    --sleep)  SLEEP_BETWEEN="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# ---------------------------------------------------------------------------
# Verify Ollama is up
# ---------------------------------------------------------------------------
if ! curl -s "http://localhost:11434/api/tags" > /dev/null 2>&1; then
  log "ERROR: Ollama not running. Start it with: ollama serve"
  exit 1
fi
log "Ollama OK. Model: $MODEL"

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
read -r -d '' PROMPT << 'PROMPT_EOF' || true
You are an autonomous engineer working on a TypeScript Hearthstone Battlegrounds clone at /Users/kbux/code/battlegrounds.

YOUR MISSION: find exactly ONE gap between this codebase and real Hearthstone Battlegrounds, implement the fix, and ship it with passing tests.

RULES — absolute, no exceptions:
1. Never ask a question. Never say "I need clarification". Just decide and act.
2. Never stop mid-task to check in. Run to completion.
3. Read CLAUDE.md first — it has the project constraints you must respect.
4. Research the real game by fetching https://hearthstone.wiki.gg/wiki/Battlegrounds (always use hearthstone.wiki.gg, not hearthstone.wiki or hearthstone.com).
5. Choose ONE concrete, implementable gap. Prefer: combat mechanics, minion stats/keywords, damage formula, shop economy rules, or missing minions.
6. Write the code. Small, focused change. Touch only what's needed.
7. Run `bun test` from /Users/kbux/code/battlegrounds. Fix failures and rerun. Do not finish until all tests pass.
8. End your final message with exactly:
   FIXED: <one-line description of what you changed and why>

Start now.
PROMPT_EOF

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
log "Starting pi loop (iters=$MAX_ITERS, sleep=${SLEEP_BETWEEN}s)"
log "Log: $LOG"
log ""

for ((i=1; i<=MAX_ITERS; i++)); do
  log "========================================"
  log "  ITERATION $i"
  log "========================================"

  cd "$REPO"
  "$PI" \
    --provider ollama \
    --model "$MODEL" \
    --print \
    --no-session \
    "$PROMPT" \
  2>&1 | tee -a "$LOG"

  EXIT_CODE=${PIPESTATUS[0]}
  log ""
  if [[ $EXIT_CODE -ne 0 ]]; then
    log "  pi exited with code $EXIT_CODE — continuing anyway"
  fi

  if [[ $i -lt $MAX_ITERS ]]; then
    log "  Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
  fi
done

log "Loop complete after $MAX_ITERS iterations."
