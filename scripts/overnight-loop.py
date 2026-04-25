#!/usr/bin/env python3
"""
Overnight Battlegrounds gap-finder loop.
Uses a local Ollama model to repeatedly:
  1. Research one gap vs real Hearthstone Battlegrounds
  2. Implement the fix (code + browser-verified)
  3. Validate via bun test + browser smoke test
  4. Auto-revert on test failure to keep the repo clean

Usage:
  python3 scripts/overnight-loop.py
  python3 scripts/overnight-loop.py --model qwen3:32b --max-iters 30
  python3 scripts/overnight-loop.py --debug
"""

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO          = Path("/Users/kbux/code/battlegrounds")
DEFAULT_MODEL = "qwen3:32b"
OLLAMA_BASE   = "http://localhost:11434"
APP_BASE_URL  = "http://localhost:3000"
MAX_STEPS     = 80
SLEEP_BETWEEN = 20
CTX_TOKENS    = 32768

LOG_DIR = REPO / "logs"
LOG_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
_log_file: Path | None = None
_debug: bool = False

def _log(msg: str) -> None:
    ts   = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    if _log_file:
        with open(_log_file, "a") as f:
            f.write(line + "\n")

def _debug_block(label: str, text: str) -> None:
    if not _debug:
        return
    border = "─" * 60
    print(f"\n┌{border}", flush=True)
    print(f"│ {label}", flush=True)
    print(f"├{border}", flush=True)
    for line in text.splitlines():
        print(f"│ {line}", flush=True)
    print(f"└{border}\n", flush=True)

# ---------------------------------------------------------------------------
# Browser (Playwright) — lazy singleton
# ---------------------------------------------------------------------------
_pw   = None
_browser = None
_page    = None
_console_errors: list[str] = []

def _ensure_browser() -> None:
    global _pw, _browser, _page, _console_errors
    if _page is not None:
        return
    from playwright.sync_api import sync_playwright
    _pw      = sync_playwright().__enter__()
    _browser = _pw.chromium.launch(headless=True)
    _page    = _browser.new_page()
    # Capture console errors
    _page.on("console", lambda msg: _console_errors.append(f"[{msg.type}] {msg.text}")
             if msg.type in ("error", "warning") else None)
    _page.on("pageerror", lambda err: _console_errors.append(f"[pageerror] {err}"))

def _close_browser() -> None:
    global _pw, _browser, _page
    try:
        if _browser:
            _browser.close()
        if _pw:
            _pw.__exit__(None, None, None)
    except Exception:
        pass
    _pw = _browser = _page = None

def tool_browser_navigate(url: str) -> str:
    _log(f"  browser: navigate {url}")
    _ensure_browser()
    global _console_errors
    _console_errors = []
    try:
        _page.goto(url, wait_until="networkidle", timeout=15_000)
        time.sleep(0.5)  # let React hydrate
        # Accessibility snapshot — text-friendly for LLM
        text = _page.inner_text("body") or ""
        errors = _console_errors[:]
        out = text[:3000]
        if errors:
            out += "\n\n--- Console errors ---\n" + "\n".join(errors[:20])
        return out or "(empty page)"
    except Exception as e:
        return f"ERROR navigating {url}: {e}"

def tool_browser_evaluate(js: str) -> str:
    _log(f"  browser: evaluate {js[:80]}")
    _ensure_browser()
    try:
        result = _page.evaluate(js)
        return str(result)[:3000]
    except Exception as e:
        return f"ERROR evaluating JS: {e}"

def tool_browser_click(selector: str) -> str:
    _log(f"  browser: click '{selector}'")
    _ensure_browser()
    try:
        _page.click(selector, timeout=5_000)
        time.sleep(0.3)
        return "OK"
    except Exception as e:
        # Try by text if selector fails
        try:
            _page.get_by_text(selector, exact=False).first.click(timeout=3_000)
            time.sleep(0.3)
            return "OK (matched by text)"
        except Exception:
            return f"ERROR clicking '{selector}': {e}"

def tool_browser_get_errors() -> str:
    _log("  browser: get_errors")
    errors = _console_errors[:]
    return "\n".join(errors) if errors else "(no errors)"

def tool_browser_wait_for_reload(ms: int = 3000) -> str:
    """Wait for Next.js hot-reload after a code change."""
    _log(f"  browser: waiting {ms}ms for hot-reload")
    time.sleep(ms / 1000)
    _ensure_browser()
    try:
        _page.reload(wait_until="networkidle", timeout=10_000)
        return "Reloaded OK"
    except Exception as e:
        return f"ERROR reloading: {e}"

# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------
def git_stash(msg: str) -> str:
    r = subprocess.run(
        ["git", "stash", "push", "-m", msg],
        cwd=REPO, capture_output=True, text=True,
    )
    return r.stdout.strip() or r.stderr.strip()

