# Universal Renovate Configuration Design

**Status:** Approved
**Date:** 2026-08-15

## Context

This repository is the public, shared Renovate configuration for repositories across the `oblakstudio` enterprise. Consumers may be public, internal, or private and use the Mend-hosted Renovate GitHub App.

The immediate failure is a stale nested preset reference: commit `b3ab549` replaced `common/base.json5` with `common/base.json`, while `default.json` and `typescript/base.json5` continued to request the deleted file. Strict validation with Renovate 44.30.3 also found legacy migrations and context-invalid options, including `config:base`, top-level `managers` and matching fields, removed package-pattern options, and repository use of `force`.

## Goals

- Restore all existing consumers without a coordinated flag day.
- Provide one safe universal default plus explicit application, library, WordPress, and private-registry overlays.
- Make preset releases immutable and independently upgradeable.
- Automerge only after real CI checks pass.
- Validate syntax, references, composition, and representative behavior before release.

The first release supports Composer/PHP, WordPress plugins, npm/TypeScript, GitHub Actions, and Docker. Other stable Renovate managers remain discoverable but receive only cross-cutting policy. Custom and experimental managers are out of scope.

## Preset Architecture

New presets use strict JSON and relative composition:

```text
default.json
presets/
  base.json
  php-application.json
  php-library.json
  php-constraint.json
  javascript-application.json
  javascript-package.json
  wordpress-plugin.json
  private-packagist.json
rules/
  core.json
  security.json
  automerge.json
  composer.json
  javascript.json
  github-actions.json
  docker.json
```

`default.json` is the universal entry point. `presets/base.json` composes focused files under `rules/`. Repository-type presets extend the base and add only their specialization. `private-packagist.json` is an additive credential overlay and does not extend the base.

Internal `extends` entries use relative references such as `../rules/core`. Renovate inherits the outer source repository and Git tag for these references, so a consumer pinned to `#1.0.0` resolves the entire graph from that tag.

Example consumer:

```json
{
  "extends": [
    "github>oblakstudio/renovate-config//presets/wordpress-plugin#1.0.0",
    "github>oblakstudio/renovate-config//presets/private-packagist#1.0.0"
  ]
}
```

Repository configuration extends the organization preset first and may add narrowly scoped overrides afterward. Every local exception must include a `description`.

## Core Policy

The base extends `config:recommended` and adds explicit organization policy rather than inheriting the broader `config:best-practices` bundle.

The base retains `config:recommended` exclusions for generated, test, fixture, and example directories. A maintained project inside one of those paths must opt back in through a documented repository override.

| Concern                | Policy                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| Time zone              | `Europe/Belgrade`                                                       |
| Ordinary update window | Monday-Thursday before 08:00                                            |
| Automerge window       | Same as ordinary updates                                                |
| PR limits              | 10 concurrent, 5 new per hour                                           |
| Lockfile maintenance   | Early Monday; automerge after checks                                    |
| Merge method           | PR automerge with squash                                                |
| Status checks          | `ignoreTests: false`; absent, pending, or failed checks block automerge |
| Merge engine           | Renovate-controlled with `platformAutomerge: false`                     |
| Major updates          | Dependency Dashboard approval, then manual review                       |
| Reviewers              | None assigned by Renovate; CODEOWNERS and repository rules apply        |

Automerge candidates remain current with the base branch. Reviewed PRs rebase only when conflicted or manually requested.

### Update Risk

- Patch, digest, and pin-digest updates may automerge after a 14-day release-age cooldown and green checks.
- Minor development-tool and GitHub Actions updates use the same 14-day automerge rule.
- Runtime minor updates wait 3 days and require review.
- All major updates require Dashboard approval and review.
- GitHub and OSV vulnerability fixes are immediate, bypass schedules and cooldowns, and never automerge.
- Preset-version updates managed by Renovate always require review; major preset updates also require Dashboard approval.

Dependencies sourced from these GitHub organizations are trusted internal packages: `oblakstudio`, `x-wp`, `oblakhost`, and `woosync`. The unrelated `xwp` organization is explicitly excluded. Compatible non-major internal updates have no cooldown and may automerge after checks; internal majors remain approval-gated.

### Commits, Labels, and Grouping

Runtime dependency changes use `fix(deps)` and may trigger a semantic-release patch. Development dependencies and lockfile maintenance use `chore(deps)`; GitHub Actions use `ci(deps)`.

Labels are additive and structured with emoji:

- `dependencies 📦`
- `ecosystem: php 🐘`
- `ecosystem: javascript 🟨`
- `ecosystem: github-actions 🤖`
- `ecosystem: docker 🐳`
- `security 🔒`
- `update: major ⚠️`

Runtime dependencies remain separate. Compatible development-tool updates are grouped by ecosystem, while Renovate's recommended monorepo groups remain enabled. Abandonment warnings are advisory and use a one-year threshold. Configuration-migration PRs and the Dependency Dashboard are enabled.

