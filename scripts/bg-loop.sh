#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# bg-loop.sh — Overnight Battlegrounds gap-finder using Claude Code + LiteLLM
#
# Starts a LiteLLM proxy that routes Claude Code → local qwen3:32b via Ollama,
# then loops Claude Code non-interactively with a supercharged prompt.
#
# Usage:
#   ./scripts/bg-loop.sh               # run forever
#   ./scripts/bg-loop.sh --iters 10    # cap at 10 iterations
#   ./scripts/bg-loop.sh --sleep 60    # 60s between iterations
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE="$HOME/.npm-global/bin/claude"
PROXY_CONFIG="$REPO/scripts/litellm-proxy.yaml"
PROXY_PORT=4000
PROXY_PID_FILE="/tmp/bg-loop-litellm.pid"
LOG_DIR="$REPO/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/bg-loop-$(date +%Y%m%d-%H%M).log"

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

# ---------------------------------------------------------------------------
# Prompt — no questions, no hedging, just execute
# ---------------------------------------------------------------------------
read -r -d '' PROMPT << 'PROMPT_EOF' || true
You are an autonomous engineer working on a TypeScript Hearthstone Battlegrounds clone.

YOUR MISSION: find exactly ONE gap between this codebase and real Hearthstone Battlegrounds, implement the fix, and ship it with passing tests.

RULES — these are absolute, no exceptions:
1. Never ask a question. Never say "I need clarification" or "Would you like me to". Just decide and act.
2. Never stop mid-task to check in. Run to completion.
3. Read CLAUDE.md first — it has the project constraints you must respect.
4. Research the real game by fetching https://hearthstone.wiki.gg/wiki/Battlegrounds or a specific mechanic page.
5. Choose ONE concrete, implementable gap. Prefer gaps in: combat mechanics, minion stats/keywords, damage formula, shop economy, or missing minions.
6. Write the code. Small, focused change. Touch only what's needed.
7. Run `bun test` in /Users/kbux/code/battlegrounds. If anything fails, fix it and rerun. Do not finish until tests pass.
8. End your final message with exactly this line (no other text after it):
   FIXED: <one-line description of what you changed and why>

You have full access to bash, file read/write, and web fetch. Use them freely.
Start now.
PROMPT_EOF

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

kill_proxy() {
  if [[ -f "$PROXY_PID_FILE" ]]; then
    local pid
    pid=$(cat "$PROXY_PID_FILE")
    kill "$pid" 2>/dev/null && log "Proxy (PID $pid) stopped." || true
    rm -f "$PROXY_PID_FILE"
  fi
}

# ---------------------------------------------------------------------------
# Start LiteLLM proxy
# ---------------------------------------------------------------------------
trap kill_proxy EXIT INT TERM

# Kill any leftover proxy from a previous run
kill_proxy

log "Starting LiteLLM proxy on port $PROXY_PORT..."
litellm --config "$PROXY_CONFIG" --port "$PROXY_PORT" \
  >> "$LOG_DIR/litellm-proxy.log" 2>&1 &
echo $! > "$PROXY_PID_FILE"
log "Proxy PID: $(cat "$PROXY_PID_FILE")"

# Wait for proxy to be ready
for i in {1..20}; do
  if curl -s "http://localhost:$PROXY_PORT/health" > /dev/null 2>&1; then
    log "Proxy is up."
    break
  fi
  sleep 1
done

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
log "Starting Claude Code loop (iters=$MAX_ITERS, sleep=${SLEEP_BETWEEN}s)"
log "Log: $LOG"
log ""

for ((i=1; i<=MAX_ITERS; i++)); do
  log "========================================"
  log "  ITERATION $i"
  log "========================================"

  ANTHROPIC_BASE_URL="http://localhost:$PROXY_PORT" \
  ANTHROPIC_API_KEY="fake" \
    "$CLAUDE" \
      -p \
      --dangerously-skip-permissions \
      --output-format text \
      "$PROMPT" \
    2>&1 | tee -a "$LOG"

  EXIT_CODE=${PIPESTATUS[0]}
  log ""
  if [[ $EXIT_CODE -ne 0 ]]; then
    log "  claude exited with code $EXIT_CODE — continuing anyway"
  fi

  if [[ $i -lt $MAX_ITERS ]]; then
    log "  Sleeping ${SLEEP_BETWEEN}s..."
    sleep "$SLEEP_BETWEEN"
  fi
done

log "Loop complete after $MAX_ITERS iterations."
PROMPT_EOF
