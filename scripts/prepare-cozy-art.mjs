// Deterministic extraction of generated art. Requires cwebp and dwebp on PATH.
// Sprite boundaries come from connected alpha components, not grid edges,
// because a few generated objects extend slightly beyond their nominal cells.
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { deflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'art-source');
const output = path.join(root, 'public/art');
const source = path.join(input, 'cozy-furnishings.png');
const names = [
  'decor-plant', 'decor-rug', 'decor-bed',
  'decor-bookshelf', 'decor-lantern', 'decor-potion-shelf',
  'decor-tea-table', 'decor-painting', 'decor-herbs',
];
const padding = 12;
const maximum = 480;
const edgeAllowance = 8; // Keep soft glow and very faint leaf-tip antialiasing.
const scratch = await mkdtemp(path.join(tmpdir(), 'paws-cozy-art-'));
await mkdir(output, { recursive: true });

function parsePam(buffer) {
  const marker = Buffer.from('ENDHDR\n');
  const end = buffer.indexOf(marker) + marker.length;
  if (end < marker.length) throw new Error('Missing PAM header');
  const header = buffer.subarray(0, end).toString('ascii');
  const width = Number(header.match(/WIDTH (\d+)/)?.[1]);
  const height = Number(header.match(/HEIGHT (\d+)/)?.[1]);
  const depth = Number(header.match(/DEPTH (\d+)/)?.[1]);
  if (!width || !height || depth !== 4) throw new Error('Expected an RGBA source');
  return { width, height, rgba: buffer.subarray(end) };
}
async function decodeWebp(filename) {
  const { stdout } = await exec('dwebp', [filename, '-pam', '-o', '-'], { encoding: null, maxBuffer: 32 * 1024 * 1024 });
  return parsePam(stdout);
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let n = 0; n < 8; n++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
function chunk(type, content) {
  const name = Buffer.from(type);
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([name, content])) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
  const result = Buffer.alloc(content.length + 12);
  result.writeUInt32BE(content.length, 0); name.copy(result, 4); content.copy(result, 8);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
function pngFor(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
}
function objectBounds({ width, height, rgba }) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const cells = Array(9).fill(null);
  for (let start = 0; start < width * height; start++) {
    // Alpha 1 is negligible generated background noise. Components at alpha 3+
    // identify the artwork; the final crop still preserves original edge alpha.
    if (seen[start] || rgba[start * 4 + 3] < 3) continue;
    let read = 0, count = 1, x0 = width, y0 = height, x1 = -1, y1 = -1;
    queue[0] = start; seen[start] = 1;
    while (read < count) {
      const pixel = queue[read++], x = pixel % width, y = Math.floor(pixel / width);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const next = yy * width + xx;
        if (!seen[next] && rgba[next * 4 + 3] >= 3) { seen[next] = 1; queue[count++] = next; }
      }
    }
    if (count < 500) continue;
    const column = Math.min(2, Math.floor((x0 + x1) / 2 / width * 3));
    const row = Math.min(2, Math.floor((y0 + y1) / 2 / height * 3));
    const cell = row * 3 + column;
    if (!cells[cell] || count > cells[cell].count) cells[cell] = { x0, y0, x1, y1, count };
  }
  if (cells.some(cell => !cell)) throw new Error('Could not isolate all nine furniture objects');
  return cells;
}
function extract(image, bounds) {
  const x0 = Math.max(0, bounds.x0 - edgeAllowance), y0 = Math.max(0, bounds.y0 - edgeAllowance);
  const x1 = Math.min(image.width - 1, bounds.x1 + edgeAllowance), y1 = Math.min(image.height - 1, bounds.y1 + edgeAllowance);
  const width = x1 - x0 + 1, height = y1 - y0 + 1;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) image.rgba.copy(rgba, y * width * 4, ((y0 + y) * image.width + x0) * 4, ((y0 + y) * image.width + x0 + width) * 4);
  return { width, height, rgba };
}

try {
  if (!process.argv.includes('--sprites-only')) {
    await exec('cwebp', ['-quiet', '-q', '88', '-m', '6', path.join(input, 'cozy-corner.png'), '-o', path.join(output, 'cozy-corner.webp')]);
  }
  const decoded = path.join(scratch, 'source.webp');
  await exec('cwebp', ['-quiet', '-lossless', source, '-o', decoded]);
  const image = await decodeWebp(decoded);
  const bounds = objectBounds(image);
  await Promise.all(names.map(async (name, index) => {
    const cropped = extract(image, bounds[index]);
    const cropPath = path.join(scratch, `${name}-crop.png`);
    const scaledPath = path.join(scratch, `${name}-scaled.webp`);
    const paddedPath = path.join(scratch, `${name}-padded.png`);
    await writeFile(cropPath, pngFor(cropped.width, cropped.height, cropped.rgba));
    const scale = (maximum - padding * 2) / Math.max(cropped.width, cropped.height);
    const w = Math.round(cropped.width * scale), h = Math.round(cropped.height * scale);
    await exec('cwebp', ['-quiet', '-lossless', '-resize', String(w), String(h), cropPath, '-o', scaledPath]);
    const scaled = await decodeWebp(scaledPath);
    const width = scaled.width + padding * 2, height = scaled.height + padding * 2;
    const rgba = Buffer.alloc(width * height * 4);
    for (let y = 0; y < scaled.height; y++) scaled.rgba.copy(rgba, ((y + padding) * width + padding) * 4, y * scaled.width * 4, (y + 1) * scaled.width * 4);
    await writeFile(paddedPath, pngFor(width, height, rgba));
    await exec('cwebp', ['-quiet', '-q', '90', '-alpha_q', '100', '-m', '6', paddedPath, '-o', path.join(output, `${name}.webp`)]);
    console.log(`${name}: ${width} × ${height}, centered with ${padding}px transparent padding`);
  }));
} finally {
  await rm(scratch, { recursive: true, force: true });
}
