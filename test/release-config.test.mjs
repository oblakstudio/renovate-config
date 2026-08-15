import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("semantic-release publishes signed commits without repository mutations", async () => {
  const config = JSON.parse(await readFile(".releaserc.json", "utf8"));
  const pluginNames = config.plugins.map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );

  assert.deepEqual(config.branches, ["master"]);
  assert.equal(config.tagFormat, "v${version}");
  assert.ok(pluginNames.includes("@semantic-release/commit-analyzer"));
  assert.ok(pluginNames.includes("@semantic-release/release-notes-generator"));
  assert.ok(pluginNames.includes("@semantic-release/github"));
  assert.equal(pluginNames.includes("@semantic-release/changelog"), false);
  assert.equal(pluginNames.includes("@semantic-release/git"), false);
  assert.equal(pluginNames.includes("@semantic-release/npm"), false);
});
