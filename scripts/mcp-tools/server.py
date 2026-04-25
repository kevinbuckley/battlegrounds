#!/usr/bin/env python3
"""
Battlegrounds Ralph Loop — MCP tool sidecar.

Exposes web_fetch and Playwright-based browser tools to OpenCode (or any
MCP-compatible agent) so the local model can do real research and live
browser smoke tests during the autonomous loop.

Tools:
  web_fetch(url)              -> text contents of a webpage
  browser_navigate(url)       -> page text + console errors
  browser_click(selector)     -> click by selector or visible text
  browser_evaluate(js)        -> evaluate JS, return result
  browser_get_errors()        -> all console errors since last navigate
  browser_wait_reload(ms?)    -> wait + reload for Next.js HMR

Run:
  python3 scripts/mcp-tools/server.py
"""
from __future__ import annotations

import re
import time
import urllib.error
import urllib.request
from typing import Any

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("bg-ralph-tools")


# ---------------------------------------------------------------------------
# Browser singleton (lazy)
# ---------------------------------------------------------------------------
_pw = None
_browser = None
_page = None
_console_errors: list[str] = []


def _ensure_browser() -> None:
    global _pw, _browser, _page, _console_errors
    if _page is not None:
        return
    from playwright.sync_api import sync_playwright

    _pw = sync_playwright().__enter__()
    _browser = _pw.chromium.launch(headless=True)
    _page = _browser.new_page()
    _page.on(
        "console",
        lambda msg: _console_errors.append(f"[{msg.type}] {msg.text}")
        if msg.type in ("error", "warning")
        else None,
    )
    _page.on("pageerror", lambda err: _console_errors.append(f"[pageerror] {err}"))


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------
@mcp.tool()
def web_fetch(url: str) -> str:
    """Fetch a URL and return readable text. Use hearthstone.wiki.gg for game research."""
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
        text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.S)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = text.strip()
        if len(text) > 12_000:
            text = text[:12_000] + "\n...(truncated)..."
        return text or "(empty page)"
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.reason} — {url}"
    except Exception as e:
        return f"ERROR fetching {url}: {e}"


@mcp.tool()
def browser_navigate(url: str) -> str:
    """Navigate the headless browser to URL. Returns page text and any console errors.
    Use http://localhost:3000 to test the live app during the loop."""
    _ensure_browser()
    global _console_errors
    _console_errors = []
    try:
        _page.goto(url, wait_until="networkidle", timeout=15_000)
        time.sleep(0.5)
        text = _page.inner_text("body") or ""
        out = text[:4_000]
        if _console_errors:
            out += "\n\n--- Console errors ---\n" + "\n".join(_console_errors[:30])
        return out or "(empty page)"
    except Exception as e:
        return f"ERROR navigating {url}: {e}"


@mcp.tool()
def browser_click(selector: str) -> str:
    """Click an element by CSS selector or visible text.
    Examples: 'Start game', 'button.buy-btn', '#hero-select'."""
    _ensure_browser()
    try:
        _page.click(selector, timeout=5_000)
        time.sleep(0.3)
        return "OK"
    except Exception:
        try:
            _page.get_by_text(selector, exact=False).first.click(timeout=3_000)
            time.sleep(0.3)
            return "OK (matched by text)"
        except Exception as e:
            return f"ERROR clicking '{selector}': {e}"


@mcp.tool()
def browser_evaluate(js: str) -> str:
    """Execute JS in the page and return the result as a string.
    Useful for inspecting React/Zustand state or DOM details.
    Example: 'document.querySelectorAll(\"button\").length'"""
    _ensure_browser()
    try:
        result: Any = _page.evaluate(js)
        return str(result)[:4_000]
    except Exception as e:
        return f"ERROR evaluating JS: {e}"


@mcp.tool()
def browser_get_errors() -> str:
    """Return all console errors/warnings captured since the last browser_navigate."""
    return "\n".join(_console_errors) if _console_errors else "(no errors)"


@mcp.tool()
def browser_wait_reload(ms: int = 3000) -> str:
    """Wait for Next.js HMR after a code change, then reload the current page."""
    _ensure_browser()
    time.sleep(ms / 1000)
    try:
        _page.reload(wait_until="networkidle", timeout=10_000)
        return "Reloaded OK"
    except Exception as e:
        return f"ERROR reloading: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
