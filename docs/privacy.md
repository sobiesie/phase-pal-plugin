# Phase Pal plugin privacy

Publisher: Consistency AI. Updated: 2026-09-30.

This page covers the Phase Pal plugin launcher, its control skill, and the
local MCP connection. The Phase Pal app and the agent application have their
own policies. See the [Phase Pal privacy policy](https://phasepal.com/privacy-policy)
and the policy for the agent and model provider you use.

## Information used for local control

The launcher checks known installation paths and Steam library configuration
files to find the installed Gateway. It checks for the local runtime
descriptor and starts the Gateway. The Gateway reads that descriptor to
authenticate its connection to the running Phase Pal app on your computer.
The descriptor can contain a local access token. Keep it private.

Control requests can contain speech text, expressions, animation identifiers,
playback identifiers, and window actions. Tool responses can contain avatar
status, character identifiers, available animation names, playback status,
and error messages. Your agent application receives these responses.

## The Gateway can expose more tools

The installed Phase Pal version determines the available MCP tools. Current
Gateway versions can also expose chat, screen capture, a guidance pointer,
current time, and Minecraft state. These tools can process chat text, screen
images, pointer coordinates, or game state when called and enabled. Review
your agent's tool list and permissions before use. The bundled control skill
focuses on avatar controls; it does not remove other Gateway tools.

## Local connection and external providers

The launcher has no analytics uploader and does not send installation paths
or descriptor contents to a publisher server. The agent talks to the Gateway
over STDIO. The Gateway uses a local connection to Phase Pal.

Local transport does not mean that all processing stays on your computer.
Your agent can send prompts and tool results to its model provider. Phase Pal
can use the configured speech or chat provider, including a remote provider,
when you ask it to speak or chat. Those providers apply their own retention
rules and policies. Use the app's provider settings to select local processing
where supported.

The launcher can open Steam only when you explicitly request `--open-store`.
Steam and GitHub apply their own policies when you use their services.

## Storage and removal

The plugin launcher does not create a conversation database. The host can
keep prompts, tool results, and diagnostic records. Phase Pal and its speech
or chat providers can keep records under their own settings and policies.
No separate retention period is promised for those systems by this plugin.

Disable **Allow local app control** to stop new local control requests.
Remove the plugin through your agent application to remove its installed
package. Removal does not delete Phase Pal data, model-provider records, or
the agent's conversation history. Use each product's data controls for that.

## Support information

Information you post in GitHub issues is public. Do not post private content,
tokens, descriptors, or complete logs. For questions about Phase Pal data or
privacy requests, use the [Phase Pal support page](https://phasepal.com/bug-report).

[Support](support.md) · [Terms](terms.md) · [Plugin home](../README.md)
