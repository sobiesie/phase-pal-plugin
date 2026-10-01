#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, normalize } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const STEAM_APP_ID = "3655450";
const STEAM_STORE_URL =
  "https://store.steampowered.com/app/3655450/Phase_Pal/";
const STEAM_STORE_URI = `steam://store/${STEAM_APP_ID}`;

function envValue(environment, name) {
  const matchingKey = Object.keys(environment).find(
    (key) => key.toUpperCase() === name.toUpperCase(),
  );
  return matchingKey ? environment[matchingKey] : undefined;
}

function uniquePaths(paths) {
  const seen = new Set();
  return paths.filter((candidate) => {
    if (!candidate) {
      return false;
    }

    const key = normalize(candidate);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function readSteamLibraryRoots(steamRoots) {
  const roots = [...steamRoots];
  for (const steamRoot of steamRoots) {
    const libraryFile = join(steamRoot, "steamapps", "libraryfolders.vdf");
    if (!existsSync(libraryFile)) {
      continue;
    }

    try {
      const content = readFileSync(libraryFile, "utf8");
      const pathPattern = /"path"\s+"((?:\\.|[^"])*)"/g;
      for (const match of content.matchAll(pathPattern)) {
        roots.push(match[1].replace(/\\\\/g, "\\"));
      }
    } catch {
      // A broken optional Steam library file must not block known locations.
    }
  }

  return uniquePaths(roots);
}

export function buildDescriptorCandidates({
  platform = process.platform,
  environment = process.env,
  userHome = homedir(),
} = {}) {
  const override = envValue(environment, "PHASEPAL_MCP_DESCRIPTOR");
  if (override) {
    return [override];
  }

  if (platform === "darwin") {
    return [
      join(
        userHome,
        "Library",
        "Application Support",
        "ConsistencyAI",
        "Phase Pal",
        "PhasePalMcp",
        "runtime.json",
      ),
    ];
  }

  if (platform === "win32") {
    const localAppData =
      envValue(environment, "LOCALAPPDATA") ||
      join(userHome, "AppData", "Local");
    return [
      join(
        dirname(localAppData),
        "LocalLow",
        "ConsistencyAI",
        "Phase Pal",
        "PhasePalMcp",
        "runtime.json",
      ),
      join(
        userHome,
        "AppData",
        "LocalLow",
        "ConsistencyAI",
        "Phase Pal",
        "PhasePalMcp",
        "runtime.json",
      ),
    ];
  }

  const xdgConfigHome =
    envValue(environment, "XDG_CONFIG_HOME") || join(userHome, ".config");
  return [
    join(
      xdgConfigHome,
      "unity3d",
      "ConsistencyAI",
      "Phase Pal",
      "PhasePalMcp",
      "runtime.json",
    ),
  ];
}

export function buildGatewayCandidates({
  platform = process.platform,
  environment = process.env,
  userHome = homedir(),
} = {}) {
  const override = envValue(environment, "PHASEPAL_GATEWAY_PATH");
  if (override) {
    return [override];
  }

  let steamRoots;
  let relativeGatewayPath;
  let directCandidates = [];

  if (platform === "darwin") {
    steamRoots = [
      join(userHome, "Library", "Application Support", "Steam"),
    ];
    relativeGatewayPath = join(
      "steamapps",
      "common",
      "Phase Pal",
      "Phase Pal.app",
      "Contents",
      "PhaseGateway",
      "macOS",
      "phase-gateway",
    );
    directCandidates = [
      join(
        "/Applications",
        "Phase Pal.app",
        "Contents",
        "PhaseGateway",
        "macOS",
        "phase-gateway",
      ),
      join(
        userHome,
        "Applications",
        "Phase Pal.app",
        "Contents",
        "PhaseGateway",
        "macOS",
        "phase-gateway",
      ),
    ];
  } else if (platform === "win32") {
    const programFilesX86 =
      envValue(environment, "PROGRAMFILES(X86)") ||
      "C:\\Program Files (x86)";
    const programFiles =
      envValue(environment, "PROGRAMFILES") || "C:\\Program Files";
    const localAppData = envValue(environment, "LOCALAPPDATA");
    steamRoots = [
      join(programFilesX86, "Steam"),
      join(programFiles, "Steam"),
    ];
    relativeGatewayPath = join(
      "steamapps",
      "common",
      "Phase Pal",
      "PhaseGateway",
      "phase-gateway.exe",
    );
    directCandidates = localAppData
      ? [
          join(
            localAppData,
            "Programs",
            "Phase Pal",
            "PhaseGateway",
            "phase-gateway.exe",
          ),
        ]
      : [];
  } else {
    steamRoots = [
      envValue(environment, "STEAM_COMPAT_CLIENT_INSTALL_PATH"),
      join(userHome, ".local", "share", "Steam"),
      join(userHome, ".steam", "steam"),
      join(
        userHome,
        ".var",
        "app",
        "com.valvesoftware.Steam",
        ".local",
        "share",
        "Steam",
      ),
    ];
    relativeGatewayPath = join(
      "steamapps",
      "common",
      "Phase Pal",
      "PhaseGateway",
      "Linux",
      "phase-gateway",
    );
    directCandidates = [
      join(
        userHome,
        ".local",
        "share",
        "phase-pal",
        "PhaseGateway",
        "Linux",
        "phase-gateway",
      ),
      join(
        "/opt",
        "phase-pal",
        "PhaseGateway",
        "Linux",
        "phase-gateway",
      ),
    ];
  }

  const libraryCandidates = readSteamLibraryRoots(
    uniquePaths(steamRoots),
  ).map((root) => join(root, relativeGatewayPath));
  return uniquePaths([...directCandidates, ...libraryCandidates]);
}

