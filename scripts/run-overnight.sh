#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# run-overnight.sh — launch the BG gap-finder loop and tail logs
#
# Usage:
#   ./scripts/run-overnight.sh                          # use default model
#   ./scripts/run-overnight.sh --model qwen3:27b        # after pulling 27B
#   ./scripts/run-overnight.sh --max-iters 20 --sleep 10
# ---------------------------------------------------------------------------
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$REPO/scripts/overnight-loop.py"

# Make sure we're in the repo root
cd "$REPO"

# Python 3.9+ required (uses built-ins only — no pip install needed)
PYTHON=$(command -v python3 || command -v python)
if [[ -z "$PYTHON" ]]; then
  echo "ERROR: python3 not found." >&2
  exit 1
fi

echo "============================================="
echo "  Hearthstone BG overnight gap-finder loop"
echo "  Repo: $REPO"
echo "  Args: $*"
echo "============================================="
echo ""

# Run the loop. Output goes to stdout (the terminal) AND is captured inside
# the script to logs/overnight-<timestamp>.log
exec "$PYTHON" "$SCRIPT" "$@"
