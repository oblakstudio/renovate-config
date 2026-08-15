import { spawn } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { init as initializeRenovateLogger } from "renovate/dist/logger/index.js";

import { loadPreset } from "./preset-loader.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const renovatePath = path.join(
  repositoryRoot,
  "node_modules/renovate/dist/renovate.js",
);

export const fixtureCases = [
  {
    name: "composer-application",
    preset: "presets/php-application.json",
    managers: ["composer"],
  },
  {
    name: "javascript-application",
    preset: "presets/javascript-application.json",
    managers: ["npm"],
  },
  {
    name: "wordpress-plugin",
    preset: "presets/wordpress-plugin.json",
    managers: ["composer", "npm"],
  },
  {
    name: "github-actions",
    preset: "presets/base.json",
    managers: ["github-actions"],
  },
  {
    name: "docker",
    preset: "presets/base.json",
    managers: ["dockerfile", "docker-compose"],
  },
];

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

function extractedManagers(log) {
  const managers = new Set();

  for (const line of log.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    try {
      const record = JSON.parse(line);
      if (record.msg === "Dependency extraction complete") {
        for (const manager of Object.keys(record.stats?.managers ?? {})) {
          managers.add(manager);
        }
      }
    } catch {
      // Renovate's log file is JSONL, but a partial final line is non-fatal.
    }
  }

  return [...managers];
}

export async function runFixture(name) {
  const fixture = fixtureCases.find((candidate) => candidate.name === name);
  if (!fixture) {
    throw new Error(`Unknown Renovate fixture: ${name}`);
  }

  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), `renovate-${name}-`),
  );
  const logPath = path.join(
    os.tmpdir(),
    `renovate-fixture-${name}-${process.pid}-${Date.now()}.log`,
  );

  try {
    await cp(path.join(repositoryRoot, "fixtures", name), temporaryDirectory, {
      recursive: true,
    });
    const config = await loadPreset(fixture.preset);
    await writeFile(
      path.join(temporaryDirectory, "renovate.json"),
      `${JSON.stringify(config, null, 2)}\n`,
    );

    const result = await run(
      process.execPath,
      [
        renovatePath,
        "--platform=local",
        "--dry-run=extract",
        "--require-config=required",
        "--onboarding=false",
        "--repository-cache=disabled",
      ],
      {
        cwd: temporaryDirectory,
        env: {
          ...process.env,
          LOG_FILE: logPath,
          LOG_FILE_LEVEL: "debug",
          LOG_LEVEL: "error",
        },
      },
    );
    const log = await readFile(logPath, "utf8").catch(() => "");

    return {
      ...result,
      output: `${result.output}${log}`,
      managers: extractedManagers(log),
    };
  } finally {
    await rm(logPath, { force: true });
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function main() {
  let failed = false;

  for (const fixture of fixtureCases) {
    const result = await runFixture(fixture.name);
    const missingManagers = fixture.managers.filter(
      (manager) => !result.managers.includes(manager),
    );

    if (result.exitCode === 0 && missingManagers.length === 0) {
      process.stdout.write(
        `✓ ${fixture.name}: ${result.managers.join(", ")}\n`,
      );
      continue;
    }

    failed = true;
    process.stderr.write(
      `✗ ${fixture.name}: missing ${missingManagers.join(", ")}\n${result.output}\n`,
    );
  }

  if (failed) {
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Extracted all expected managers from ${fixtureCases.length} fixtures.\n`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