def git_stash_pop() -> str:
    r = subprocess.run(
        ["git", "stash", "pop"],
        cwd=REPO, capture_output=True, text=True,
    )
    return r.stdout.strip() or r.stderr.strip()

def git_commit(msg: str) -> str:
    subprocess.run(["git", "add", "-A"], cwd=REPO, capture_output=True)
    r = subprocess.run(
        ["git", "commit", "-m", msg],
        cwd=REPO, capture_output=True, text=True,
    )
    return r.stdout.strip() or r.stderr.strip()

def git_diff_stat() -> str:
    r = subprocess.run(
        ["git", "diff", "--stat", "HEAD"],
        cwd=REPO, capture_output=True, text=True,
    )
    return r.stdout.strip() or "(clean)"

# ---------------------------------------------------------------------------
# Shell / file tools
# ---------------------------------------------------------------------------
def tool_bash(command: str) -> str:
    _log(f"  $ {command[:100]}")
    try:
        r = subprocess.run(
            command, shell=True, cwd=REPO,
            capture_output=True, text=True, timeout=180,
        )
        out = (r.stdout + r.stderr).strip()
        if len(out) > 8000:
            out = out[:4000] + "\n...(truncated)...\n" + out[-4000:]
        return out or "(no output)"
    except subprocess.TimeoutExpired:
        return "ERROR: command timed out after 180s"
    except Exception as e:
        return f"ERROR: {e}"

def tool_read(path: str) -> str:
    _log(f"  read: {path}")
    try:
        content = (REPO / path).read_text()
        if len(content) > 10_000:
            content = content[:10_000] + "\n...(file truncated at 10 000 chars)..."
        return content
    except Exception as e:
        return f"ERROR reading {path}: {e}"

def tool_write(path: str, content: str) -> str:
    _log(f"  write: {path} ({len(content)} chars)")
    try:
        target = REPO / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
        return f"OK: wrote {path}"
    except Exception as e:
        return f"ERROR writing {path}: {e}"

