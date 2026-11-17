import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });
await cp(join(root, 'src'), join(out, 'src'), { recursive: true });
// Version the entire module graph so a previous service worker cannot mix old
// game rules with the new UI during its first post-upgrade navigation.
const sources = (await readdir(join(out, 'src'))).sort();
const hash = createHash('sha256');
for (const source of sources) hash.update(await readFile(join(out, 'src', source)));
const version = hash.digest('hex').slice(0, 12);
for (const source of sources) {
  if (!/\.(js|css)$/.test(source)) continue;
  const file = join(out, 'src', source);
  const text = await readFile(file, 'utf8');
  const updated = source.endsWith('.js')
    ? text.replace(/((?:from\s*|import\s*)['"])(\.{1,2}\/[^'"]+\.js)(['"])/g, `$1$2?v=${version}$3`)
    : text.replace(/(@import\s+['"])(\.\/[^'"]+\.css)(['"])/g, `$1$2?v=${version}$3`);
  await writeFile(file, updated);
}
const html = (await readFile(join(root, 'index.html'), 'utf8'))
  .replace('name="paws-build" content="development"', 'name="paws-build" content="production"')
  .replace('/src/main.js"', `/src/main.js?v=${version}"`)
  .replace('/src/style.css"', `/src/style.css?v=${version}"`);
await writeFile(join(out, 'index.html'), html);
await import('./build-sw.mjs');
console.log('Built Paws & Potions in dist/ with no runtime or build dependencies.');
