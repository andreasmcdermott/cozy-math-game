// Recompress the original generated painting without changing its composition.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
await promisify(execFile)('cwebp', ['-quiet', '-q', '88', '-m', '6',
  fileURLToPath(new URL('art-source/village-garden.png', root)),
  '-o', fileURLToPath(new URL('public/art/village-garden.webp', root))]);
console.log('Prepared the local village garden background.');
