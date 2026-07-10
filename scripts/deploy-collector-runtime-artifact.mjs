#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  COLLECTOR_RUNTIME_SERVICES,
  COLLECTOR_RUNTIME_TIMERS,
  DEFAULT_COLLECTOR_RUNTIME_ROOT,
  sha256File,
  shellQuote,
} from "./collector-runtime-policy.mjs";

const options = parseArgs(process.argv.slice(2));

if (options.rollbackTo) {
  console.log(`Collector runtime rollback target: ${options.rollbackTo}`);
} else {
  if (!options.artifact) fail("--artifact=<path> is required unless --rollback-to is used.");
  if (!existsSync(options.artifact)) fail(`Artifact does not exist: ${options.artifact}`);
  options.releaseSha ||= readReleaseShaFromArtifact(options.artifact);
  if (!options.releaseSha) fail("Could not infer release SHA from artifact manifest. Pass --sha=<git-sha>.");
  console.log(`Collector runtime artifact: ${options.artifact}`);
  console.log(`Release SHA: ${options.releaseSha}`);
}

console.log(`Runtime root: ${options.remoteRoot}`);

if (options.dryRun || !options.apply) {
  console.log("Dry run: no artifact uploaded and no remote symlink changed.");
  if (!options.apply) console.log("Pass --apply to upload and change the remote runtime.");
  process.exit(0);
}

if (!options.host) {
  fail("Missing SSH target. Set PRICEAI_COLLECTOR_RUNTIME_SSH_TARGET or pass --host=<user@host>.");
}

if (options.rollbackTo) {
  const remoteScript = buildRemoteArtifactScript({
    remoteRoot: options.remoteRoot,
    rollbackTo: options.rollbackTo,
    manageSystemd: options.manageSystemd,
    timers: options.timers,
    services: options.services,
    remoteSudo: options.remoteSudo,
    keepReleases: options.keepReleases,
    installLaunchers: options.installLaunchers,
  });
  runChecked("ssh", [...buildSshArgs(options), options.host, "bash -s"], { input: remoteScript });
  process.exit(0);
}

