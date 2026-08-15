# Signed Release Compatibility Design

## Context

GitHub Actions run `31884957081` validated the repository successfully, then
failed during semantic-release. `@semantic-release/changelog` changed
`CHANGELOG.md`, and `@semantic-release/git` committed that change and pushed it
to `master`. GitHub rejected the generated commit with `GH013` because the
repository ruleset requires every `master` commit to have a verified signature.

## Decision

Keep verified-signature enforcement unchanged. Semantic-release will analyze
Conventional Commits, generate release notes, tag the existing signed `master`
commit, and publish those notes as an immutable GitHub release. It will not
modify, commit, or push repository files.

Remove `@semantic-release/changelog` and `@semantic-release/git` from the
release configuration and development dependencies. Remove the now-stale
`CHANGELOG.md`; GitHub Releases becomes the canonical release history.

Enable GitHub's repository-level immutable releases setting before publishing
the consumer release. The first successful workflow produced `v1.0.0` before
this setting was enabled, so retain that tag unchanged and publish `v1.0.1`
after enforcement is active. Consumers should pin `v1.0.1` or newer.

## Failure Behavior

The release job continues to depend on the full validation job. GitHub's
protected branch and tag operations remain authoritative: any permission,
ruleset, or publishing error fails the workflow without weakening repository
security or moving an existing tag.

## Verification

The release policy test must require commit analysis, release-note generation,
and GitHub publishing while rejecting plugins that mutate the repository or
publish to npm. The full local `npm test` suite must pass. After pushing the
signed fix commit, the `CI and Release` workflow must validate the repository,
publish `v1.0.1`, and GitHub must report that release as immutable.
