---
description: Inspect the ralph loop, diagnose issues, and make targeted fixes to unblock it
---

Check on the autonomous ralph loop and fix anything that's blocking it.

## 1 — Gather state (run all in parallel)

```bash
# Is the loop process alive?
pgrep -f ralph-loop.sh && echo "RUNNING" || echo "STOPPED"

# Most recent log file
ls -t /Users/kbux/code/battlegrounds/logs/ralph-*.log 2>/dev/null | head -1

# Last 25 ledger entries (completed iterations)
tail -25 /Users/kbux/code/battlegrounds/docs/loop-ledger.md

# Backlog — Now + Quarantined sections
cat /Users/kbux/code/battlegrounds/docs/loop-backlog.md
```

Then read the last 100 lines of the most recent log file found above.

Also run:
```bash
# How many items are quarantined?
grep -c "<!-- failed" /Users/kbux/code/battlegrounds/docs/loop-backlog.md 2>/dev/null || echo 0

# Current test status (quick check, don't block if slow)
cd /Users/kbux/code/battlegrounds && bun test 2>&1 | tail -3
bun typecheck 2>&1 | tail -3
```

## 2 — Diagnose

From the gathered state, identify which of these situations applies:

**A. Loop not running**
- Check if `.ralph-stop` exists: `ls /Users/kbux/code/battlegrounds/.ralph-stop 2>/dev/null`
- Check if it ran out of time or hit `--max-time`
- Note: loop is expected to be running unless user stopped it deliberately

**B. Consecutive failures (≥3 "REVERTED" in recent log)**
Triage the failure mode by reading the most recent `iter-*.log`:
```bash
ls -t /Users/kbux/code/battlegrounds/logs/iter-*.log 2>/dev/null | head -3
```
Read the last 2 iter logs. Identify the root cause:
- `typecheck=0` → TypeScript error introduced by the model
- `tests=0` → test failures; run `bun test` to see which
- `real_diff=0` → model ran but committed nothing useful (analysis loop)
- `new_commit=0` → opencode produced no commit at all

**C. Test suite broken (pre-existing failures)**
If `bun test` shows failures, these will block every iteration. Fix them first before
doing anything else. See the patterns already established in this repo: check
`tests/combat/` and `tests/simulation/` for the failing test, trace through
`src/game/combat.ts` or the relevant minion file, and fix the root cause.

**D. Quarantine growing (>5 items)**
Too many quarantined tasks means the backlog has tasks that are systematically
hard. Review each: if the task is genuinely implementable, fix the concrete blocker
(missing hook, wrong type, etc.) and move it back to Now. If it's truly out of scope,
delete it.

**E. Loop running and succeeding**
Report the last 5 completions from the ledger and the current Now queue depth.
No action needed.

## 3 — Fix

Act on the diagnosis. Prioritise in this order:

1. **Fix broken tests first** — a failing test suite blocks every iteration.
   Read the test, read the source, fix the root cause. Don't just update the
   assertion to match wrong behaviour.

2. **Fix TypeScript errors** — run `bun typecheck`, find the error, fix it in
   the source file that introduced it.

3. **If real_diff=0 or no commit** — the model is probably picking a vague task
   ("audit X", "refactor Y") or a task that requires browser testing. Move those
   tasks out of Now and replace with more concrete ones from Soon. The top of Now
   should always have at least 3 small, concrete, test-verifiable tasks.

4. **If tasks are being quarantined fast** — read the iter log for the quarantined
   task, understand what went wrong, either fix the underlying issue or rewrite the
   task description to be more concrete/narrow.

5. **If loop is stopped** — check if it was a deliberate stop (`.ralph-stop` existed),
   ran out of time, or crashed. If it should be running, start it:
   ```bash
   cd /Users/kbux/code/battlegrounds && nohup ./scripts/ralph-loop.sh >> logs/ralph-manual-restart.log 2>&1 &
   echo "Loop PID: $!"
   ```

6. **If loop is healthy** — just report the status and estimated tasks remaining.

## 4 — Report

End with a concise status block:

```
Loop: RUNNING / STOPPED
Last 5 completions: [list from ledger]
Consecutive fails: N (cause: X)
Now queue depth: N tasks
Actions taken: [list what you changed, or "none"]
```

Commit any backlog edits made:
```bash
cd /Users/kbux/code/battlegrounds
git add docs/loop-backlog.md
git diff --cached --quiet || git commit -m "chore: ralph-check adjustments $(date +%Y-%m-%dT%H:%M)"
```
