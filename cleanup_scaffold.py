from pathlib import Path
import json
import shutil

root = Path(r"D:\browser-ai")

# Move package-level children into src and remove duplicate root index.ts files
for pkg_name in ["browser", "page-model", "shared", "memory", "ai", "commands", "voice", "ui", "engine"]:
    pkg_dir = root / "packages" / pkg_name
    if not pkg_dir.exists():
        pkg_dir.mkdir(parents=True, exist_ok=True)
    src_dir = pkg_dir / "src"
    src_dir.mkdir(parents=True, exist_ok=True)

    for child in list(pkg_dir.iterdir()):
        if child.name in {"src", "package.json", "tsconfig.json"}:
            continue
        if child.name == "index.ts" and child.parent == pkg_dir:
            child.unlink()
            continue
        target = src_dir / child.name
        if target.exists():
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
        shutil.move(str(child), str(target))

    if not (pkg_dir / "package.json").exists():
        (pkg_dir / "package.json").write_text(json.dumps({
            "name": f"@browser-ai/{pkg_name}",
            "version": "0.0.1",
            "private": True,
            "main": "./src/index.ts"
        }, indent=2) + "\n", encoding="utf-8")

    if not (pkg_dir / "tsconfig.json").exists():
        (pkg_dir / "tsconfig.json").write_text(json.dumps({
            "extends": "../../tsconfig.base.json",
            "compilerOptions": {
                "rootDir": "src",
                "outDir": "dist"
            },
            "include": ["src"]
        }, indent=2) + "\n", encoding="utf-8")

    if not (src_dir / "index.ts").exists():
        (src_dir / "index.ts").write_text("/** TODO: Package entrypoint. */\nexport {};\n", encoding="utf-8")

# Extension cleanup
ext_dir = root / "apps" / "extension"
if (ext_dir.exists()):
    manifest_file = ext_dir / "manifest.json"
    if manifest_file.exists():
        manifest_file.unlink()

    src_dir = ext_dir / "src"
    src_dir.mkdir(parents=True, exist_ok=True)

    for child in list(ext_dir.iterdir()):
        if child.name in {"src", "package.json", "tsconfig.json", "vite.config.ts", "manifest.config.ts"}:
            continue
        if child.name == "index.ts" and child.parent == ext_dir:
            child.unlink()
            continue
        target = src_dir / child.name
        if target.exists():
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
        shutil.move(str(child), str(target))

    for rel_path, content in {
        "src/index.ts": "/** TODO: Extension app bootstrap. */\nexport {};\n",
        "src/background/index.ts": "/** TODO: Background script entrypoint. */\nexport {};\n",
        "src/content/index.ts": "/** TODO: Content script entrypoint. */\nexport {};\n",
        "src/popup/main.tsx": "/** TODO: Popup entrypoint. */\nexport const popupRoot = 'popup';\n",
        "src/options/main.tsx": "/** TODO: Options entrypoint. */\nexport const optionsRoot = 'options';\n",
        "src/sidepanel/main.tsx": "/** TODO: Sidepanel entrypoint. */\nexport const sidepanelRoot = 'sidepanel';\n",
    }.items():
        path = ext_dir / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text(content, encoding="utf-8")

print("Cleanup complete")
