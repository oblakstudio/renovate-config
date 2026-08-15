# Repository Guidelines

## Project Structure & Module Organization

`default.json` is the universal public entry point. New consumer presets live
in `presets/`; focused reusable policy lives in `rules/`. Historical files under
`common/`, `composer/`, `github/`, `php/`, and `typescript/` are compatibility
aliases and must remain valid throughout `1.x`. Validation utilities are in
`scripts/`, Node tests in `test/`, and representative repositories in
`fixtures/`. Design records and execution plans live under
`docs/superpowers/`.

## Build, Test, and Development Commands

- `npm ci` installs the exact toolchain from `package-lock.json`.
- `npm test` runs formatting, unit/policy tests, strict preset validation, and
  real Renovate extraction fixtures.
- `npm run validate` validates all 27 public entry points with pinned Renovate.
- `npm run test:fixtures` exercises Composer, npm, WordPress, Actions, and
  Docker detection locally.
- `npm run format` formats supported files; use `git diff --check` before a PR.

## Coding Style & Naming Conventions

Use two-space indentation, LF endings, and descriptive `kebab-case` preset
names such as `javascript-application.json`. New configuration must be strict
JSON; JSON5 is reserved for existing compatibility paths. Keep rules small and
include a `description` on every local exception. Prettier 3 is authoritative.

## Testing Guidelines

Tests use Node's built-in test runner and follow `*.test.mjs`. Add a failing
behavior test before changing loader or policy behavior. Update the public
preset catalog when adding an entry point and add a fixture when introducing a
first-class manager. No validation warning or migration is acceptable.

## Commit & Pull Request Guidelines

Use Conventional Commits, for example `feat: add container preset` or
`fix: restore legacy preset path`. Pull requests should explain policy impact,
list affected presets and compatibility paths, and report `npm test`. Link the
relevant issue; screenshots are only useful for Dependency Dashboard or PR-body
changes. Never rewrite a published release tag.

## Security & Configuration

Never commit credentials. Private Packagist must reference only
`{{ secrets.PRIVATE_PACKAGIST_TOKEN }}` from Mend organization secrets. Confirm
the public default remains secret-free before proposing a release.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
