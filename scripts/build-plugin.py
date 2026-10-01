#!/usr/bin/env python3
"""Build the Phase Pal plugin from a fixed public file list. Standard library only."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import xml.etree.ElementTree as ET
import zipfile


PLUGIN_ROOT = Path(__file__).resolve().parent.parent
RELEASE_FILES = (
    "plugin.json",
    "mcp.json",
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "README.md",
    "LICENSE",
    "NOTICE",
    "assets/logo.svg",
    "assets/composer-icon.svg",
    "docs/assets.md",
    "docs/support.md",
    "docs/privacy.md",
    "docs/terms.md",
    "docs/distribution.md",
    "scripts/launch-phase-pal-mcp.mjs",
    "skills/control-phase-pal/SKILL.md",
)
REPOSITORY_FILES = RELEASE_FILES + (
    ".agents/plugins/marketplace.json",
    ".gitignore",
    "scripts/build-plugin.py",
    "tests/launcher.test.mjs",
    "tests/package_test.py",
)


def checked_file(root, relative):
    """Reject missing files and symlinks before reading an export input."""
    current = root
    for part in Path(relative).parts:
        current = current / part
        if current.is_symlink():
            raise ValueError(f"Package input is a symbolic link: {relative}")
    if not current.is_file():
        raise ValueError(f"Required file is missing: {relative}")
    return current


def read_json(root, relative):
    return json.loads(checked_file(root, relative).read_text(encoding="utf-8"))


def validate_package(root):
    """Check identity, launcher parity, listing paths, and square SVG assets."""
    for relative in RELEASE_FILES:
        checked_file(root, relative)
    manifest = read_json(root, "plugin.json")
    if manifest.get("$schema") != "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json":
        raise ValueError("The portable plugin schema is required")
    if manifest.get("name") != "phase-pal":
        raise ValueError("Expected plugin name phase-pal")
    version = manifest.get("version", "")
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?", version):
        raise ValueError("An explicit semantic release version is required")
    compatibility = read_json(root, ".codex-plugin/plugin.json")
    for key in ("name", "version", "description", "author", "homepage", "repository", "license"):
        if manifest.get(key) != compatibility.get(key):
            raise ValueError(f"Compatibility manifest differs: {key}")
    interface = manifest["extensions"]["com.openai"]["interface"]
    if interface != compatibility.get("interface"):
        raise ValueError("Compatibility listing differs from the portable listing")
    for key in ("websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"):
        if not interface.get(key, "").startswith("https://"):
            raise ValueError(f"An HTTPS listing URL is required: {key}")
    for key in ("logo", "composerIcon"):
        relative = interface.get(key, "")
        if not relative.startswith("./") or ".." in Path(relative).parts:
            raise ValueError(f"Invalid asset path: {key}")
        if relative[2:] not in RELEASE_FILES:
            raise ValueError(f"Asset is not in the release file list: {key}")
        asset = checked_file(root, relative)
        if asset.stat().st_size > 5 * 1024 * 1024:
            raise ValueError(f"Asset is larger than 5 MiB: {key}")
        svg = ET.parse(asset).getroot()
        if svg.tag != "{http://www.w3.org/2000/svg}svg":
            raise ValueError(f"Expected SVG: {key}")
        width, height = float(svg.attrib["width"]), float(svg.attrib["height"])
        if width != height or width < 48:
            raise ValueError(f"SVG must be square and at least 48 pixels: {key}")
    mcp = read_json(root, "mcp.json")
    if mcp.get("$schema") != "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json":
        raise ValueError("The portable MCP schema is required")
    server = mcp["mcpServers"]["phase_pal"]
    expected = {
        "type": "stdio",
        "command": "node",
        "args": ["./scripts/launch-phase-pal-mcp.mjs"],
        "cwd": "./",
    }
    if mcp["mcpServers"] != {"phase_pal": expected}:
        raise ValueError("Expected the local Phase Pal STDIO launcher")
    legacy_server = read_json(root, ".mcp.json")["mcpServers"]["phase_pal"]
    if any(legacy_server.get(key) != server[key] for key in ("command", "args", "cwd")):
        raise ValueError("Compatibility MCP launcher differs from portable MCP")
    return manifest


def build_zip(root, output_dir):
    """Produce the same ZIP bytes for the same inputs on every platform."""
    manifest = validate_package(root)
    output_dir.mkdir(parents=True, exist_ok=True)
    archive = output_dir / f"phase-pal-{manifest['version']}.zip"
    with tempfile.NamedTemporaryFile(dir=output_dir, delete=False) as temporary:
        temporary_path = Path(temporary.name)
    try:
        with zipfile.ZipFile(temporary_path, "w", compression=zipfile.ZIP_STORED) as output:
            for relative in sorted(RELEASE_FILES):
                # One fixed timestamp and POSIX mode; no host paths or ZIP extra fields.
                entry = zipfile.ZipInfo(relative, date_time=(2026, 1, 1, 0, 0, 0))
                entry.create_system = 3
                entry.external_attr = (0o100644 << 16)
                entry.compress_type = zipfile.ZIP_STORED
                output.writestr(entry, checked_file(root, relative).read_bytes())
        digest = hashlib.sha256(temporary_path.read_bytes()).hexdigest()
        os.replace(temporary_path, archive)
        archive.with_suffix(".zip.sha256").write_bytes(
            f"{digest}  {archive.name}\n".encode("utf-8")
        )
    finally:
        if temporary_path.exists():
            temporary_path.unlink()
    return archive, digest


def export_repository(root, destination):
    """Copy only reviewed source files into a new or empty public checkout."""
    validate_package(root)
    sources = [(relative, checked_file(root, relative)) for relative in REPOSITORY_FILES]
    if destination.is_symlink() or (destination.exists() and any(destination.iterdir())):
        raise ValueError("Repository destination must be new or empty")
    destination.mkdir(parents=True, exist_ok=True)
    for relative, source in sources:
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate without writing files")
    parser.add_argument("--output-dir", type=Path, default=PLUGIN_ROOT / "dist")
    parser.add_argument("--repository-dir", type=Path, help="Export the separate public repository")
    args = parser.parse_args()
    try:
        manifest = validate_package(PLUGIN_ROOT)
        if args.check:
            if args.repository_dir:
                parser.error("--check cannot be combined with --repository-dir")
            print(f"Valid package: {manifest['name']} {manifest['version']}")
            return
        if args.repository_dir:
            exported = export_repository(PLUGIN_ROOT, args.repository_dir)
            print(f"Public repository files: {exported}")
        archive, digest = build_zip(PLUGIN_ROOT, args.output_dir)
        print(f"ZIP: {archive}")
        print(f"SHA-256: {digest}")
    except (ValueError, KeyError, OSError, ET.ParseError) as error:
        parser.exit(1, f"Build failed: {error}\n")


if __name__ == "__main__":
    main()
