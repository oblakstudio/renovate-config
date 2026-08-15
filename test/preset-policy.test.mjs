import assert from "node:assert/strict";
import test from "node:test";

import { init as initializeRenovateLogger } from "renovate/dist/logger/index.js";
import { applyPackageRules } from "renovate/dist/util/package-rules/index.js";

import { loadPreset } from "../scripts/preset-loader.mjs";

const schedule = ["before 8am on Monday through Thursday"];

await initializeRenovateLogger();

async function resolvedUpdate(entry, update) {
  const config = await loadPreset(entry);
  return applyPackageRules({ ...config, ...update }, "branch");
}

test("the universal base applies the organization-wide safety policy", async () => {
  const config = await loadPreset("presets/base.json");

  assert.ok(config.extends.includes("config:recommended"));
  assert.ok(config.extends.includes(":configMigration"));
  assert.ok(config.extends.includes("abandonments:recommended"));
  assert.equal(config.timezone, "Europe/Belgrade");
  assert.deepEqual(config.schedule, schedule);
  assert.deepEqual(config.automergeSchedule, schedule);
  assert.equal(config.prConcurrentLimit, 10);
  assert.equal(config.prHourlyLimit, 5);
  assert.equal(config.automergeType, "pr");
  assert.equal(config.automergeStrategy, "squash");
  assert.equal(config.platformAutomerge, false);
  assert.equal(config.ignoreTests, false);
  assert.equal(config.rebaseWhen, "conflicted");
  assert.deepEqual(config.labels, ["dependencies 📦"]);
  assert.deepEqual(config.lockFileMaintenance.schedule, [
    "before 8am on Monday",
  ]);
});

test("runtime patches automerge only after the standard cooldown", async () => {
  const update = await resolvedUpdate("presets/base.json", {
    manager: "composer",
    depType: "require",
    packageName: "symfony/console",
    updateType: "patch",
  });

  assert.equal(update.automerge, true);
  assert.equal(update.minimumReleaseAge, "14 days");
  assert.equal(update.rebaseWhen, "behind-base-branch");
  assert.equal(update.semanticCommitType, "fix");
  assert.equal(update.semanticCommitScope, "deps");
});

test("runtime minors remain manual after a three-day cooldown", async () => {
  const update = await resolvedUpdate("presets/base.json", {
    manager: "npm",
    depType: "dependencies",
    packageName: "fastify",
    updateType: "minor",
  });

  assert.equal(update.automerge, false);
  assert.equal(update.minimumReleaseAge, "3 days");
});

test("development and Action minors group and automerge after 14 days", async () => {
  const development = await resolvedUpdate("presets/base.json", {
    manager: "npm",
    depType: "devDependencies",
    packageName: "eslint",
    updateType: "minor",
  });
  const action = await resolvedUpdate("presets/base.json", {
    manager: "github-actions",
    depType: "action",
    packageName: "actions/checkout",
    updateType: "minor",
  });

  assert.equal(development.automerge, true);
  assert.equal(development.minimumReleaseAge, "14 days");
  assert.equal(development.groupName, "JavaScript development dependencies");
  assert.equal(development.semanticCommitType, "chore");
  assert.equal(action.automerge, true);
  assert.equal(action.minimumReleaseAge, "14 days");
  assert.equal(action.groupName, "GitHub Actions");
  assert.equal(action.semanticCommitType, "ci");
});

test("majors require dashboard approval and never automerge", async () => {
  const update = await resolvedUpdate("presets/base.json", {
    manager: "dockerfile",
    depType: "final",
    packageName: "node",
    updateType: "major",
  });

  assert.equal(update.automerge, false);
  assert.equal(update.dependencyDashboardApproval, true);
  assert.ok(update.addLabels.includes("update: major ⚠️"));
});

