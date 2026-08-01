from pathlib import Path
import shutil

root = Path(r'd:\browser-ai\packages')
pkgs = ['browser','shared','page-model','memory','ai','voice','commands','ui','agents','engine']

for name in pkgs:
    pkg_dir = root / name
    if not pkg_dir.exists():
        continue
    src_dir = pkg_dir / 'src'
    src_dir.mkdir(exist_ok=True)
    for child in list(pkg_dir.iterdir()):
        if child.name in {'src', 'package.json', 'tsconfig.json'}:
            continue
        if child.is_file() and child.name == 'index.ts':
            child.unlink()
            continue
        target = src_dir / child.name
        if target.exists():
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
        shutil.move(str(child), str(target))
    src_index = src_dir / 'index.ts'
    if not src_index.exists():
        src_index.write_text('/** TODO: Package entrypoint. */\nexport {};\n', encoding='utf-8')
