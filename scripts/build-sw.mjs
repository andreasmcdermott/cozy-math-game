import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
const controls = new Set(['sw.js', '_headers', '_redirects']);
const files = walk(root).filter(f => !controls.has(relative(root, f)));
const hash = createHash('sha256');
for (const file of files.sort()) hash.update(readFileSync(file));
const version = `paws-potions-${hash.digest('hex').slice(0, 12)}`;
// Pages redirects /index.html to /. Cache the canonical URL directly, and do
// not request deployment control files that Pages does not serve as assets.
const urls = files.filter(f => relative(root, f) !== 'index.html').map(f => `/${relative(root, f)}`);
writeFileSync(join(root, 'sw.js'), `const CACHE = ${JSON.stringify(version)};
const FILES = ${JSON.stringify(['/', ...urls])};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('paws-potions-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then(cache => cache.match('/'))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, { ignoreSearch: true })).then(cached => cached || fetch(event.request)));
});
`);
console.log(`Offline cache ${version}: ${urls.length} local files.`);
