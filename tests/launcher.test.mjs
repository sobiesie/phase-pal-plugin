import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildDescriptorCandidates,
  buildGatewayArguments,
  buildGatewayCandidates,
  findFirstFile,
} from "../scripts/launch-phase-pal-mcp.mjs";

test("macOS candidates include the packaged Steam gateway", () => {
  const home = "/Users/tester";
  const candidates = buildGatewayCandidates({
    platform: "darwin",
    environment: {},
    userHome: home,
  });

  assert.ok(
    candidates.includes(
      join(
        home,
        "Library",
        "Application Support",
        "Steam",
        "steamapps",
        "common",
        "Phase Pal",
        "Phase Pal.app",
        "Contents",
        "PhaseGateway",
        "macOS",
        "phase-gateway",
      ),
    ),
  );
});

test("Windows candidates include the packaged gateway", () => {
  const candidates = buildGatewayCandidates({
    platform: "win32",
    environment: {
      "ProgramFiles(x86)": "D:\\Programs",
      LOCALAPPDATA: "D:\\UserData",
    },
    userHome: "D:\\Users\\tester",
  });

  assert.ok(
    candidates.includes(
      join(
        "D:\\Programs",
        "Steam",
        "steamapps",
        "common",
        "Phase Pal",
        "PhaseGateway",
        "phase-gateway.exe",
      ),
    ),
  );
});

test("Linux descriptor follows Unity's persistent data path", () => {
  const candidates = buildDescriptorCandidates({
    platform: "linux",
    environment: { XDG_CONFIG_HOME: "/state" },
    userHome: "/home/tester",
  });

  assert.deepEqual(candidates, [
    join(
      "/state",
      "unity3d",
      "ConsistencyAI",
      "Phase Pal",
      "PhasePalMcp",
      "runtime.json",
    ),
  ]);
});

test("environment overrides are exact", () => {
  assert.deepEqual(
    buildGatewayCandidates({
      platform: "linux",
      environment: { PHASEPAL_GATEWAY_PATH: "/custom/gateway" },
      userHome: "/home/tester",
    }),
    ["/custom/gateway"],
  );
  assert.deepEqual(
    buildDescriptorCandidates({
      platform: "linux",
      environment: { PHASEPAL_MCP_DESCRIPTOR: "/custom/runtime.json" },
      userHome: "/home/tester",
    }),
    ["/custom/runtime.json"],
  );
});

test("gateway arguments use the Phase Pal MCP mode and descriptor", () => {
  assert.deepEqual(buildGatewayArguments("/state/runtime.json"), [
    "phasepal-mcp-stdio",
    "--descriptor",
    "/state/runtime.json",
  ]);
});

test("Steam library folders are included", () => {
  const root = mkdtempSync(join(tmpdir(), "phase-pal-launcher-"));
  try {
    const steamRoot = join(root, ".local", "share", "Steam");
    const secondLibrary = join(root, "second-library");
    mkdirSync(join(steamRoot, "steamapps"), { recursive: true });
    writeFileSync(
      join(steamRoot, "steamapps", "libraryfolders.vdf"),
      `"libraryfolders"\n{\n  "1"\n  {\n    "path" "${secondLibrary}"\n  }\n}\n`,
    );

    const candidates = buildGatewayCandidates({
      platform: "linux",
      environment: {},
      userHome: root,
    });

    assert.ok(
      candidates.includes(
        join(
          secondLibrary,
          "steamapps",
          "common",
          "Phase Pal",
          "PhaseGateway",
          "Linux",
          "phase-gateway",
        ),
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("findFirstFile returns the first existing candidate", () => {
  const root = mkdtempSync(join(tmpdir(), "phase-pal-launcher-"));
  try {
    const first = join(root, "missing");
    const second = join(root, "gateway");
    writeFileSync(second, "fixture");
    assert.equal(findFirstFile([first, second]), second);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