export function findFirstFile(candidates) {
  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
}

export function buildGatewayArguments(descriptorPath) {
  return ["phasepal-mcp-stdio", "--descriptor", descriptorPath];
}

function writeHelp() {
  process.stderr.write(
    [
      "Phase Pal MCP launcher",
      "",
      "Default: find Phase Pal and start its local MCP gateway.",
      "--check: report whether the gateway and descriptor are ready.",
      "--open-store: open the Phase Pal Steam store page.",
      "",
      "Overrides:",
      "PHASEPAL_GATEWAY_PATH",
      "PHASEPAL_MCP_DESCRIPTOR",
      "",
    ].join("\n"),
  );
}

function openSteamStore(platform = process.platform) {
  let command;
  let args;

  if (platform === "darwin") {
    command = "open";
    args = [STEAM_STORE_URI];
  } else if (platform === "win32") {
    command = "cmd.exe";
    args = ["/d", "/s", "/c", "start", "", STEAM_STORE_URI];
  } else {
    command = "xdg-open";
    args = [STEAM_STORE_URI];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });
  child.on("error", () => {
    process.stderr.write(`Open this page: ${STEAM_STORE_URL}\n`);
    process.exitCode = 1;
  });
  child.unref();
}

function checkInstallation() {
  const gatewayPath = findFirstFile(buildGatewayCandidates());
  const descriptorPath = findFirstFile(buildDescriptorCandidates());
  const ready = Boolean(gatewayPath && descriptorPath);
  process.stdout.write(
    `${JSON.stringify({
      ready,
      gateway: gatewayPath ? "found" : "missing",
      descriptor: descriptorPath ? "found" : "missing",
    })}\n`,
  );
  process.exitCode = ready ? 0 : 1;
}

function startMcpGateway() {
  const gatewayPath = findFirstFile(buildGatewayCandidates());
  if (!gatewayPath) {
    process.stderr.write(
      `Phase Pal is not installed. Install it from ${STEAM_STORE_URL}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const descriptorPath = findFirstFile(buildDescriptorCandidates());
  if (!descriptorPath) {
    process.stderr.write(
      "Phase Pal local control is not ready. Start Phase Pal, then enable Settings > MCP > Allow local app control.\n",
    );
    process.exitCode = 1;
    return;
  }

  const child = spawn(
    gatewayPath,
    buildGatewayArguments(descriptorPath),
    { stdio: "inherit", windowsHide: true },
  );

  child.on("error", () => {
    process.stderr.write(
      "Phase Pal MCP could not start. Check the Phase Pal installation and try again.\n",
    );
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  }
}

function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    writeHelp();
    return;
  }
  if (args.includes("--open-store")) {
    openSteamStore();
    return;
  }
  if (args.includes("--check")) {
    checkInstallation();
    return;
  }
  if (args.length > 0) {
    process.stderr.write(`Unknown option: ${args[0]}\n`);
    process.exitCode = 2;
    return;
  }

  startMcpGateway();
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;
if (invokedDirectly) {
  main();
}
