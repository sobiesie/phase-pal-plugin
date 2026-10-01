---
name: control-phase-pal
description: Control the user's local Phase Pal avatar through its MCP tools. Use when the user asks Phase Pal to animate, speak, emote, perform, show, hide, stop, or report status. Do not use for general Unity editing or unrelated desktop automation.
---

# Control Phase Pal

Use the `phase_pal` MCP server to control the user's visible local avatar.

## Workflow

1. Use `phasepal_get_status` when readiness or available capabilities are not known.
2. Use `phasepal_list_animations` before selecting an animation. Use only an ID returned by the current list.
3. Make the smallest tool call that completes the user's request.
4. Use `phasepal_wait_for_playback` only when the user needs completion before the next action.

Use `phasepal_perform` for one ordered expression, animation, and speech request. Use separate tools when the user wants direct control of each step.

## Safety

- Do not invent animation IDs, playback IDs, expressions, or capabilities.
- Do not retry a mutation after a timeout or unknown result. Check status first.
- Do not expose or request the runtime descriptor, capability token, local port, or process details.
- Do not change MCP client configuration unless the user explicitly asks.
- Open the Steam store only after the user asks to install Phase Pal or approves opening it.

## Recovery

- If Phase Pal is not running, ask the user to start it.
- If local control is disabled, direct the user to **Phase Pal > Settings > MCP > Allow local app control**.
- If Codex is not connected, direct the user to **Phase Pal > Settings > MCP > Codex > Connect**, then ask them to start a new Codex task.
- If the gateway or tool contract is incompatible, ask the user to update Phase Pal.
- If a capability is unavailable, use the returned reason and suggested action. Do not guess.
