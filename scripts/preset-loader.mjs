import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import JSON5 from "json5";
import { mergeChildConfig } from "renovate/dist/config/utils.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function assertInsideRepository(target, root) {
  const relative = path.relative(root, target);

  if (relative.startsWith(`..${path.sep}`) || relative === "..") {
    throw new Error(`Preset resolves outside the repository: ${target}`);
  }
}

async function firstReadable(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(`Cannot resolve preset: ${candidates.join(" or ")}`);
}

async function resolvePreset(reference, fromFile, root) {
  const target = path.resolve(path.dirname(fromFile), reference);
  assertInsideRepository(target, root);

  const candidates = path.extname(target)
    ? [target]
    : [`${target}.json`, `${target}.json5`];
  const resolved = await firstReadable(candidates);
  assertInsideRepository(resolved, root);
  return resolved;
}

function substituteArguments(value, args) {
  if (typeof value === "string") {
    return value.replace(/\{\{arg(\d+)\}\}/g, (placeholder, index) =>
      args[index] === undefined ? placeholder : args[index],
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => substituteArguments(item, args));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        substituteArguments(item, args),
      ]),
    );
  }

  return value;
}

function mergePresetConfig(parent, child) {
  const parentExtensions = parent.extends ?? [];
  const childExtensions = child.extends ?? [];
  const merged = mergeChildConfig(parent, child);

  if (parentExtensions.length > 0 || childExtensions.length > 0) {
    merged.extends = [...new Set([...parentExtensions, ...childExtensions])];
  }

  return merged;
}

async function loadFile(file, root, args, stack) {
  const relativeName = path.relative(root, file);
  const cycleStart = stack.indexOf(file);

  if (cycleStart !== -1) {
    const cycle = [...stack.slice(cycleStart), file]
      .map((entry) => path.relative(root, entry))
      .join(" -> ");
    throw new Error(`Preset cycle detected: ${cycle}`);
  }

  const contents = await readFile(file, "utf8");
  const parsed = substituteArguments(JSON5.parse(contents), args);
  const extensions = Array.isArray(parsed.extends) ? parsed.extends : [];
  const localExtensions = extensions.filter((entry) => entry.startsWith("."));
  const externalExtensions = extensions.filter(
    (entry) => !entry.startsWith("."),
  );
  let resolvedConfig = {};

  for (const reference of localExtensions) {
    const parentFile = await resolvePreset(reference, file, root);
    const parentConfig = await loadFile(parentFile, root, args, [
      ...stack,
      file,
    ]);
    resolvedConfig = mergePresetConfig(resolvedConfig, parentConfig);
  }

  const ownConfig = { ...parsed };
  if (externalExtensions.length > 0) {
    ownConfig.extends = externalExtensions;
  } else {
    delete ownConfig.extends;
  }

  return mergePresetConfig(resolvedConfig, ownConfig);
}

export async function loadPreset(
  entry,
  { root = repositoryRoot, args = [] } = {},
) {
  const normalizedRoot = path.resolve(root);
  const target = path.resolve(normalizedRoot, entry);
  assertInsideRepository(target, normalizedRoot);
  const file = await firstReadable(
    path.extname(target) ? [target] : [`${target}.json`, `${target}.json5`],
  );

  return loadFile(file, normalizedRoot, args, []);
}
