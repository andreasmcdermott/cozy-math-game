import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const version = '4.164.0';
const command = process.argv[2];
if (!/^[a-z0-9][a-z0-9-]{0,57}[a-z0-9]$/.test(config.name)) throw new Error('Choose a lowercase Pages project name in wrangler.jsonc.');
const commands = {
  login: ['login'],
  create: ['pages', 'project', 'create', config.name, '--production-branch', 'main'],
  preview: ['pages', 'dev', config.pages_build_output_dir, '--port', '4181', '--ip', '127.0.0.1'],
  deploy: ['pages', 'deploy', config.pages_build_output_dir, '--project-name', config.name, '--branch', 'main', '--commit-dirty=true'],
};
if (!commands[command]) {
  console.log('Use npm run cloudflare:prepare, cloudflare:preview, cloudflare:login, cloudflare:create, or cloudflare:deploy.');
  process.exitCode = command ? 1 : 0;
} else {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(executable, ['--yes', `wrangler@${version}`, ...commands[command]], {
    cwd: root, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