const tempDir = await mkdtemp(path.join(tmpdir(), "priceai-collector-artifact-deploy-"));
try {
  const artifactSha256 = sha256File(options.artifact);
  const checksumPath = path.join(tempDir, `${path.basename(options.artifact)}.sha256`);
  await writeFile(checksumPath, `${artifactSha256}  ${path.basename(options.artifact)}\n`, "utf8");

  const remoteIncomingDir = `${options.remoteRoot}/.incoming`;
  const remoteArtifactPath = `${remoteIncomingDir}/${path.basename(options.artifact)}`;
  const remoteChecksumPath = `${remoteArtifactPath}.sha256`;

  runChecked("ssh", [...buildSshArgs(options), options.host, `mkdir -p ${shellQuote(remoteIncomingDir)}`]);
  runChecked("scp", [...buildScpArgs(options), options.artifact, `${options.host}:${remoteArtifactPath}`]);
  runChecked("scp", [...buildScpArgs(options), checksumPath, `${options.host}:${remoteChecksumPath}`]);

  const remoteScript = buildRemoteArtifactScript({
    remoteRoot: options.remoteRoot,
    remoteArtifactPath,
    remoteChecksumPath,
    releaseSha: options.releaseSha,
    manageSystemd: options.manageSystemd,
    timers: options.timers,
    services: options.services,
    remoteSudo: options.remoteSudo,
    keepReleases: options.keepReleases,
    installLaunchers: options.installLaunchers,
  });

  runChecked("ssh", [...buildSshArgs(options), options.host, "bash -s"], { input: remoteScript });
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function parseArgs(args) {
  const parsed = {
    artifact: "",
    releaseSha: "",
    rollbackTo: "",
    host: process.env.PRICEAI_COLLECTOR_RUNTIME_SSH_TARGET || "",
    remoteRoot: process.env.PRICEAI_COLLECTOR_RUNTIME_ROOT || DEFAULT_COLLECTOR_RUNTIME_ROOT,
    sshKey: process.env.PRICEAI_COLLECTOR_RUNTIME_SSH_KEY || "",
    sshOptions: [],
    remoteSudo: process.env.PRICEAI_COLLECTOR_RUNTIME_REMOTE_SUDO || "",
    apply: false,
    dryRun: false,
    manageSystemd: true,
    installLaunchers: false,
    timers: [...COLLECTOR_RUNTIME_TIMERS],
    services: [...COLLECTOR_RUNTIME_SERVICES],
    keepReleases: 5,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--no-systemd") parsed.manageSystemd = false;
    else if (arg === "--install-launchers") parsed.installLaunchers = true;
    else if (arg === "--artifact") parsed.artifact = readValue(args, ++index, arg);
    else if (arg.startsWith("--artifact=")) parsed.artifact = arg.slice("--artifact=".length);
    else if (arg === "--sha") parsed.releaseSha = readValue(args, ++index, arg);
    else if (arg.startsWith("--sha=")) parsed.releaseSha = arg.slice("--sha=".length);
    else if (arg === "--rollback-to") parsed.rollbackTo = readValue(args, ++index, arg);
    else if (arg.startsWith("--rollback-to=")) parsed.rollbackTo = arg.slice("--rollback-to=".length);
    else if (arg === "--host") parsed.host = readValue(args, ++index, arg);
    else if (arg.startsWith("--host=")) parsed.host = arg.slice("--host=".length);
    else if (arg === "--remote-root") parsed.remoteRoot = readValue(args, ++index, arg);
    else if (arg.startsWith("--remote-root=")) parsed.remoteRoot = arg.slice("--remote-root=".length);
    else if (arg === "--ssh-key") parsed.sshKey = readValue(args, ++index, arg);
    else if (arg.startsWith("--ssh-key=")) parsed.sshKey = arg.slice("--ssh-key=".length);
    else if (arg === "--ssh-option") parsed.sshOptions.push(readValue(args, ++index, arg));
    else if (arg.startsWith("--ssh-option=")) parsed.sshOptions.push(arg.slice("--ssh-option=".length));
    else if (arg === "--remote-sudo") parsed.remoteSudo = readValue(args, ++index, arg);
    else if (arg.startsWith("--remote-sudo=")) parsed.remoteSudo = arg.slice("--remote-sudo=".length);
    else if (arg === "--keep-releases") parsed.keepReleases = Number(readValue(args, ++index, arg));
    else if (arg.startsWith("--keep-releases=")) parsed.keepReleases = Number(arg.slice("--keep-releases=".length));
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(parsed.keepReleases) || parsed.keepReleases < 1) {
    fail("--keep-releases must be a positive integer.");
  }

  parsed.artifact = parsed.artifact ? path.resolve(parsed.artifact) : "";
  return parsed;
}

function readReleaseShaFromArtifact(artifactPath) {
  const candidates = [
    "./.collector-runtime/runtime-manifest.json",
    ".collector-runtime/runtime-manifest.json",
  ];

  for (const candidate of candidates) {
    const result = spawnSync("tar", ["-xOf", artifactPath, candidate], { encoding: "utf8" });
    if (result.status !== 0 || !result.stdout.trim()) continue;
    try {
      const manifest = JSON.parse(result.stdout);
      return manifest.gitSha || manifest.shortSha || "";
    } catch {
      return "";
    }
  }

  const match = path.basename(artifactPath).match(/([0-9a-f]{12,40})\.tgz$/i);
  return match?.[1] || "";
}

function buildRemoteArtifactScript({
  remoteRoot,
  remoteArtifactPath = "",
  remoteChecksumPath = "",
  releaseSha = "",
  rollbackTo = "",
  manageSystemd,
  timers,
  services,
  remoteSudo,
  keepReleases,
  installLaunchers,
}) {
  const timerValues = timers.map(shellQuote).join(" ");
  const serviceValues = services.map(shellQuote).join(" ");
  const sudo = remoteSudo ? `${remoteSudo} ` : "";

  return `set -euo pipefail
remote_root=${shellQuote(remoteRoot)}
archive_path=${shellQuote(remoteArtifactPath)}
checksum_path=${shellQuote(remoteChecksumPath)}
release_sha=${shellQuote(releaseSha)}
rollback_to=${shellQuote(rollbackTo)}
manage_systemd=${manageSystemd ? "1" : "0"}
install_launchers=${installLaunchers ? "1" : "0"}
keep_releases=${keepReleases}
timers=(${timerValues})
services=(${serviceValues})
lock_dir="$remote_root/.collector-runtime.lock"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
release_root="$remote_root/releases"
manifest_dir="$remote_root/manifests"
backup_root="$remote_root/backups/releases"

if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "Collector runtime artifact lock already exists: $lock_dir" >&2
  exit 1
fi
trap 'rm -rf "$lock_dir"' EXIT

mkdir -p "$release_root" "$manifest_dir" "$backup_root"

stop_units() {
  if [ "$manage_systemd" != "1" ]; then return 0; fi
  for unit in "\${timers[@]}"; do ${sudo}systemctl stop "$unit" 2>/dev/null || true; done
  for unit in "\${services[@]}"; do ${sudo}systemctl stop "$unit" 2>/dev/null || true; done
}

start_timers() {
  if [ "$manage_systemd" != "1" ]; then return 0; fi
  for unit in "\${timers[@]}"; do ${sudo}systemctl start "$unit" 2>/dev/null || true; done
}

switch_current() {
  next_release="$1"
  previous=""
  if [ -L "$remote_root/current" ] || [ -e "$remote_root/current" ]; then
    previous="$(readlink -f "$remote_root/current" || true)"
  fi
  ln -sfn "$next_release" "$remote_root/current.next"
  mv -Tf "$remote_root/current.next" "$remote_root/current"
  if [ -n "$previous" ] && [ "$previous" != "$next_release" ]; then
    ln -sfn "$previous" "$remote_root/previous"
  fi
  cp -a "$next_release/.collector-runtime/runtime-manifest.json" "$remote_root/runtime-manifest.json"
  cp -a "$next_release/.collector-runtime/runtime-manifest.json" "$manifest_dir/artifact-$timestamp.json"
}

install_launchers_if_requested() {
  if [ "$install_launchers" != "1" ]; then return 0; fi

  if [ ! -d "$1/node_modules" ]; then
    echo "Release is missing node_modules; rebuild without --no-node-modules before installing launchers." >&2
    exit 1
  fi

  launcher_dir="$1/ops/collector-runtime"
  if [ ! -d "$launcher_dir" ]; then
    echo "Launcher directory missing in release: $launcher_dir" >&2
    exit 1
  fi

  launcher_backup="$remote_root/backups/launchers/$timestamp"
  mkdir -p "$launcher_backup"
  for launcher in run-api-transit-public.sh run-dujiao.sh run-generic-html-canary.sh run-main.sh; do
    if [ -e "$remote_root/$launcher" ]; then
      cp -a "$remote_root/$launcher" "$launcher_backup/$launcher"
    fi
    cp -a "$launcher_dir/$launcher" "$remote_root/$launcher"
    chmod 0755 "$remote_root/$launcher"
  done
}

prune_releases() {
  current_real="$(readlink -f "$remote_root/current" 2>/dev/null || true)"
  previous_real="$(readlink -f "$remote_root/previous" 2>/dev/null || true)"
  index=0
  for dir in $(ls -dt "$release_root"/* 2>/dev/null || true); do
    [ "$dir" = "$current_real" ] && continue
    [ "$dir" = "$previous_real" ] && continue
    index=$((index + 1))
    if [ "$index" -gt "$keep_releases" ]; then
      rm -rf "$dir"
    fi
  done
}

if [ -n "$rollback_to" ]; then
  rollback_release="$release_root/$rollback_to"
  if [ ! -d "$rollback_release" ]; then
    echo "Rollback release not found: $rollback_release" >&2
    exit 1
  fi
  stop_units
  switch_current "$rollback_release"
  install_launchers_if_requested "$rollback_release"
  start_timers
  echo "Collector runtime rollback complete: $rollback_release"
  exit 0
fi

if [ -z "$release_sha" ]; then
  echo "release_sha is required" >&2
  exit 1
fi

(cd "$(dirname "$archive_path")" && sha256sum -c "$(basename "$checksum_path")")

tmp_release="$release_root/.$release_sha.tmp"
final_release="$release_root/$release_sha"
rm -rf "$tmp_release"
mkdir -p "$tmp_release"
tar -xzf "$archive_path" -C "$tmp_release"
test -f "$tmp_release/.collector-runtime/runtime-manifest.json"
(cd "$tmp_release" && sha256sum -c .collector-runtime/runtime.sha256)

stop_units
if [ -e "$final_release" ]; then
  mv "$final_release" "$backup_root/$release_sha-$timestamp"
fi
mv "$tmp_release" "$final_release"
switch_current "$final_release"
install_launchers_if_requested "$final_release"
start_timers
prune_releases
rm -f "$archive_path" "$checksum_path"
echo "Collector runtime artifact deploy complete: $final_release"
`;
}

function buildSshArgs(parsed) {
  const args = ["-o", "BatchMode=yes"];
  for (const option of parsed.sshOptions) args.push("-o", option);
  if (parsed.sshKey) args.push("-i", parsed.sshKey);
  return args;
}

function buildScpArgs(parsed) {
  const args = [];
  for (const option of parsed.sshOptions) args.push("-o", option);
  if (parsed.sshKey) args.push("-i", parsed.sshKey);
  return args;
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    input: options.input,
    stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
    encoding: "utf8",
  });

  if (result.status === 0) return;
  fail(`Command failed: ${command} ${args.join(" ")}`);
}

function readValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith("--")) fail(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/deploy-collector-runtime-artifact.mjs --artifact=dist/collector-runtime/priceai-collector-runtime-<sha>.tgz --host=<user@host>
  node scripts/deploy-collector-runtime-artifact.mjs --rollback-to=<sha> --host=<user@host>

Options:
  --artifact=<path>        Artifact built by build-collector-runtime-artifact.mjs
  --sha=<git-sha>          Release directory name; inferred from manifest when omitted
  --rollback-to=<sha>      Switch current symlink back to an existing release
  --host=<user@host>       SSH target, or PRICEAI_COLLECTOR_RUNTIME_SSH_TARGET
  --remote-root=<path>     Runtime root, default ${DEFAULT_COLLECTOR_RUNTIME_ROOT}
  --apply                  Upload/apply the release to the remote runtime
  --install-launchers      Install root run-*.sh launchers that execute current/
  --ssh-key=<path>         SSH private key path
  --ssh-option=<option>    Extra SSH/SCP option, repeatable
  --remote-sudo=<command>  Prefix systemctl calls, for example sudo
  --keep-releases=<n>      Number of old non-current releases to retain, default 5
  --no-systemd             Do not stop/start collector timers
  --dry-run                Validate local inputs without SSH or remote changes
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
