import assert from "node:assert/strict";
import test from "node:test";

import { runFixture } from "../scripts/test-fixtures.mjs";

test("the fixture runner reports managers extracted by Renovate", async () => {
  const result = await runFixture("github-actions");

  assert.equal(result.exitCode, 0, result.output);
  assert.ok(result.managers.includes("github-actions"), result.output);
});

test("the repository CI workflow is extractable by Renovate", async () => {
  const result = await runFixture("repository-ci");

  assert.equal(result.exitCode, 0, result.output);
  assert.ok(result.managers.includes("github-actions"), result.output);
});
