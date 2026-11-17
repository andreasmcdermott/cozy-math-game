import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });
await cp(join(root, 'src'), join(out, 'src'), { recursive: true });
const html = (await readFile(join(root, 'index.html'), 'utf8')).replace('name="paws-build" content="development"', 'name="paws-build" content="production"');
await writeFile(join(out, 'index.html'), html);
await import('./build-sw.mjs');
console.log('Built Paws & Potions in dist/ with no runtime or build dependencies.');
