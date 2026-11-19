# CLAUDE.md — rules for Claude in lexjab-sim

## Project

LexJab Sim is a browser simulator of the unit-repetition algorithm for the LexJab mobile app.
Owner: Віталій (GitHub: Airteg). He works from any device, often a tablet.
On his Windows PC he also runs the site locally: clone in `D:\ProjectsVVV\_Native\lexjab-sim`, VS Code, PowerShell. No local AI agent is used for this repo: all code, commits and PRs come from Claude in the cloud.
Node on that PC is managed by nvm. Do not pin a Node version (`.nvmrc`, `.node-version`, a narrower `engines.node` than `>=22`) that would force him to install another Node.

Read before any task:
- `doc/declaration.md` — goals, decisions, modes, deliverables, stages.
- `doc/requirements.md` — first-version requirements (deadline mode).

## Language

- Talk to Віталій in Ukrainian, informal ("ти"). Be concise and document-like.
- If Віталій has to do anything (merge a PR, change a setting, answer a question), end the message with a section «Що тобі зробити» — numbered steps, detailed: exact place in the UI (menu path, button and field names as GitHub shows them), exact values to enter or select, and the text to paste if any. Never leave a required action only in the middle of the message.
- Ukrainian: all docs in `doc/`, `README.md`, commit messages, PR titles and descriptions, UI text of the site.
- English: identifiers and comments in code, this file and any other AI instruction files. Code comments are written for Claude; Віталій does not read them.

## Workflow

- Never commit to `main`. One branch per task, one PR per branch.
- Віталій reviews and merges (squash). Do not merge PRs yourself.
- Never force-push or rewrite pushed history. Fix with a new commit.
- Before opening a PR, check that `main` has not moved; rebase the branch onto the latest `main` if needed.
- Every PR description lists what changed and how it was verified.
- Package manager: pnpm only. Use `pnpm dlx`, never `npm` or `npx`.
- Respect pnpm `minimumReleaseAge`: pick package versions old enough to pass it; never add exclusions to bypass it.
- Local actions on Віталій's PC (update the clone, install, start the dev server): give exact PowerShell commands, one per line, in the order to run them, with what output to expect and what to send back if a command fails. Usual set after a merge: `git pull --ff-only origin main`, `pnpm install --frozen-lockfile`, `pnpm start` (dev server, site at `http://localhost:5173/lexjab-sim/`).

## Facts only

- No invented rules, constants, formulas or results. Every algorithm rule comes from `doc/`. If something is missing or ambiguous, ask Віталій before implementing.
- The spec in `doc/` is the norm; constants in code are its copy. To change a rule: update the spec first, then the code, in the same PR.
- Any change of rules or constants bumps the version of the algorithm module.
- When reporting simulation results, state the parameters, number of runs and seed.

## Architecture

```
packages/core  — algorithm module, shared with the LexJab app
packages/sim   — learner model, runs, statistics
apps/web       — site (Vite + React + TypeScript, GitHub Pages)
```

- Dependencies go one way: `web → sim → core`.
- `core` is pure: no DOM, no storage, no `Date`, no `Math.random`. Time and randomness come from the caller.
- `core` answers two questions only: which units go into the next lesson, and how a grade changes the state.
- Grade generation, forgetting model and statistics live in `sim`, never in `core`.
- `web` contains no algorithm logic.
- Runs are reproducible: same inputs and seed give the same result.

## Verification

- Every rule in `core` has tests. Control examples from the spec (grade sequence → expected lesson composition) are tests too.
- Run type checks, lint (`pnpm lint`) and tests before every push; do not open a PR with failing checks.
- Python results of experiment 2 are not a reference. Віталій checks the site himself: small decks first, then 100-unit decks.

## Purpose of the site

- A research tool for developing the repetition algorithm, replacing Google Sheets. Not a product or a demo.
- Every parameter is a constant in one registry (name, Ukrainian description, default, limits, spec reference). The Constants page is generated from it.
- Grade-generation methods are pluggable; add new ones next to old ones.
- Defaults are the spec; editing them on the site is an experiment recorded with the run, not a version change.
- Page structure is not final; change it when it becomes inconvenient.
