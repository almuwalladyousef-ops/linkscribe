# LinkScribe — Setup

This is the first session. Type `begin` to start.

## begin

1. Enter plan mode immediately. Do not write any code
2. Read `(C) intake.md`. Understand what we're building
3. Read each copied skill in `skills/*/SKILL.md`. These are the project rules to follow
4. Ask any clarifying questions before planning
5. Write a complete implementation plan: architecture, folder structure, tech stack, key decisions, build order
6. Present the plan and wait for explicit approval

## After the plan is approved

1. Replace the entire contents of this CLAUDE.md with the verified plan
2. Rename this file to `_setup.md` so it is no longer auto-read
3. From this point on, every new session starts by reading the plan in CLAUDE.md directly — no begin trigger needed

---

## End of Every Session

Before closing, tell Yousef what's worth saving. Be specific — name the decisions, files, or changes that came out of the session.

If yes — write a summary to `sessions/YYYY-MM-DD-topic.md` (use today's actual date, pick a short topic slug). Format:

```markdown
---
node_type: Note
summary: [one line]
---

# YYYY-MM-DD — Topic

## Changes

- `path/to/file` — what it is now (was: what it was before)
- `path/to/file` — created (was: didn't exist)
- `decision or config` — new value (was: old value)

## Connected To

- [[03 Projects/LinkScribe/sessions/00 Sessions]]
```

Each line under Changes is one concrete thing that changed — file, decision, value. What it is now, what it was before. No prose, no summaries.

Then add a one-line entry to `sessions/00 Sessions.md` under ## Files:

- [[sessions/YYYY-MM-DD-topic]] — one line summary

If no — close without saving.
