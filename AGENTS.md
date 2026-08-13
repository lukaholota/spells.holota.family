# Codex project instructions

## Required reading at the start of work

Before proposing or changing code, read:

- `CLAUDE.md`
- `docs/README.md`
- `docs/DECISIONS.md`
- the active KR document under `docs/o*/`
- `docs/KNOWN-BUGS.md` when working on rules or characterization

Read the applicable session handoff or journal before resuming an unfinished KR.  Treat those
documents as the source of truth; keep this file short rather than duplicating them.

## Non-negotiable project rules

- This is D&D 5e **2014**, never silently apply 2024 rules.
- `main` deploys directly to production. Never push without the owner's explicit request.
- Before changing behaviour in `src/lib/actions/` or `src/lib/logic/`, add a characterization test
  and prove it fails when its covered behaviour is deliberately broken, then restore the code.
- During O2, document empirically confirmed bugs in `docs/KNOWN-BUGS.md`; do not fix them as part
  of characterization.
- Never run direct SQL against production. The database is the schema source of truth; follow the
  SQL → owner applies → `bun run db:pull` workflow. Never hand-edit `prisma/schema.prisma`, run
  `prisma db push`, or run Prisma migrations.
- Database tests use `spells_test` through `./scripts/db-tunnel.sh`; check `--status` before a
  test run. Tests must remain file-serial (`fileParallelism: false`).
- Explain every command beforehand, including whether it only reads files or writes to files, a
  test database, the network, or production.
- Do not add `Co-Authored-By` trailers to commits.
