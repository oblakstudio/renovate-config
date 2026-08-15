import assert from "node:assert/strict";
import test from "node:test";

import { presetArguments, publicPresets } from "../scripts/preset-catalog.mjs";
import {
  validateConfig,
  validatePreset,
} from "../scripts/validate-presets.mjs";

test("the validation catalog includes current and compatibility entry points", () => {
  assert.ok(publicPresets.includes("default.json"));
  assert.ok(publicPresets.includes("presets/private-packagist.json"));
  assert.ok(publicPresets.includes("common/base.json5"));
  assert.ok(publicPresets.includes("php/php.json"));
  assert.deepEqual(presetArguments["presets/php-constraint.json"], ["^8.2"]);
});

test("strict validation accepts a materialized universal preset", async () => {
  const result = await validatePreset("default.json");

  assert.equal(result.exitCode, 0, result.output);
});

test("strict validation rejects removed top-level matching options", async () => {
  const result = await validateConfig(
    {
      managers: ["npm"],
      matchPackageNames: ["example"],
    },
    "invalid-legacy-fragment",
  );

  assert.notEqual(result.exitCode, 0);
});
