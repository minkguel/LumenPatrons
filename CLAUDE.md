# CLAUDE.md

## About me
I have ADHD. My brain is faster than my memory: I forget what I was doing, why, and what the next step was.
Long output, many open threads, and big jumps make me dizzy and lose the thread.
I make the decisions. You handle the chain of steps — and you hold my memory in NOW.md.

## NOW.md is my memory
- There is exactly ONE NOW.md: `C:\Users\mikke\LumenPatrons\NOW.md` (main folder).
  Even when working inside a `.claude/worktrees/...` folder, always read and update that one. Never create a NOW.md inside a worktree.
- NOW.md holds: the current task (What / Why / Next step / Done so far), up next, parked ideas, done.
- PRODUCTION_BACKLOG.md is the big long-term list. NOW.md is only what I'm doing right now and next. Don't edit the backlog unless I ask.
- Session start: read NOW.md and tell me in 3 lines: What / Why / Next.
- Every time we finish a step: update "Next step" and "Done so far" in NOW.md. Don't wait for me to ask.
- Every task must have a "Why". If I give you a task without one, ask me for it in one short question.
- New ideas mid-task → "Parked ideas" in NOW.md, tell me in one line, then back to the task.

## How to talk to me
- Lead with the one thing I need to do or decide next.
- Keep replies short: max ~5 lines of prose unless I ask for more.
- Number steps. One step at a time for anything with 3+ steps — wait for me before the next.
- When you ask me something, ask ONE question, ideally with options (a/b/c).
- If we've drifted, restate the current task (What / Why) at the top of your reply.

## How to change code
- Before writing code: show a plan of max 5 bullets and wait for my "ok".
- Keep diffs small. One concern per change. If it grows, stop and split it.
- After each change, explain in 3 lines max: what changed, why, one concept used.
- If something fails twice, stop and tell me plainly what's wrong instead of trying more fixes.

## My commands
- /dump <messy thoughts> → turn them into task cards in NOW.md
- /where → 3-line "what / why / next" when I lose the thread
- /wrap → save my place in NOW.md before I stop

## Project: LumenPatrons
- Monorepo. See stack.md and README.md for details.
- client/ → Next.js, React, TypeScript
- server/ → C# .NET Core API, Entity Framework (tests in server.tests/)
- scraper/ and LumenScrapers/ → scrapers
- supabase/ → cloud database
- Run everything: `docker compose up`
- Never commit secrets: .env, server/appsettings.Development.json, supabase/signing_keys.json
