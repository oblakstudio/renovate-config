# Universal Renovate Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken legacy Renovate presets with a validated universal base, specialized overlays, compatibility aliases, and an immutable semantic-release workflow.

**Architecture:** Strict-JSON entry points compose small relative presets under `presets/` and `rules/`. Node scripts resolve those graphs with Renovate's own merge behavior, validate every public entry point, and materialize representative repositories for local Renovate extraction tests. Legacy paths remain thin aliases throughout `1.x`.

**Tech Stack:** Node.js 24, Renovate 44.30.3, Node test runner, JSON/JSON5, Prettier 3, semantic-release 25, GitHub Actions

## Global Constraints

- Preserve the untracked `CLAUDE.md` and unrelated user changes.
- Never commit a credential value; only reference `{{ secrets.PRIVATE_PACKAGIST_TOKEN }}`.
- Use two-space indentation, LF endings, strict JSON for new files, and JSON5 only for legacy aliases.
- Run strict Renovate validation without warnings or migrations before release.
- Keep all existing preset paths usable through the `1.x` release line.

---

## Task 1: Establish the Node validation harness

**Files:**

- Create: `package.json`
- Create: `package-lock.json`
- Create: `.prettierignore`
- Create: `scripts/preset-loader.mjs`
- Create: `test/preset-loader.test.mjs`

- [x] Write loader tests proving extensionless `.json`/`.json5` resolution, nested relative composition, argument substitution, traversal rejection, and cycle rejection.
- [x] Run `node --test test/preset-loader.test.mjs` and confirm the missing loader fails.
- [x] Implement `loadPreset(entry, args)` with JSON5 parsing, repository-bound path resolution, recursive `extends`, and Renovate's `mergeChildConfig`.
- [x] Pin `renovate@44.30.3`, `json5@2.2.3`, `prettier@3.9.6`, and semantic-release plugins in `devDependencies`; expose `format:check`, `test:unit`, `validate`, `test:fixtures`, and `test` scripts.
- [x] Run loader tests and `npm run format:check`.
- [x] Commit with `test: add preset validation harness`.

## Task 2: Build the universal preset graph

**Files:**

- Create: `rules/{core,security,composer,javascript,github-actions,docker,automerge}.json`
- Create: `presets/{base,php-application,php-library,php-constraint,javascript-application,javascript-package,wordpress-plugin,private-packagist}.json`
- Replace: `default.json`
- Create: `test/preset-policy.test.mjs`

- [x] Add failing policy tests for `config:recommended`, Belgrade schedules, PR limits, squash PR automerge, green-check enforcement, lockfile maintenance, security manual review, major approval, cooldowns, commit types, exact labels, trusted organizations, package strategies, PHP immutability, Action SHA pinning, and Docker digest pinning.
- [x] Implement `rules/core.json` with the approved scheduling, dashboard, rebase, abandonment, commit, and limit policy.
- [x] Implement security and automerge rules so vulnerabilities never automerge, majors require approval, runtime minors remain manual, eligible patch/digest/dev/Action/lockfile updates automerge after checks, and trusted non-major dependencies bypass cooldowns.
- [x] Implement Composer, JavaScript, Actions, and Docker policy rules plus application/library/WordPress specializations.
- [x] Make `presets/private-packagist.json` secret-only and ensure `default.json` extends only `./presets/base`.
- [x] Run `node --test test/preset-policy.test.mjs`.
- [x] Commit with `feat: add universal renovate presets`.

## Task 3: Restore every legacy entry point

**Files:**

- Replace: `common/base.json`
- Create: `common/base.json5`
- Replace: `npm.json`, `wp-plugin.json`, `typescript/base.json5`, `php/php.json`
- Replace: `composer/{bump,do-not-update-php,in-range,phpstan}.json`
- Replace: `github/github-actions.json`
- Create: `test/preset-structure.test.mjs`

- [x] Add failing graph tests that enumerate every public and legacy entry point, require parsable JSON/JSON5, resolve local references inside the repository, and reject cycles.
- [x] Map legacy universal paths to `presets/base`, npm/TypeScript to `presets/javascript-application`, WordPress to `presets/wordpress-plugin`, PHP to `presets/php-library`, and Actions to `rules/github-actions`.
- [x] Convert legacy Composer fragments into valid root presets with scoped `packageRules` preserving their prior behavior.
- [x] Explicitly test that `common/base.json5` resolves and that the unrelated `xwp` organization is not trusted.
- [x] Run all unit tests and strict formatting.
- [x] Commit with `fix: restore legacy renovate preset paths`.

## Task 4: Validate presets and exercise real Renovate extraction

**Files:**

- Create: `scripts/validate-presets.mjs`
- Create: `scripts/test-fixtures.mjs`
- Create: `fixtures/composer-application/{composer.json,composer.lock}`
- Create: `fixtures/javascript-application/{package.json,package-lock.json}`
- Create: `fixtures/wordpress-plugin/{composer.json,package.json}`
- Create: `fixtures/github-actions/.github/workflows/ci.yml`
- Create: `fixtures/docker/{Dockerfile,compose.yml}`

- [x] Implement strict, non-global validation of each public preset with the pinned validator and fail on warnings or migrations.
- [x] Materialize resolved presets into temporary fixture repositories and run pinned Renovate with `--platform=local --dry-run=extract --require-config=required`.
- [x] Assert extraction of Composer, npm, GitHub Actions, Dockerfile, and Docker Compose managers from representative fixtures.
- [x] Run `npm run validate`, `npm run test:fixtures`, and the aggregate `npm test`.
- [x] Commit with `test: verify presets with renovate fixtures`.

## Task 5: Add CI and immutable releases

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `.releaserc.json`
- Create: `CHANGELOG.md`

- [ ] Configure pull-request and `master` CI on Node 24 with `npm ci`, `npm test`, and `git diff --check`.
- [ ] Configure semantic-release for Conventional Commits, generated notes/changelog, GitHub releases, and committed release metadata without publishing to npm.
- [ ] Grant release jobs only `contents`, `issues`, and `pull-requests` write permissions and run releases only after tests pass on `master`.
- [ ] Validate workflow YAML through Renovate extraction and run the local test suite.
- [ ] Commit with `ci: add validated semantic releases`.

## Task 6: Document consumption and contribution

**Files:**

- Replace: `README.md`
- Create conditionally: `AGENTS.md`

- [ ] Confirm `AGENTS.md` does not already exist before writing it.
- [ ] Document the preset matrix, exact SemVer GitHub references, specialization choices, repository overrides, legacy-path mappings, security/automerge behavior, and the Private Packagist Mend secret setup and read-only-token limitation.
- [ ] Write a 200–400 word `AGENTS.md` titled “Repository Guidelines” with repository-specific structure, commands, style, tests, commits, PR requirements, and secret-handling guidance.
- [ ] Run Prettier, all tests, strict preset validation, fixture extraction, `git diff --check`, and a credential-pattern scan.
- [ ] Review the complete diff against the approved design, preserving `CLAUDE.md` untouched.
- [ ] Commit with `docs: add renovate usage and contributor guides`.