## Ecosystem Overlays

### Composer and PHP

Renovate never modifies the `php` platform requirement in `composer.json`. It uses the repository's declared PHP constraint by default. For exceptional deployment mismatches, `php-constraint.json` is a parameterized additive overlay that sets `constraints.php` without using the forbidden `force` option, for example `//presets/php-constraint#1.0.0(^8.2)`.

- `php-application`: use `update-lockfile`, which updates in-range lockfile versions and replaces constraints only for out-of-range updates.
- `php-library`: widen runtime constraints for compatible new release lines; keep development dependencies lockfile-oriented.
- Group PHPStan and its supported extensions as development tooling.
- Private Packagist support is optional.

### JavaScript and TypeScript

Support npm, pnpm, Yarn Classic/Berry, and Bun through their detected manifests and lockfiles.

- `javascript-application`: preserve manifest ranges for in-range updates and update lockfiles; replace out-of-range constraints.
- `javascript-package`: widen `dependencies`, `optionalDependencies`, and `peerDependencies`; pin development tooling for reproducibility.
- Node major updates group detected runtime files and `@types/node` into one reviewed update. If only one side is detected, Renovate updates it separately. These updates require Dashboard approval and never automerge.

### WordPress

`wordpress-plugin` models published plugin artifacts. It combines PHP-library behavior with lockfile-oriented JavaScript build tooling and semantic-release-compatible commits.

### GitHub Actions and Docker

GitHub Actions are pinned to commit SHAs with readable version annotations. Docker references are pinned as `tag@sha256:digest`, preserving variants such as `-alpine` and `-slim`. Digest and patch refreshes follow the standard automerge policy; Docker runtime minor and major updates remain reviewed. Action majors require Dashboard approval.

## Private Packagist

The Mend organization credential is named `PRIVATE_PACKAGIST_TOKEN`. No secret value is committed. The optional overlay contains only:

```json
{
  "hostRules": [
    {
      "hostType": "packagist",
      "matchHost": "repo.packagist.com",
      "username": "token",
      "password": "{{ secrets.PRIVATE_PACKAGIST_TOKEN }}"
    }
  ]
}
```

A read-only token can fetch packages already mirrored by Private Packagist. It may fail if an update introduces a package that must first be mirrored. Update access is not an initial requirement; the documentation will explain this limitation and recommend a dedicated update token only if it becomes necessary.

## Validation and Release

The repository regains a small Node toolchain with pinned dependencies and a committed lockfile. CI runs on every pull request and must:

1. Parse every JSON and legacy JSON5 file.
2. Run the current pinned `renovate-config-validator` in strict, non-global mode against every public preset.
3. Verify that relative references exist, remain inside the repository, and contain no cycles.
4. Resolve every public composition from the pull-request commit SHA.
5. Exercise Composer, JavaScript, WordPress, Actions, and Docker fixtures with a Renovate dry run.
6. Assert expected managers, rules, cooldowns, grouping, and automerge flags.
7. Run formatting checks and `git diff --check`.

After CI passes on `master`, semantic-release derives the version from Conventional Commits, updates release notes and the changelog, and creates an immutable Git tag and GitHub release. Published tags are never moved or rewritten. Renovate's `renovate-config` manager proposes new preset tags to consumers.

## Compatibility and Migration

The first implementation restores `common/base.json5` as a valid alias, fixing current unpinned consumers as soon as the change reaches `master`. Version `1.0.0` introduces the new entry points.

Existing paths—including `common/base.json`, `common/base.json5`, `npm.json`, `wp-plugin.json`, `typescript/base.json5`, `php/php.json`, `composer/*.json`, and `github/github-actions.json`—become documented aliases to validated replacements. Compatibility is maintained throughout `1.x`; removal requires `2.0.0`. Invalid legacy fragment shapes become valid root presets with equivalent intent.

The README will include a preset matrix, exact-version examples, an old-to-new path table, override guidance, and Private Packagist setup. The unrelated untracked `CLAUDE.md` is outside this work.

## Safe Failure Behavior

- Invalid or unresolved presets block CI and cannot be released.
- Repositories with no CI checks receive PRs but never automerge.
- Artifact or Private Packagist authentication failures prevent merging.
- Security updates remain visible immediately but require a human decision.
- The public default never references an organization secret.

## Acceptance Criteria

- The reported `common/base.json5` resolution error is eliminated.
- Every public entry point resolves from an immutable Git tag, including all nested files.
- Strict validation reports no errors, warnings, or migrations.
- Fixture dry runs demonstrate the approved policy for all first-class ecosystems.
- No plaintext credential or token is introduced in tracked or generated output.
- Legacy consumers continue working throughout `1.x`.
