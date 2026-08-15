import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { init as initializeRenovateLogger } from "renovate/dist/logger/index.js";

import {
  presetArguments,
  publicPresets,
  repositoryConfigs,
} from "./preset-catalog.mjs";
import { loadPreset } from "./preset-loader.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const validatorPath = path.join(
  repositoryRoot,
  "node_modules/renovate/dist/config-validator.js",
);

await initializeRenovateLogger();

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => resolve({ exitCode, output }));
  });
}

export async function validateConfig(config, label) {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "renovate-config-validation-"),
  );
  const configPath = path.join(temporaryDirectory, "renovate.json");

  try {
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    return await run(
      process.execPath,
      [validatorPath, "--strict", "--no-global", configPath],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          LOG_LEVEL: "info",
        },
      },
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export async function validatePreset(preset) {
  const config = await loadPreset(preset, {
    args: presetArguments[preset] ?? [],
  });
  return validateConfig(config, preset);
}

async function main() {
  let failed = false;
  const validationTargets = [...publicPresets, ...repositoryConfigs];

  for (const preset of validationTargets) {
    const result = await validatePreset(preset);

    if (result.exitCode === 0) {
      process.stdout.write(`✓ ${preset}\n`);
      continue;
    }

    failed = true;
    process.stderr.write(`✗ ${preset}\n${result.output}\n`);
  }

  if (failed) {
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Validated ${publicPresets.length} public presets and ${repositoryConfigs.length} repository config with Renovate.\n`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
