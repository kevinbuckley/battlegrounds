#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# stop-ralph.sh — Gracefully stop the ralph loop after its current iteration
#
# Usage:
#   ./scripts/stop-ralph.sh          # graceful (waits for current iteration)
#   ./scripts/stop-ralph.sh --now    # immediate (kills opencode mid-iteration)
# ---------------------------------------------------------------------------
REPO="$(cd "$(dirname "$0")/.." && pwd)"
STOP_FILE="$REPO/.ralph-stop"

if [[ "${1:-}" == "--now" ]]; then
  echo "Killing ralph loop immediately..."
  pkill -f "ralph-loop.sh" 2>/dev/null && echo "  ✓ loop killed" || echo "  (loop not running)"
  pkill -f "opencode run"  2>/dev/null && echo "  ✓ opencode killed" || echo "  (opencode not running)"
  rm -f "$STOP_FILE"
  echo "Done."
else
  touch "$STOP_FILE"
  echo "Stop file created: $STOP_FILE"
  echo "The loop will exit gracefully after the current iteration finishes."
  echo ""
  echo "To stop immediately instead: ./scripts/stop-ralph.sh --now"
fi
