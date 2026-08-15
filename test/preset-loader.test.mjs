import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { init as initializeRenovateLogger } from "renovate/dist/logger/index.js";

import { loadPreset } from "../scripts/preset-loader.mjs";

await initializeRenovateLogger();

async function createRepository(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "renovate-preset-loader-"));

  await Promise.all(
    Object.entries(files).map(async ([name, contents]) => {
      const target = path.join(root, name);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, contents);
    }),
  );

  return root;
}

test("resolves extensionless nested JSON and JSON5 presets", async () => {
  const root = await createRepository({
    "base.json": JSON.stringify({
      extends: ["./rules/core"],
      timezone: "Europe/Belgrade",
    }),
    "rules/core.json5": `{
      // Legacy JSON5 remains readable.
      extends: ["config:recommended"],
      prConcurrentLimit: 10,
    }`,
  });

  const config = await loadPreset("base.json", { root });

  assert.deepEqual(config.extends, ["config:recommended"]);
  assert.equal(config.prConcurrentLimit, 10);
  assert.equal(config.timezone, "Europe/Belgrade");
});

test("substitutes preset arguments throughout the resolved config", async () => {
  const root = await createRepository({
    "constraint.json": JSON.stringify({
      constraints: { php: "{{arg0}}" },
    }),
  });

  const config = await loadPreset("constraint.json", {
    root,
    args: ["^8.2"],
  });

  assert.deepEqual(config.constraints, { php: "^8.2" });
});

test("rejects relative presets that escape the repository", async () => {
  const parent = await mkdtemp(
    path.join(os.tmpdir(), "renovate-preset-escape-"),
  );
  const root = path.join(parent, "repository");
  await mkdir(root);
  await writeFile(path.join(parent, "outside.json"), "{}");
  await writeFile(
    path.join(root, "base.json"),
    JSON.stringify({ extends: ["../outside"] }),
  );

  await assert.rejects(
    loadPreset("base.json", { root }),
    /outside the repository/,
  );
});

test("rejects cycles with the complete preset chain", async () => {
  const root = await createRepository({
    "a.json": JSON.stringify({ extends: ["./b"] }),
    "b.json": JSON.stringify({ extends: ["./a"] }),
  });

  await assert.rejects(
    loadPreset("a.json", { root }),
    /a\.json -> b\.json -> a\.json/,
  );
});