def tool_web_fetch(url: str) -> str:
    _log(f"  fetch: {url}")
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 Chrome/120 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,*/*",
            },
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        text = re.sub(r"<script[^>]*>.*?</script>", " ", raw, flags=re.S)
        text = re.sub(r"<style[^>]*>.*?</style>",  " ", text, flags=re.S)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = text.strip()
        if len(text) > 10_000:
            text = text[:10_000] + "\n...(page truncated)..."
        return text or "(empty page)"
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.reason} — {url}"
    except Exception as e:
        return f"ERROR fetching {url}: {e}"

TOOL_IMPLS = {
    "bash":                 lambda a: tool_bash(a["command"]),
    "read_file":            lambda a: tool_read(a["path"]),
    "write_file":           lambda a: tool_write(a["path"], a["content"]),
    "web_fetch":            lambda a: tool_web_fetch(a["url"]),
    "browser_navigate":     lambda a: tool_browser_navigate(a["url"]),
    "browser_evaluate":     lambda a: tool_browser_evaluate(a["js"]),
    "browser_click":        lambda a: tool_browser_click(a["selector"]),
    "browser_get_errors":   lambda a: tool_browser_get_errors(),
    "browser_wait_reload":  lambda a: tool_browser_wait_for_reload(a.get("ms", 3000)),
}

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": (
                "Run a shell command in the repo root. "
                "Use for: bun test, bun typecheck, ls, cat, grep, git log/diff/status."
            ),
            "parameters": {
                "type": "object",
                "properties": {"command": {"type": "string"}},
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a file (path relative to repo root).",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string", "description": "Repo-relative path"}},
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write (overwrite) a file. Use for implementing fixes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path":    {"type": "string"},
                    "content": {"type": "string", "description": "Full file content"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_fetch",
            "description": (
                "Fetch a URL and return its text. "
                "ALWAYS use hearthstone.wiki.gg (not hearthstone.wiki or hearthstone.com). "
                "Example: https://hearthstone.wiki.gg/wiki/Battlegrounds"
            ),
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string"}},
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_navigate",
            "description": (
                f"Navigate the headless browser to a URL and return the page text + any "
                f"console errors. Use to load {APP_BASE_URL} and inspect the live app."
            ),
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string"}},
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_evaluate",
            "description": (
                "Execute JavaScript in the browser page and return the result. "
                "Useful for inspecting React/Zustand state or checking DOM details. "
                "Example: document.querySelectorAll('button').length"
            ),
            "parameters": {
                "type": "object",
                "properties": {"js": {"type": "string", "description": "JS expression to evaluate"}},
                "required": ["js"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_click",
            "description": (
                "Click an element in the browser by CSS selector or visible text. "
                "Examples: 'Start game', 'button.buy-btn', '#hero-select'"
            ),
            "parameters": {
                "type": "object",
                "properties": {"selector": {"type": "string"}},
                "required": ["selector"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_get_errors",
            "description": "Return all console errors/warnings captured since last browser_navigate.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_wait_reload",
            "description": (
                "Wait for Next.js hot-reload after a code change, then refresh the page. "
                "Call this after writing files before re-testing in the browser."
            ),
            "parameters": {
                "type": "object",
                "properties": {"ms": {"type": "integer", "description": "ms to wait (default 3000)"}},
                "required": [],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
def _load_claude_md() -> str:
    try:
        return (REPO / "CLAUDE.md").read_text()
    except Exception:
        return ""

SYSTEM_TEMPLATE = """\
You are a senior engineer maintaining a TypeScript/Next.js clone of Hearthstone Battlegrounds.
Repository: /Users/kbux/code/battlegrounds
Live app:   http://localhost:3000

=== CLAUDE.md (project rules — follow exactly) ===
{claude_md}
=== END CLAUDE.md ===

YOUR WORKFLOW each session:
1. EXPLORE   — read relevant src/ files and docs/game-rules/ docs.
2. RESEARCH  — fetch https://hearthstone.wiki.gg/wiki/Battlegrounds (or a specific mechanic page)
               to find ONE concrete gap between the real game and this codebase.
3. IDENTIFY  — state exactly: what real BG does vs what the code does.
4. IMPLEMENT — write/edit TypeScript. Small, focused change.
5. TEST      — run `bun test`. Fix any failures. Do NOT finish until tests pass.
6. BROWSER   — navigate to http://localhost:3000, click through the relevant UI,
               check for JS errors, verify the change works visually.
               After code changes call browser_wait_reload before re-checking.
7. COMMIT    — run: git add -A && git commit -m "fix: <description>"
8. SUMMARISE — end with exactly one line: "FIXED: <short description>"

RULES:
- Never ask questions. Decide and act.
- Never stop mid-task to check in.
- src/game/ is PURE — no Math.random, no fetch, no Date.now.
- One minion per file under src/game/minions/<tier>/.
- bun test must pass with zero regressions before you finish.
- If tests fail after your change, revert and try a different approach.
"""

USER_PROMPT = (
    "Find 1 gap between this implementation and real Hearthstone Battlegrounds "
    "and fix it completely. Validate with: (a) bun test passing, "
    "(b) browser smoke test at http://localhost:3000 showing no JS errors. "
    "Commit the change. End with: FIXED: <one-line description>"
)

# ---------------------------------------------------------------------------
# Ollama API
# ---------------------------------------------------------------------------
def ollama_chat(messages: list, tools: list, model: str) -> dict:
    payload = json.dumps({
        "model":    model,
        "messages": messages,
        "tools":    tools,
        "stream":   False,
        "options":  {
            "num_ctx":     CTX_TOKENS,
            "temperature": 0.2,
        },
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_BASE}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama HTTP {e.code}: {body[:400]}") from e

# ---------------------------------------------------------------------------
# Single iteration
# ---------------------------------------------------------------------------
def run_iteration(n: int, model: str) -> str:
    _log(f"{'='*60}")
    _log(f"  ITERATION {n}  model={model}")
    _log(f"{'='*60}")

    # Snapshot HEAD so we can revert if tests fail
    snap = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True, text=True
    ).stdout.strip()

    system = SYSTEM_TEMPLATE.format(claude_md=_load_claude_md())
    messages: list[dict] = [
        {"role": "system", "content": system},
        {"role": "user",   "content": USER_PROMPT},
    ]

    final_content = ""
    tests_passed  = False

    for step in range(1, MAX_STEPS + 1):
        _log(f"  [step {step}] calling model...")

        if _debug:
            for i, m in enumerate(messages):
                role = m["role"].upper()
                body = m.get("content") or ""
                if m.get("tool_calls"):
                    calls = ", ".join(
                        f'{tc["function"]["name"]}({tc["function"]["arguments"][:80]})'
                        for tc in m["tool_calls"]
                    )
                    body = f"[TOOL CALLS] {calls}"
                _debug_block(f"PROMPT msg[{i}] role={role}", body[:2000])

        resp   = ollama_chat(messages, TOOL_SCHEMAS, model)
        choice = resp["choices"][0]
        msg    = choice["message"]

        if _debug:
            content_preview = (msg.get("content") or "")[:2000]
            tool_preview = ""
            if msg.get("tool_calls"):
                tool_preview = "\n[TOOL CALLS]\n" + "\n".join(
                    f'  {tc["function"]["name"]}({tc["function"]["arguments"][:200]})'
                    for tc in msg["tool_calls"]
                )
            _debug_block(f"RESPONSE step={step}", content_preview + tool_preview)

        messages.append({
            "role":    "assistant",
            "content": msg.get("content") or "",
            **({"tool_calls": msg["tool_calls"]} if msg.get("tool_calls") else {}),
        })

        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            final_content = msg.get("content", "")
            _log("  Model finished (no tool calls)")
            break

        for tc in tool_calls:
            fn_name = tc["function"]["name"]
            try:
                fn_args = json.loads(tc["function"]["arguments"])
            except json.JSONDecodeError:
                fn_args = {}

            # Track if the model ran tests and they passed
            if fn_name == "bash" and "bun test" in fn_args.get("command", ""):
                result = TOOL_IMPLS["bash"](fn_args)
                if "passed" in result.lower() and "failed" not in result.lower():
                    tests_passed = True
            else:
                impl = TOOL_IMPLS.get(fn_name)
                result = impl(fn_args) if impl else f"Unknown tool: {fn_name}"

            _debug_block(f"TOOL RESULT {fn_name}", str(result)[:2000])

            messages.append({
                "role":         "tool",
                "tool_call_id": tc.get("id", "0"),
                "content":      str(result),
            })
    else:
        _log(f"  WARNING: hit MAX_STEPS={MAX_STEPS}")
        final_content = "INCOMPLETE (max steps)"

    # -----------------------------------------------------------------------
    # Safety: if the model made changes but tests never passed, revert
    # -----------------------------------------------------------------------
    current = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True, text=True
    ).stdout.strip()
    has_uncommitted = subprocess.run(
        ["git", "diff", "--quiet"], cwd=REPO
    ).returncode != 0

    if has_uncommitted and not tests_passed:
        _log("  ⚠ Uncommitted changes but tests never passed — reverting")
        subprocess.run(["git", "checkout", "."], cwd=REPO, capture_output=True)
        subprocess.run(["git", "clean", "-fd"], cwd=REPO, capture_output=True)

    return final_content

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    global _log_file, _debug

    parser = argparse.ArgumentParser()
    parser.add_argument("--model",     default=DEFAULT_MODEL)
    parser.add_argument("--max-iters", type=int, default=999)
    parser.add_argument("--sleep",     type=int, default=SLEEP_BETWEEN)
    parser.add_argument("--debug",     action="store_true")
    args = parser.parse_args()
    _debug = args.debug

    stamp     = datetime.now().strftime("%Y%m%d-%H%M")
    _log_file = LOG_DIR / f"overnight-{stamp}.log"

    _log("Overnight BG gap-finder starting")
    _log(f"  model      = {args.model}")
    _log(f"  max_iters  = {args.max_iters}")
    _log(f"  sleep      = {args.sleep}s")
    _log(f"  app_url    = {APP_BASE_URL}")
    _log(f"  log file   = {_log_file}")

    # Verify Ollama
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE}/api/tags", timeout=5) as r:
            data  = json.loads(r.read())
            names = [m["name"] for m in data.get("models", [])]
    except Exception as e:
        _log(f"ERROR: Ollama not reachable: {e}")
        sys.exit(1)

    if args.model not in names:
        _log(f"ERROR: model '{args.model}' not in Ollama (have: {', '.join(names[:5])})")
        sys.exit(1)
    _log(f"Ollama OK. Model '{args.model}' ready.")

    # Verify dev server
    try:
        urllib.request.urlopen(APP_BASE_URL, timeout=5)
        _log(f"Dev server OK at {APP_BASE_URL}")
    except Exception:
        _log(f"WARNING: dev server not responding at {APP_BASE_URL}")
        _log("  Start it with: bun dev")

    _log("")

    # Summary log for FIXED: lines
    summary_log = LOG_DIR / f"fixed-{stamp}.log"

    for i in range(1, args.max_iters + 1):
        try:
            result = run_iteration(i, args.model)
            fixed_line = next(
                (line for line in reversed(result.splitlines()) if line.startswith("FIXED:")),
                None,
            )
            _log(f"  Result: {fixed_line or result[:200]}")
            if fixed_line:
                with open(summary_log, "a") as f:
                    f.write(f"[iter {i:03d}] {fixed_line}\n")

        except KeyboardInterrupt:
            _log("Interrupted.")
            break
        except Exception as e:
            _log(f"  ERROR in iteration {i}: {e}")

        if i < args.max_iters:
            _log(f"  Sleeping {args.sleep}s...")
            try:
                time.sleep(args.sleep)
            except KeyboardInterrupt:
                _log("Interrupted during sleep.")
                break

    _close_browser()
    _log("Loop complete.")
    if summary_log.exists():
        _log(f"\nAll fixes logged to: {summary_log}")


if __name__ == "__main__":
    main()
