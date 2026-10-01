# Phase Pal plugin

Connect Codex to the Phase Pal app on your computer. Ask it to check avatar
status, list animations, play or stop an animation, set an expression, speak
text, or show and hide the avatar.

![Phase Pal plugin logo](assets/logo.png)

## Requirements

- Phase Pal is installed and running.
- **Phase Pal > Settings > MCP > Allow local app control** is on.
- Node.js 18 or later is available to your agent application.
- Your agent runs on the same computer and supports local STDIO MCP.

Get Phase Pal from its [Steam page](https://store.steampowered.com/app/3655450/Phase_Pal/).
This plugin contains a launcher and a control skill. Phase Pal supplies the
Gateway and its tools. The plugin does not include the desktop app or avatars.

## Install from GitHub in Codex

```sh
codex plugin marketplace add sobiesie/phase-pal-plugin --ref main
codex plugin add phase-pal@phase-pal
```

Restart Codex and start a new task. In the desktop app, you can also select
the **Phase Pal** marketplace in the Plugins directory and install the plugin.
Use a Codex version that has the `plugin` command.

Try: “List the animations my Phase Pal can play.”

To refresh the GitHub marketplace:

```sh
codex plugin marketplace upgrade phase-pal
```

Then install the updated plugin from the refreshed marketplace and start a
new session. The marketplace remains the distribution path for local control.

## Local development

From this plugin folder:

```sh
codex plugin marketplace add .
codex plugin add phase-pal@phase-pal
node scripts/launch-phase-pal-mcp.mjs --check
```

In the Unity source repository, its existing repo marketplace still provides
`phase-pal@personal` from `./plugins/phase-pal`.

The launcher finds standard Steam installs and additional Steam library
folders on macOS, Windows, and Linux. For another install location, set
`PHASEPAL_GATEWAY_PATH` or `PHASEPAL_MCP_DESCRIPTOR` in the environment supplied
to the MCP process. Hosts differ in which environment variables they pass.
Keep runtime descriptors and their tokens private.

The launcher opens the Steam store only with this explicit command:

```sh
node scripts/launch-phase-pal-mcp.mjs --open-store
```

## Package format

`plugin.json` and `mcp.json` use Agent Plugins 1.0.0. OpenAI presentation data
is under `extensions.com.openai`. The `.codex-plugin/plugin.json` and
`.mcp.json` files support older Codex loaders. The build checks that both
formats describe the same plugin and launcher.

Portable packaging does not prove that every agent can install this plugin.
Other hosts must support the package format and local MCP. The Phase Pal CLI
remains a separate terminal interface to the installed app.

## Build and check

Python 3.9 or later and Node.js 18 or later are sufficient. No package install
or Unity process is required. From this plugin folder:

```sh
node --test tests/launcher.test.mjs
python3 -m unittest discover -s tests -p 'package_test.py'
python3 scripts/build-plugin.py
```

The script writes `dist/phase-pal-0.2.1.zip` and its SHA-256 file. ZIP entries
have fixed timestamps, order, and permissions. Equal source bytes produce an
equal ZIP on supported platforms. The package contains only approved files.

In the Unity source repository, run
`python3 plugins/phase-pal/scripts/build-plugin.py --output-dir BuildArtifacts/Plugins/phase-pal`.

See [distribution](docs/distribution.md) for export and release instructions.

## Support and policies

- [Support](docs/support.md)
- [Privacy](docs/privacy.md)
- [Terms](docs/terms.md)
- [Asset inventory](docs/assets.md)
- [License](LICENSE) and [notices](NOTICE)
