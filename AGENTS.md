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
