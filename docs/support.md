# Phase Pal plugin support

Publisher: Consistency AI. Updated: 2026-09-30.

For plugin installation or launcher problems, open an issue in the
[public plugin repository](https://github.com/sobiesie/phase-pal-plugin/issues).
For Phase Pal application or account problems, use the
[Phase Pal support page](https://phasepal.com/bug-report).

## First checks

1. Start Phase Pal on the same computer as Codex.
2. Turn on **Settings > MCP > Allow local app control**.
3. Confirm that Node.js 18 or later is available to Codex.
4. Restart Codex and start a new task after plugin installation or an update.
5. Ask Codex to check Phase Pal status.

From the plugin folder, check installation discovery with:

```sh
node scripts/launch-phase-pal-mcp.mjs --check
```

The command reports whether the Gateway and runtime descriptor were found.
It does not prove that the app is responding or that each control is enabled.

If you use a custom install path, set `PHASEPAL_GATEWAY_PATH` in the MCP
process environment. Use `PHASEPAL_MCP_DESCRIPTOR` only when you know the
correct descriptor location. Do not post either file or its secret token.

## What to include in a report

Include your operating system, plugin version, Phase Pal version, agent
application version, the action that failed, and the safe error message.
Remove personal paths, account data, chat content, and tokens from reports.
GitHub issues are public. Do not attach the runtime descriptor or full logs.

To stop local control, turn off **Allow local app control** in Phase Pal.
You can also disable or remove the plugin in Codex.

[Privacy](privacy.md) · [Terms](terms.md) · [Plugin home](../README.md)