test("trusted internal non-major updates skip cooldowns but xwp does not", async () => {
  const trusted = await resolvedUpdate("presets/base.json", {
    manager: "npm",
    depType: "dependencies",
    packageName: "@oblakstudio/example",
    sourceUrl: "https://github.com/oblakstudio/example",
    updateType: "minor",
  });
  const unrelated = await resolvedUpdate("presets/base.json", {
    manager: "npm",
    depType: "dependencies",
    packageName: "@xwp/example",
    sourceUrl: "https://github.com/xwp/example",
    updateType: "minor",
  });

  assert.equal(trusted.automerge, true);
  assert.equal(trusted.minimumReleaseAge, null);
  assert.equal(unrelated.automerge, false);
  assert.equal(unrelated.minimumReleaseAge, "3 days");
});

test("Renovate preset updates always require review", async () => {
  const update = await resolvedUpdate("presets/base.json", {
    manager: "renovate-config",
    depType: "preset",
    packageName: "oblakstudio/renovate-config",
    sourceUrl: "https://github.com/oblakstudio/renovate-config",
    updateType: "patch",
  });

  assert.equal(update.automerge, false);
  assert.equal(update.dependencyDashboardApproval, false);
});

test("vulnerability updates bypass schedules and remain manual", async () => {
  const config = await loadPreset("presets/base.json");

  assert.equal(config.osvVulnerabilityAlerts, true);
  assert.equal(config.vulnerabilityAlerts.enabled, true);
  assert.equal(config.vulnerabilityAlerts.automerge, false);
  assert.equal(config.vulnerabilityAlerts.minimumReleaseAge, null);
  assert.deepEqual(config.vulnerabilityAlerts.schedule, ["at any time"]);
  assert.ok(config.vulnerabilityAlerts.addLabels.includes("security 🔒"));
});

test("ecosystem presets preserve platform constraints and range intent", async () => {
  const phpApplication = await resolvedUpdate("presets/php-application.json", {
    manager: "composer",
    depType: "require",
    packageName: "symfony/console",
    updateType: "minor",
  });
  const phpLibrary = await resolvedUpdate("presets/php-library.json", {
    manager: "composer",
    depType: "require",
    packageName: "symfony/console",
    updateType: "minor",
  });
  const javascriptApplication = await resolvedUpdate(
    "presets/javascript-application.json",
    {
      manager: "npm",
      depType: "dependencies",
      packageName: "fastify",
      updateType: "minor",
    },
  );
  const javascriptPackage = await resolvedUpdate(
    "presets/javascript-package.json",
    {
      manager: "npm",
      depType: "peerDependencies",
      packageName: "react",
      updateType: "minor",
    },
  );

  assert.equal(phpApplication.rangeStrategy, "update-lockfile");
  assert.equal(phpLibrary.rangeStrategy, "widen");
  assert.equal(javascriptApplication.rangeStrategy, "update-lockfile");
  assert.equal(javascriptPackage.rangeStrategy, "widen");

  const phpPlatform = await resolvedUpdate("presets/php-library.json", {
    manager: "composer",
    depType: "require",
    packageName: "php",
    updateType: "minor",
  });
  assert.equal(phpPlatform.enabled, false);
});

test("parameter and credential overlays stay additive and secret-free", async () => {
  const constraint = await loadPreset("presets/php-constraint.json", {
    args: ["^8.2"],
  });
  const privatePackagist = await loadPreset("presets/private-packagist.json");
  const defaultConfig = await loadPreset("default.json");

  assert.deepEqual(constraint, { constraints: { php: "^8.2" } });
  assert.deepEqual(privatePackagist.hostRules, [
    {
      hostType: "packagist",
      matchHost: "repo.packagist.com",
      username: "token",
      password: "{{ secrets.PRIVATE_PACKAGIST_TOKEN }}",
    },
  ]);
  assert.equal(
    JSON.stringify(defaultConfig).includes("PRIVATE_PACKAGIST"),
    false,
  );
});

test("Actions and Docker pin immutable references", async () => {
  const config = await loadPreset("presets/base.json");

  assert.ok(config.extends.includes("helpers:pinGitHubActionDigests"));
  assert.ok(config.extends.includes("docker:pinDigests"));
});
