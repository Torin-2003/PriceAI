#!/usr/bin/env node

import {
  evaluateCollectorRuntimeGuard,
  formatCollectorRuntimeGuardReport,
} from "./collector-runtime-policy.mjs";

const options = parseArgs(process.argv.slice(2));
const result = evaluateCollectorRuntimeGuard({
  baseRef: options.baseRef,
  targetRef: options.targetRef,
  includeWorkingTree: options.includeWorkingTree,
  fetchRef: options.fetchRef,
});

if (options.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(
    formatCollectorRuntimeGuardReport(result, {
      syncRef: options.syncRef,
      overrideReason: options.overrideReason,
      dryRun: options.dryRun,
    }),
  );
}

if (!result.changedFiles.length || options.dryRun || options.syncRef || options.overrideReason) {
  process.exit(0);
}

console.error(
  [
    "",
    "Collector runtime watched files changed.",
    "Provide --collector-runtime-sync-ref=<workflow-url-or-manifest-sha> after syncing Huoshan2,",
    "or --allow-collector-runtime-drift=<explicit-reason> for an intentional exception.",
  ].join("\n"),
);
process.exit(1);

function parseArgs(args) {
  const parsed = {
    baseRef: process.env.PRICEAI_COLLECTOR_RUNTIME_BASE_REF || "",
    targetRef: process.env.PRICEAI_COLLECTOR_RUNTIME_TARGET_REF || "HEAD",
    fetchRef: "",
    syncRef: process.env.PRICEAI_COLLECTOR_RUNTIME_SYNC_REF || "",
    overrideReason: process.env.PRICEAI_ALLOW_COLLECTOR_RUNTIME_DRIFT_REASON || "",
    includeWorkingTree: false,
    dryRun: false,
    json: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--include-working-tree") parsed.includeWorkingTree = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--base-ref") parsed.baseRef = readValue(args, ++index, arg);
    else if (arg.startsWith("--base-ref=")) parsed.baseRef = arg.slice("--base-ref=".length);
    else if (arg === "--target-ref") parsed.targetRef = readValue(args, ++index, arg) || "HEAD";
    else if (arg.startsWith("--target-ref=")) parsed.targetRef = arg.slice("--target-ref=".length) || "HEAD";
    else if (arg === "--fetch-ref") parsed.fetchRef = readValue(args, ++index, arg);
    else if (arg.startsWith("--fetch-ref=")) parsed.fetchRef = arg.slice("--fetch-ref=".length);
    else if (arg === "--collector-runtime-sync-ref") {
      parsed.syncRef = readValue(args, ++index, arg);
    }
    else if (arg.startsWith("--collector-runtime-sync-ref=")) {
      parsed.syncRef = arg.slice("--collector-runtime-sync-ref=".length);
    } else if (arg === "--allow-collector-runtime-drift") {
      parsed.overrideReason = readValue(args, ++index, arg);
      if (!parsed.overrideReason.trim()) fail("--allow-collector-runtime-drift requires a non-empty reason.");
    } else if (arg.startsWith("--allow-collector-runtime-drift=")) {
      parsed.overrideReason = arg.slice("--allow-collector-runtime-drift=".length);
      if (!parsed.overrideReason.trim()) fail("--allow-collector-runtime-drift requires a non-empty reason.");
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function readValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/check-collector-runtime-guard.mjs --base-ref=origin/main~1 --target-ref=HEAD

Options:
  --base-ref=<git-ref>                      Ref to compare from, default inferred from target
  --target-ref=<git-ref>                    Ref to inspect, default HEAD
  --fetch-ref=<git-ref>                     Optional remote ref to fetch if target object is missing
  --include-working-tree                    Include tracked local modifications in the check
  --collector-runtime-sync-ref=<ref>        Workflow URL, manifest SHA, or release SHA proving runtime sync
  --allow-collector-runtime-drift=<reason>  Explicit reason to deploy without runtime sync
  --dry-run                                 Report only; never fail
  --json                                    Print machine-readable result
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
