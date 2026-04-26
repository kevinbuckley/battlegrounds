#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# start-mlx-server.sh — Start the mlx_lm OpenAI-compatible server
#
# Serves Qwen3.6-35B-A3B (MLX 4-bit) on port 8080.
# ~90-110 tok/s on M5 Pro vs ~37 tok/s via Ollama GGUF.
#
# Usage:
#   ./scripts/start-mlx-server.sh          # foreground
#   ./scripts/start-mlx-server.sh &        # background
# ---------------------------------------------------------------------------
MODEL_PATH="/Users/kbux/.cache/mlx/Qwen3.6-35B-A3B-4bit"

if [[ ! -d "$MODEL_PATH" ]]; then
  echo "Model not found at $MODEL_PATH"
  echo "Download it first:"
  echo "  python3 -c \"from huggingface_hub import snapshot_download; snapshot_download('mlx-community/Qwen3.6-35B-A3B-4bit', local_dir='$MODEL_PATH')\""
  exit 1
fi

echo "Starting mlx_lm server on port 8080..."
echo "Model: $MODEL_PATH"
mlx_lm.server \
  --model "$MODEL_PATH" \
  --port 8080 \
  --host 127.0.0.1 \
  --max-tokens 32768 \
  --chat-template-args '{"enable_thinking":false}' \
  --log-level INFO
