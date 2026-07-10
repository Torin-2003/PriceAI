#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  COLLECTOR_RUNTIME_DEPENDENCY_FILES,
  COLLECTOR_RUNTIME_LAUNCHER_FILES,
  COLLECTOR_RUNTIME_SOURCE_FILES,
  buildRuntimeManifest,
  checksumFileContent,
  currentGitSha,
  sha256File,
} from "./collector-runtime-policy.mjs";

const options = parseArgs(process.argv.slice(2));
const cwd = process.cwd();
const gitSha = currentGitSha(cwd, options.targetRef);
const runtimeFiles = [
  ...COLLECTOR_RUNTIME_SOURCE_FILES,
  ...COLLECTOR_RUNTIME_DEPENDENCY_FILES,
  ...COLLECTOR_RUNTIME_LAUNCHER_FILES,
];
const manifest = buildRuntimeManifest({
  cwd,
  mode: "artifact-release",
  gitSha,
  targetRef: options.targetRef,
  workflowRunUrl: options.workflowRunUrl,
  files: runtimeFiles,
  dependencyFiles: COLLECTOR_RUNTIME_DEPENDENCY_FILES,
  extra: {
    artifact: {
      includesNodeModules: options.includeNodeModules,
      releaseName: gitSha,
    },
  },
});

console.log(`Collector runtime artifact target: ${gitSha}`);
console.log(`Runtime files: ${manifest.files.length}`);
console.log(`Include node_modules: ${options.includeNodeModules ? "yes" : "no"}`);

if (options.includeNodeModules && !existsSync(path.join(cwd, "node_modules"))) {
  fail("node_modules is missing. Run npm ci in CI/local first; do not install dependencies on Huoshan2.");
}

if (options.dryRun) {
  console.log("Dry run: no release directory or archive created.");
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}

await mkdir(options.outDir, { recursive: true });
const tempDir = await mkdtemp(path.join(tmpdir(), "priceai-collector-artifact-"));

try {
  const releaseDir = path.join(tempDir, gitSha);
  const metadataDir = path.join(releaseDir, ".collector-runtime");
  await mkdir(metadataDir, { recursive: true });

  for (const file of runtimeFiles) {
    const source = path.join(cwd, file);
    const destination = path.join(releaseDir, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { preserveTimestamps: true });
  }

  if (options.includeNodeModules) {
    await cp(path.join(cwd, "node_modules"), path.join(releaseDir, "node_modules"), {
      recursive: true,
      preserveTimestamps: true,
      filter: (source) => !source.includes(`${path.sep}.cache${path.sep}`),
    });
  }

  await writeFile(path.join(releaseDir, "VERSION"), `${gitSha}\n`, "utf8");
  await writeFile(path.join(metadataDir, "runtime-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(metadataDir, "runtime.sha256"), checksumFileContent(manifest.files), "utf8");

  const archivePath = path.join(options.outDir, `priceai-collector-runtime-${gitSha}.tgz`);
  const checksumPath = `${archivePath}.sha256`;
  runChecked("tar", ["-czf", archivePath, "-C", releaseDir, "."]);

  const archiveSha256 = sha256File(archivePath);
  await writeFile(checksumPath, `${archiveSha256}  ${path.basename(archivePath)}\n`, "utf8");

  console.log(`Artifact: ${archivePath}`);
  console.log(`Checksum: ${checksumPath}`);
  console.log(`sha256: ${archiveSha256}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function parseArgs(args) {
  const parsed = {
    outDir: "dist/collector-runtime",
    targetRef: process.env.PRICEAI_COLLECTOR_RUNTIME_TARGET_REF || "HEAD",
    workflowRunUrl: workflowRunUrlFromEnv(),
    includeNodeModules: true,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--no-node-modules") parsed.includeNodeModules = false;
    else if (arg === "--out-dir") parsed.outDir = readValue(args, ++index, arg);
    else if (arg.startsWith("--out-dir=")) parsed.outDir = arg.slice("--out-dir=".length);
    else if (arg === "--target-ref") parsed.targetRef = readValue(args, ++index, arg) || "HEAD";
    else if (arg.startsWith("--target-ref=")) parsed.targetRef = arg.slice("--target-ref=".length) || "HEAD";
    else if (arg === "--workflow-run-url") parsed.workflowRunUrl = readValue(args, ++index, arg);
    else if (arg.startsWith("--workflow-run-url=")) parsed.workflowRunUrl = arg.slice("--workflow-run-url=".length);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  parsed.outDir = path.resolve(parsed.outDir);
  return parsed;
}

function runChecked(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", encoding: "utf8" });
  if (result.status === 0) return;
  fail(`Command failed: ${command} ${args.join(" ")}`);
}

function workflowRunUrlFromEnv() {
  if (!process.env.GITHUB_SERVER_URL || !process.env.GITHUB_REPOSITORY || !process.env.GITHUB_RUN_ID) return "";
  return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

function readValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/build-collector-runtime-artifact.mjs
  node scripts/build-collector-runtime-artifact.mjs --dry-run

Options:
  --out-dir=<path>        Output directory, default dist/collector-runtime
  --target-ref=<git-ref>  Git ref for manifest, default HEAD
  --no-node-modules       Build a source-only artifact for local validation
  --dry-run               Validate manifest without writing an artifact

The script never runs npm install. Run npm ci in CI/local before building a deployable artifact.
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
