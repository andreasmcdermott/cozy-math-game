import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { networkInterfaces } from 'node:os';

const args = process.argv.slice(2);
const production = args.includes('--production');
const specifiedPort = args.indexOf('--port');
const port = Number(specifiedPort >= 0 ? args[specifiedPort + 1] : process.env.PORT || (production ? 4180 : 4179));
const root = fileURLToPath(new URL('../', import.meta.url));
const base = production ? resolve(root, 'dist') : root;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) { res.writeHead(400); res.end(); return; }
    const isSource = pathname.startsWith('/src/');
    const file = pathname === '/' ? resolve(base, 'index.html') : !production && !isSource ? resolve(base, 'public', `.${pathname}`) : resolve(base, `.${pathname}`);
    const allowed = production ? base : isSource ? resolve(root, 'src') : resolve(root, 'public');
    if (file !== resolve(base, 'index.html') && !file.startsWith(allowed + sep)) { res.writeHead(403); res.end(); return; }
    if (!(await stat(file)).isFile()) throw new Error('Not found');
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': content.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '0.0.0.0', () => {
  console.log(`Paws & Potions ${production ? 'production preview' : 'development'}: http://localhost:${port}/`);
  for (const addresses of Object.values(networkInterfaces())) for (const address of addresses || []) if (address.family === 'IPv4' && !address.internal) console.log(`Same-network iPad: http://${address.address}:${port}/`);
});
