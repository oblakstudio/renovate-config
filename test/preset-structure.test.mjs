import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import JSON5 from "json5";
import { init as initializeRenovateLogger } from "renovate/dist/logger/index.js";
import { applyPackageRules } from "renovate/dist/util/package-rules/index.js";

import { loadPreset } from "../scripts/preset-loader.mjs";

const currentPresets = [
  "default.json",
  "presets/base.json",
  "presets/php-application.json",
  "presets/php-library.json",
  "presets/php-constraint.json",
  "presets/javascript-application.json",
  "presets/javascript-package.json",
  "presets/wordpress-plugin.json",
  "presets/private-packagist.json",
  "rules/core.json",
  "rules/security.json",
  "rules/automerge.json",
  "rules/composer.json",
  "rules/javascript.json",
  "rules/github-actions.json",
  "rules/docker.json",
];

const legacyPresets = [
  "common/base.json",
  "common/base.json5",
  "npm.json",
  "wp-plugin.json",
  "typescript/base.json5",
  "php/php.json",
  "composer/bump.json",
  "composer/do-not-update-php.json",
  "composer/in-range.json",
  "composer/phpstan.json",
  "github/github-actions.json",
];

await initializeRenovateLogger();

test("every current and legacy public preset parses and resolves", async () => {
  for (const preset of [...currentPresets, ...legacyPresets]) {
    const contents = await readFile(preset, "utf8");
    assert.doesNotThrow(() => JSON5.parse(contents), preset);
    await assert.doesNotReject(loadPreset(preset, { args: ["^8.2"] }), preset);
  }
});

test("new entry points and rules use strict JSON", async () => {
  for (const preset of currentPresets) {
    const contents = await readFile(preset, "utf8");
    assert.doesNotThrow(() => JSON.parse(contents), preset);
  }
});

test("the reported missing JSON5 path resolves to universal policy", async () => {
  const config = await loadPreset("common/base.json5");

  assert.equal(config.timezone, "Europe/Belgrade");
  assert.equal(config.ignoreTests, false);
  assert.ok(config.extends.includes("config:recommended"));
});

test("legacy ecosystem aliases resolve to their replacements", async () => {
  const npm = await applyPackageRules(
    {
      ...(await loadPreset("npm.json")),
      manager: "npm",
      depType: "dependencies",
      packageName: "fastify",
      updateType: "minor",
    },
    "branch",
  );
  const php = await applyPackageRules(
    {
      ...(await loadPreset("php/php.json")),
      manager: "composer",
      depType: "require",
      packageName: "symfony/console",
      updateType: "minor",
    },
    "branch",
  );
  const wordpress = await loadPreset("wp-plugin.json");
  const actions = await loadPreset("github/github-actions.json");

  assert.equal(npm.rangeStrategy, "update-lockfile");
  assert.equal(php.rangeStrategy, "widen");
  assert.ok(
    wordpress.packageRules.some((rule) => rule.rangeStrategy === "widen"),
  );
  assert.ok(actions.extends.includes("helpers:pinGitHubActionDigests"));
});

test("legacy Composer presets retain their scoped behavior", async () => {
  const bump = await applyPackageRules(
    {
      ...(await loadPreset("composer/bump.json")),
      manager: "composer",
      packageName: "symfony/console",
    },
    "branch",
  );
  const php = await applyPackageRules(
    {
      ...(await loadPreset("composer/do-not-update-php.json")),
      manager: "composer",
      packageName: "php",
    },
    "branch",
  );
  const inRange = await applyPackageRules(
    {
      ...(await loadPreset("composer/in-range.json")),
      manager: "composer",
      packageName: "symfony/console",
    },
    "branch",
  );
  const phpstan = await applyPackageRules(
    {
      ...(await loadPreset("composer/phpstan.json")),
      manager: "composer",
      datasource: "packagist",
      packageName: "phpstan/phpstan-strict-rules",
    },
    "branch",
  );

  assert.equal(bump.rangeStrategy, "bump");
  assert.equal(bump.prPriority, 13);
  assert.equal(php.enabled, false);
  assert.equal(inRange.rangeStrategy, "in-range-only");
  assert.equal(inRange.prPriority, -666);
  assert.equal(phpstan.groupName, "PHPStan");
});
