import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });
await cp(join(root, 'src'), join(out, 'src'), { recursive: true });
// Give the whole module graph a new pathname. Earlier service workers ignored
// query strings, so query-only versions could still serve incompatible code.
const sources = (await readdir(join(out, 'src'))).sort();
const hash = createHash('sha256');
for (const source of sources) hash.update(await readFile(join(out, 'src', source)));
const version = hash.digest('hex').slice(0, 12);
const appDirectory = `app-${version}`;
await rename(join(out, 'src'), join(out, appDirectory));
const html = (await readFile(join(root, 'index.html'), 'utf8'))
  .replace('name="paws-build" content="development"', 'name="paws-build" content="production"')
  .replace('/src/main.js"', `/${appDirectory}/main.js"`)
  .replace('/src/style.css"', `/${appDirectory}/style.css"`);
await writeFile(join(out, 'index.html'), html);
await import('./build-sw.mjs');
console.log('Built Paws & Potions in dist/ with no runtime or build dependencies.');
