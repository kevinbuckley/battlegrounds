---
description: Start the ralph loop and supervise it hourly — fixing major issues (stop/fix/restart), patching minor ones in-place, auditing task quality/quantity, and generating new tasks when the backlog runs thin
---

You are the Ralph Supervisor. Your job is to keep the ralph autonomous loop healthy and productive.

On the **first invocation** (no prior wakeup context), do **Step 0 → Step A → Step 1**.
On subsequent wakeups, skip Step 0 and do **Step 1 → Step A → Step 2 → Step 3 → Step 4 → Step 5**.

---

## Step 0 — Start the loop (first run only)

Check if ralph is already running:

```bash
pgrep -f ralph-loop.sh && echo "RUNNING" || echo "STOPPED"
```

If STOPPED, start it:

```bash
cd /Users/kbux/code/battlegrounds
nohup ./scripts/ralph-loop.sh >> logs/ralph-supervisor-start.log 2>&1 &
echo "Ralph PID: $!"
```

Wait 5 seconds, then confirm it is alive:

```bash
sleep 5
pgrep -f ralph-loop.sh && echo "CONFIRMED RUNNING" || echo "FAILED TO START — check logs/ralph-supervisor-start.log"
```

If it failed to start, read the last 30 lines of `logs/ralph-supervisor-start.log`, diagnose the issue, fix it, and retry once.

---

## Step A — Task Audit (runs on startup AND every hourly check)

This step runs **every time**, both on first invocation and on each wakeup. It ensures the backlog has enough high-quality, concrete, actionable tasks before the loop picks them.

### A1 — Inventory

Run all in parallel:

```bash
# Full backlog
cat /Users/kbux/code/battlegrounds/docs/loop-backlog.md

# Already-implemented minion files (basenames, no extension)
find /Users/kbux/code/battlegrounds/src/game/minions -name '*.ts' \
  ! -name 'index.ts' ! -name 'define.ts' \
  -exec basename {} .ts \; | sort

# Already-implemented hero files
find /Users/kbux/code/battlegrounds/src/game/heroes -name '*.ts' \
  ! -name 'index.ts' ! -name 'stub.ts' \
  -exec basename {} .ts \; | sort

# Ledger — last 60 lines (what's already done)
tail -60 /Users/kbux/code/battlegrounds/docs/loop-ledger.md

# Game-rules index for sourcing new tasks
cat /Users/kbux/code/battlegrounds/docs/game-rules/README.md
```

### A2 — Count and classify tasks

From the backlog, count:
- **Now-actionable**: unchecked `[S]` or `[M]` items in the Now section that are NOT quarantined
- **Soon-actionable**: same in the Soon section
- **Quarantined**: items marked `<!-- failed`

### A3 — Quality check (top 5 Now tasks)

For each of the top 5 unchecked Now tasks, evaluate:

| Criterion | Pass | Fail |
|-----------|------|------|
| **Concrete output** | Names a specific file, function, or component | Vague — "audit X", "find a bug in Y", "game feel", "investigate" |
| **Already done?** | File does NOT exist in the implementation inventory | The named file already exists on disk |
| **Already ledgered?** | Not mentioned in the last 60 ledger lines | Appears in ledger as FIXED |
| **Size appropriate** | `[S]` (30-min task) or `[M]` (1-hr task) | `[L]` — too large for one iteration |
| **Has a test path** | Includes a test file path OR the task is UI/docs | Pure implementation with no test mentioned |

Mark each task as **GOOD**, **BAD** (vague/too large), or **STALE** (already done).

### A4 — Determine if refill is needed

Refill is needed if **any** of these are true:
- Now-actionable count < 5
- ≥ 2 of the top 5 Now tasks are BAD or STALE
- Now has 0 `[S]` tasks (all `[M]` or `[L]`)
- Both Now and Soon combined have < 8 actionable tasks

### A5 — Generate new tasks (if refill needed)

Generate enough tasks to bring Now-actionable to ≥ 8 and ensure the top 5 are all GOOD.

**How to source tasks:**

1. **Stale tasks** — mark them `[x]` (done) and remove from Now.

2. **Bad tasks** — either rewrite them as concrete `[S]` tasks with a specific file path and test path, or delete them if they're fundamentally un-scoped.

3. **New tasks** — source from:
   - `docs/game-rules/` — find mechanics described in the rules that don't have a corresponding file in `src/game/minions/`, `src/game/heroes/`, or `src/game/effects/`
   - Missing simulation tests — scan `tests/simulation/` for minions that have a file but no sim test
   - Missing hero tests — scan `tests/heroes/` for heroes that have a file but no test
   - UI gaps — check `docs/tasks.md` for UI items not yet in the backlog

**Task format for new items:**

```markdown
- [ ] [S] Add `<MinionName>` (tier N, <type>): <one-sentence mechanic> — <src file path> + <test file path>
- [ ] [S] Add `<HeroName>` hero test — verify <specific behavior> — tests/heroes/<hero-name>.test.ts
- [ ] [S] Add `<MinionName>` simulation test — verify <specific effect> fires correctly — tests/simulation/<minion-name>.sim.test.ts
```

Every new task MUST have:
- A specific named output file
- A specific named behavior to verify (not "implement X", but "verify X gives Y")
- Size `[S]` (prefer) or `[M]` (if genuinely needs two passes)

**Never add:**
- `[L]` tasks to Now
- Tasks whose output file already exists in the inventory
- Tasks that say "audit", "investigate", "find a bug", "game feel", "play one turn"

After writing new tasks, place them at the **top of the Now section** (above existing items), so the loop picks them first.

### A6 — Commit backlog changes

