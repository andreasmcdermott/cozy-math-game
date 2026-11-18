import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const origin = 'https://paws-potions-math.pages.dev';
const html = await readFile(join(dist, 'index.html'), 'utf8');
const headers = await readFile(join(dist, '_headers'), 'utf8');

function headersFor(pathname) {
  const matches = [], result = {};
  let pattern;
  for (const line of headers.split('\n')) {
    if (line.startsWith('/')) pattern = line.trim();
    else if (pattern && /^\s+\S/.test(line)) {
      const index = line.indexOf(':');
      const wildcard = pattern.indexOf('*');
      const match = wildcard < 0 ? pathname === pattern : pathname.startsWith(pattern.slice(0, wildcard)) && pathname.endsWith(pattern.slice(wildcard + 1));
      if (match && index > 0) matches.push([line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]);
    }
  }
  for (const [name, value] of matches) {
    assert.equal(result[name], undefined, `Conflicting ${name} rules on ${pathname}`);
    result[name] = value;
  }
  return result;
}

test('Pages has a complete same-origin module graph and its own static config', async () => {
  const config = JSON.parse(await readFile(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.pages_build_output_dir, './dist');
  const entry = html.match(/type="module" src="([^"]+)"/)[1];
  assert.match(entry, /^\/app-[a-f0-9]+\/main\.js$/);
  const pending = [entry], visited = new Set();
  while (pending.length) {
    const file = pending.pop(); if (visited.has(file)) continue; visited.add(file);
    const source = await readFile(join(dist, file.slice(1)), 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('./'), `Unexpected external module ${match[1]}`);
      pending.push(new URL(match[1], origin + file).pathname);
    }
  }
  assert.ok(visited.size >= 5);
  assert.ok([...visited].some(path => path.endsWith('/backups.js')));
  await access(join(dist, html.match(/rel="stylesheet" href="([^"]+)"/)[1].slice(1)));
});

test('cache rules keep mutable assets fresh and content-versioned modules immutable', () => {
  const entry = html.match(/type="module" src="([^"]+)"/)[1];
  assert.match(headersFor(entry)['cache-control'], /31536000, immutable/);
  for (const path of ['/', '/index.html', '/sw.js', '/manifest.webmanifest', '/art/cozy-corner.webp', '/fonts/lora-normal-400.ttf']) {
    assert.match(headersFor(path)['cache-control'], /max-age=0/);
    assert.ok(!headersFor(path)['cache-control'].includes('immutable'));
  }
  const policy = headersFor('/')['content-security-policy'];
  assert.ok(policy.includes("script-src 'self'"));
  assert.ok(policy.includes("style-src 'self' 'unsafe-inline'"));
  assert.equal(headersFor('/sw.js')['service-worker-allowed'], '/');
  assert.ok(!headers.includes('__APP_DIRECTORY__'));
});

test('the generated worker installs from canonical Pages assets and reopens the game offline', async () => {
  const handlers = {}, stores = new Map();
  let online = true;
  const keyFor = request => new URL(typeof request === 'string' ? request : request.url, origin).pathname;
  const fetchAsset = async request => {
    if (!online) throw new Error('Offline');
    const path = keyFor(request);
    if (path === '/_headers' || path === '/_redirects') return new Response('Not a public asset', { status: 404 });
    if (path === '/index.html') return new Response(null, { status: 301, headers: { Location: '/' } });
    try { return new Response(await readFile(join(dist, path === '/' ? 'index.html' : path.slice(1)))); }
    catch { return new Response('Not found', { status: 404 }); }
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(urls) {
          for (const url of urls) {
            const response = await fetchAsset(url);
            assert.equal(response.status, 200, `Precache requires a public canonical URL: ${url}`);
            entries.set(keyFor(url), response);
          }
        },
        async match(request) { return entries.get(keyFor(request))?.clone(); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const self = { location: { origin }, clients: { claim: async () => {} }, skipWaiting: async () => {}, addEventListener: (name, callback) => { handlers[name] = callback; } };
  runInContext(await readFile(join(dist, 'sw.js'), 'utf8'), createContext({ self, caches, fetch: fetchAsset, URL }));
  let install; handlers.install({ waitUntil: promise => { install = promise; } }); await install;
  const stored = [...stores.values()][0];
  assert.ok(stored.has('/')); assert.ok(!stored.has('/index.html')); assert.ok(!stored.has('/_headers'));
  assert.ok(stored.has('/art/cozy-corner.webp')); assert.ok(stored.has('/art/decor-bed.webp'));
  online = false;
  let response; handlers.fetch({ request: { url: origin + '/', method: 'GET', mode: 'navigate' }, respondWith: promise => { response = promise; } });
  const offline = await response;
  assert.equal(offline.status, 200); assert.equal(await offline.text(), html);
  handlers.fetch({ request: { url: origin + '/art/decor-bed.webp', method: 'GET', mode: 'cors' }, respondWith: promise => { response = promise; } });
  assert.ok((await (await response).arrayBuffer()).byteLength > 0);
});
