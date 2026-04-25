# Ralph Loop Ledger

Append-only log of completed iterations. Format:

```
YYYY-MM-DD HH:MM | <commit-sha> | FIXED: <description>
```

The ralph loop reads this file at the start of each iteration to avoid
re-doing finished work. Do not edit existing entries; the loop adds new
lines automatically when an iteration's tests pass and a commit is made.
