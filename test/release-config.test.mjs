import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("semantic-release creates immutable GitHub releases without npm publishing", async () => {
  const config = JSON.parse(await readFile(".releaserc.json", "utf8"));
  const pluginNames = config.plugins.map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );
  const gitPlugin = config.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "@semantic-release/git",
  );

  assert.deepEqual(config.branches, ["master"]);
  assert.equal(config.tagFormat, "v${version}");
  assert.ok(pluginNames.includes("@semantic-release/commit-analyzer"));
  assert.ok(pluginNames.includes("@semantic-release/release-notes-generator"));
  assert.ok(pluginNames.includes("@semantic-release/changelog"));
  assert.ok(pluginNames.includes("@semantic-release/github"));
  assert.equal(pluginNames.includes("@semantic-release/npm"), false);
  assert.deepEqual(gitPlugin[1].assets, ["CHANGELOG.md"]);
  assert.match(gitPlugin[1].message, /\[skip ci\]/);
});
