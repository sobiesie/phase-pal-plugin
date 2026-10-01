"""Behavior checks for the public package boundary and repeatable ZIP."""

import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile


ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("build_plugin", ROOT / "scripts/build-plugin.py")
BUILD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD)


class PackageTests(unittest.TestCase):
    def test_zip_is_repeatable_and_excludes_unlisted_private_files(self):
        with tempfile.TemporaryDirectory(prefix="phase-pal-package-") as temporary:
            folder = Path(temporary)
            source = folder / "source"
            BUILD.export_repository(ROOT, source)
            (source / "runtime.json").write_text("private fixture", encoding="utf-8")
            first, first_digest = BUILD.build_zip(source, folder / "first")
            second, second_digest = BUILD.build_zip(source, folder / "second")
            self.assertEqual(first.read_bytes(), second.read_bytes())
            self.assertEqual(first_digest, second_digest)
            with zipfile.ZipFile(first) as archive:
                self.assertIsNone(archive.testzip())
                self.assertIn("plugin.json", archive.namelist())
                self.assertIn(".codex-plugin/plugin.json", archive.namelist())
                self.assertNotIn("runtime.json", archive.namelist())
                self.assertNotIn("tests/package_test.py", archive.namelist())
                for name in archive.namelist():
                    self.assertEqual(archive.read(name), (source / name).read_bytes())

    def test_missing_or_linked_input_cannot_enter_a_release(self):
        for linked in (False, True):
            with self.subTest(linked=linked), tempfile.TemporaryDirectory(prefix="phase-pal-package-") as temporary:
                folder = Path(temporary)
                source = folder / "source"
                BUILD.export_repository(ROOT, source)
                icon = source / "assets/logo.png"
                icon.unlink()
                if linked:
                    try:
                        icon.symlink_to(ROOT / "assets/logo.png")
                    except OSError:
                        self.skipTest("This host does not permit symbolic links")
                with self.assertRaises(ValueError):
                    BUILD.build_zip(source, folder / "output")
                self.assertFalse((folder / "output").exists())

    def test_export_preserves_existing_files_and_builds_on_its_own(self):
        with tempfile.TemporaryDirectory(prefix="phase-pal-package-") as temporary:
            destination = Path(temporary) / "public"
            BUILD.export_repository(ROOT, destination)
            existing = destination / "README.md"
            before = existing.read_bytes()
            with self.assertRaises(ValueError):
                BUILD.export_repository(ROOT, destination)
            self.assertEqual(existing.read_bytes(), before)
            self.assertEqual(BUILD.validate_package(destination)["version"], BUILD.validate_package(ROOT)["version"])
            self.assertTrue((destination / ".agents/plugins/marketplace.json").is_file())


if __name__ == "__main__":
    unittest.main()
