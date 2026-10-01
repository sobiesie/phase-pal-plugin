# Distribution and release

The public repository is `sobiesie/phase-pal-plugin`. Its root is this plugin
folder. Its `.agents/plugins/marketplace.json` points to `./`, relative to
the repository root. The Unity source repository has a separate existing
marketplace entry that points to `./plugins/phase-pal`.

## Local control distribution

Distribute this local STDIO MCP package through the GitHub marketplace and
GitHub release ZIPs. It needs Phase Pal on the same computer as the agent.
It cannot control a local avatar from a cloud-only agent environment.

The portable format does not make local STDIO eligible for the ordinary
OpenAI public MCP submission path. That path currently requires a remote
HTTPS endpoint, or a separate arrangement with OpenAI for local MCP support.
See [OpenAI packaging guidance](https://developers.openai.com/plugins/build/plugins).
Do not change local control into a public remote endpoint to submit this ZIP.

## Build a ZIP

From the plugin folder:

```sh
python3 scripts/build-plugin.py --check
node --test tests/launcher.test.mjs
python3 -m unittest discover -s tests -p 'package_test.py'
python3 scripts/build-plugin.py
```

The ZIP has `plugin.json` at its root, plus the MCP configuration, compatibility
files, control skill, launcher, graphics, license, notices, and public documents.
It excludes tests, build tools, Git files, local settings, tokens, and binaries.
No dependency download is needed. Fixed entry order, timestamps, permissions,
and uncompressed storage make the ZIP repeatable across Python platforms.
The output includes a SHA-256 file.

## Export the separate public repository

The export uses a fixed file list. It includes release files, the marketplace
catalog, tests, and build script. It does not copy Unity project files or the
private repository history. The destination must be new or empty.

From the Unity repository root:

```sh
python3 plugins/phase-pal/scripts/build-plugin.py --output-dir BuildArtifacts/Plugins/phase-pal --repository-dir /path/to/new/phase-pal-plugin
```

Review the exported files before committing them to the separate repository.
Keep the public repository's default branch as `main`, because the listing
links point to the public documents on that branch. GitHub renders the support,
privacy, and terms pages; GitHub Pages is not required.

## Update a release

1. Update `version` in both manifests and keep listing data equal.
2. Update the public documents if data handling or requirements change.
3. Run the checks and build the ZIP.
4. Publish the reviewed plugin source and attach the ZIP and SHA-256 file to
   a GitHub release with the matching version.
5. Confirm the listing links work without a GitHub login.

The build fails if a required file is missing, a package input is a symbolic
link, the manifests disagree, or an icon fails the square image requirements.
Never add a runtime descriptor, executable, personal configuration, or secret
to the build file list.
