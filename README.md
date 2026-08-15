# Oblak Studio Renovate Config

Shared Renovate policy for public, internal, and private repositories using the
Mend-hosted GitHub App. The universal preset supports Composer/PHP, npm and
TypeScript projects, GitHub Actions, Docker, and other stable Renovate managers.

## Quick Start

Pin consumers to an immutable release tag:

```json
{
  "extends": ["github>oblakstudio/renovate-config#1.0.0"]
}
```

Choose a repository-specific preset when range behavior matters:

| Preset                           | Use for                                   |
| -------------------------------- | ----------------------------------------- |
| `default` or `presets/base`      | Universal organization policy             |
| `presets/php-application`        | Deployed Composer apps with lockfiles     |
| `presets/php-library`            | Published Composer packages               |
| `presets/javascript-application` | Deployed npm, pnpm, Yarn, or Bun apps     |
| `presets/javascript-package`     | Published JavaScript packages             |
| `presets/wordpress-plugin`       | Published plugins with PHP and JS tooling |
| `presets/php-constraint`         | Optional PHP runtime override             |
| `presets/private-packagist`      | Optional Mend credential overlay          |

For example:

```json
{
  "extends": [
    "github>oblakstudio/renovate-config//presets/wordpress-plugin#1.0.0",
    "github>oblakstudio/renovate-config//presets/private-packagist#1.0.0"
  ]
}
```

Renovate can update these exact tags through its `renovate-config` manager, but
preset updates always require review.

## Update Policy

Normal updates and automerges run Monday–Thursday before 08:00 in
`Europe/Belgrade`. Renovate opens at most 10 PRs concurrently and 5 per hour.
Runtime minors wait 3 days and require review. Patch, digest, and pin-digest
updates may automerge after 14 days; compatible development-tool and GitHub
Actions minors follow the same rule. Trusted non-major dependencies sourced
from `oblakstudio`, `x-wp`, `oblakhost`, or `woosync` skip the cooldown.

Automerge uses squash PRs and requires a green branch. Failed, pending, or
absent repository checks block merging. Major updates require Dependency
Dashboard approval and review. Vulnerability fixes bypass schedules and
cooldowns but never automerge.

Runtime dependency commits use `fix(deps)` and can trigger a semantic-release
patch. Development and lockfile commits use `chore(deps)`; Actions use
`ci(deps)`. Composer's `php` requirement is never updated. Actions and Docker
references are pinned to immutable digests while retaining readable versions.

## PHP Runtime Overrides

Renovate normally derives PHP compatibility from `composer.json`. Only use the
parameterized overlay when deployment constraints differ from that file:

```json
{
  "extends": [
    "github>oblakstudio/renovate-config//presets/php-application#1.0.0",
    "github>oblakstudio/renovate-config//presets/php-constraint#1.0.0(^8.2)"
  ]
}
```

## Private Packagist

The optional overlay reads `{{ secrets.PRIVATE_PACKAGIST_TOKEN }}` from Mend's
organization secrets and authenticates `repo.packagist.com` as username
`token`. Never place the token in this repository or a consumer config. Ensure
the Mend secret is available to every intended public, internal, or private
repository before enabling the overlay.

A read-only token can fetch releases already mirrored by Private Packagist. If
an update introduces a package that must first be mirrored, the artifact update
will fail safely. Add a dedicated update-capable credential only if that use
case becomes necessary.

## Repository Overrides

Place the organization preset first, then add the narrowest possible local
`packageRules`. Every exception should include a `description` explaining why
it exists. `config:recommended` ignores common test, fixture, example, and
generated paths; explicitly opt a maintained dependency file back in when it
lives there.

## Legacy Paths

Compatibility aliases remain supported through all `1.x` releases:

| Legacy path                               | Replacement                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| `common/base.json` or `common/base.json5` | `presets/base`                                         |
| `npm.json` or `typescript/base.json5`     | `presets/javascript-application`                       |
| `wp-plugin.json`                          | `presets/wordpress-plugin`                             |
| `php/php.json`                            | `presets/php-library`                                  |
| `github/github-actions.json`              | `rules/github-actions`                                 |
| `composer/*.json`                         | Valid compatibility presets with scoped Composer rules |

Legacy PHP and WordPress arguments are ignored. Use `presets/php-constraint`
for an explicit runtime override. Removing compatibility aliases requires a
`2.0.0` release.

## Development and Releases

Run `npm ci` followed by `npm test`. The suite checks formatting, every preset
graph, strict Renovate validation, policy outcomes, and local extraction from
representative fixtures. Conventional Commits drive semantic-release on
`master`; successful releases update `CHANGELOG.md` and publish immutable Git
tags and GitHub releases. Published tags must never be moved.