```bash
cd /Users/kbux/code/battlegrounds
git add docs/loop-backlog.md
git diff --cached --quiet || git commit -m "chore: task audit — backlog refill/cleanup $(date +%Y-%m-%dT%H:%M)"
```

Report the audit result:
```
Task Audit: Now-actionable=N  Soon-actionable=N  Quarantined=N
Top-5 quality: GOOD/BAD/STALE GOOD/BAD/STALE ... 
Action: [added N tasks | rewrote N tasks | removed N stale tasks | no changes]
```

---

## Step 1 — Gather loop state (run all in parallel)

```bash
# Is the loop process alive?
pgrep -f ralph-loop.sh && echo "RUNNING" || echo "STOPPED"

# Most recent loop log
ls -t /Users/kbux/code/battlegrounds/logs/ralph-*.log 2>/dev/null | head -1

# Last 30 ledger entries (completed iterations)
tail -30 /Users/kbux/code/battlegrounds/docs/loop-ledger.md

# Quarantine count
grep -c "<!-- failed" /Users/kbux/code/battlegrounds/docs/loop-backlog.md 2>/dev/null || echo 0
```

Then read the **last 80 lines** of the most recent log file found above.

Also run:

```bash
# Last 3 iteration logs — check for consecutive failures
ls -t /Users/kbux/code/battlegrounds/logs/iter-*.log 2>/dev/null | head -3

# Quick health check
cd /Users/kbux/code/battlegrounds
bun typecheck 2>&1 | tail -5
bun test      2>&1 | tail -5
```

Read the last 50 lines of each of those 3 iter logs.

---

## Step 2 — Diagnose loop health

Classify into exactly one of these (task health is handled in Step A above):

### MAJOR issues (stop loop, fix, restart)

- **M1: Test suite broken** — `bun test` shows pre-existing failures. Every iteration reverts until fixed.
- **M2: TypeScript errors** — `bun typecheck` fails. Same.
- **M3: Loop crashed / exited abnormally** — process is STOPPED, no `.ralph-stop` file, not a deliberate stop.
- **M4: Infinite spin** — 5+ consecutive REVERTED lines in recent log with same root cause.

### MINOR issues (fix in-place, keep loop running)

- **N1: Quarantine growing** (>5 items) — tasks are systematically hard.
- **N3: Analysis loops** — iter logs show repeated "let me look at" with no commit.
- **N4: Loop running but slow** — fewer than 2 completions since the last supervisor check.

### HEALTHY

Loop is running, recent ledger shows completions, no consecutive failures.

---

## Step 3 — Act on loop health

### If MAJOR issue:

1. Stop the loop gracefully:
   ```bash
   touch /Users/kbux/code/battlegrounds/.ralph-stop
   ```
2. Wait up to 45 seconds for the process to exit:
   ```bash
   for i in $(seq 1 9); do
     pgrep -f ralph-loop.sh && sleep 5 || { echo "Loop stopped."; break; }
   done
   ```
3. Fix the root cause:
   - **M1 (broken tests):** Read the failing test, read the source, find root cause, fix source. Run `bun test` to confirm green.
   - **M2 (typecheck errors):** Run `bun typecheck`, find error, fix source, confirm.
   - **M3 (crash):** Read log tail, identify crash reason, fix it.
   - **M4 (infinite spin):** Identify the failing task from iter logs, quarantine it, inject 3 concrete recovery tasks at the top of Now.
4. Commit any fixes:
   ```bash
   cd /Users/kbux/code/battlegrounds
   git add -A
   git diff --cached --quiet || git commit -m "fix: ralph-supervisor repair — $(date +%Y-%m-%dT%H:%M)"
   ```
5. Restart the loop:
   ```bash
   cd /Users/kbux/code/battlegrounds
   nohup ./scripts/ralph-loop.sh >> logs/ralph-supervisor-restart.log 2>&1 &
   echo "Restarted. PID: $!"
   ```

### If MINOR issue:

Keep the loop running. Apply targeted patches:

- **N1 (quarantine growing):** For each quarantined task, read the iter log that failed it. If the task is genuinely implementable, rewrite it as a `[S]` Now task. If truly out of scope, delete it.
- **N3 (analysis loops):** Prepend 3 concrete `[S]` tasks to Now. Use the fallback bank in `ralph-loop.sh` as inspiration.
- **N4 (slow):** Check if Now tasks are all `[M]` or `[L]`. Break the first large task into 2-3 `[S]` subtasks.

Commit any backlog changes:
```bash
cd /Users/kbux/code/battlegrounds
git add docs/loop-backlog.md
git diff --cached --quiet || git commit -m "chore: ralph-supervisor backlog patch — $(date +%Y-%m-%dT%H:%M)"
```

---

## Step 4 — Report

```
=== Ralph Supervisor — <timestamp> ===
Loop: RUNNING / STOPPED
Task Audit: Now=N  Soon=N  Quarantined=N  [from Step A]
Loop Diagnosis: MAJOR(M1) / MINOR(N3) / HEALTHY
Last 5 completions: [list from ledger]
Consecutive fails: N (cause: X)
Actions taken: [list what you changed, or "none"]
Next check: in ~1 hour
```

---

## Step 5 — Schedule next wakeup

Use ScheduleWakeup:

- `prompt`: `/supervise-ralph`
- `delaySeconds`: `3540`
- `reason`: `Hourly ralph-supervisor health check`

> **Invocation:** use `/loop /supervise-ralph` (the `/loop` skill handles cadence) or standalone `/supervise-ralph` (self-schedules via ScheduleWakeup). Either way it reschedules itself each hour.
