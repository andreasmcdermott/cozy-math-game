// Deterministic sprite extraction and compression. Requires the cwebp CLI.
// Image creation and creative edits use ChatGPT image generation, not this script.
import { readFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'art-source');
const output = path.join(root, 'public/art');
await mkdir(output, { recursive: true });

async function sprites(source, names) {
  const filename = path.join(input, source);
  const png = await readFile(filename);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const left = Math.floor(width / 2);
  const top = Math.floor(height / 2);
  const regions = [
    [0, 0, left, top],
    [left, 0, width - left, top],
    [0, top, left, height - top],
    [left, top, width - left, height - top],
  ];
  await Promise.all(names.map((name, index) => exec('cwebp', [
    '-quiet', '-q', '90', '-alpha_q', '100', '-m', '6',
    '-crop', ...regions[index].map(String), '-resize', '480', '0',
    filename, '-o', path.join(output, `${name}.webp`),
  ])));
}

await Promise.all([
  exec('cwebp', ['-quiet', '-q', '88', '-m', '6', path.join(input, 'shop.png'), '-o', path.join(output, 'shop.webp')]),
  sprites('familiars.png', ['moss-kitten', 'mushroom-frog', 'lavender-dragon', 'rabbit']),
  sprites('ingredients.png', ['moonwater', 'moonberries', 'honey', 'mint']),
]);
console.log('Prepared shop background and eight transparent sprites in public/art.');
