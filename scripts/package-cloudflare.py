"""Package a checked dist/ at the ZIP root for Pages Direct Upload."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
source = root / 'dist'
if not (source / 'index.html').is_file() or not (source / '_headers').is_file():
    raise SystemExit('Run npm run cloudflare:prepare before packaging.')
destination = root / 'release' / 'paws-potions-cloudflare.zip'
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, 'w', compression=ZIP_DEFLATED) as archive:
    for path in sorted(source.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(source))
with ZipFile(destination) as archive:
    if archive.testzip() is not None:
        raise SystemExit('ZIP integrity check failed.')
    if 'index.html' not in archive.namelist():
        raise SystemExit('The ZIP must contain index.html at its root.')
    print(f'{destination}: {len(archive.namelist())} files, {destination.stat().st_size:,} bytes')
