import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? (entry.name.startsWith('.') ? [] : files(`${directory}/${entry.name}`)) : [`${directory}/${entry.name}`]);
}
function run(program, args) {
  const result = spawnSync(program, args, { stdio: 'inherit', timeout: 180000 });
  if (result.error || result.status !== 0) throw new Error(`check failed: ${program}`);
}
try {
  const source = ['scripts', 'mongo/scripts', 'tests'].flatMap(files);
  for (const path of source.filter(path => /\.(mjs|js)$/.test(path))) run(process.execPath, ['--check', path]);
  const bash = process.platform === 'win32' ? resolve(process.env.ProgramFiles || 'C:/Program Files', 'Git/bin/bash.exe') : 'bash';
  const shell = source.filter(path => path.endsWith('.sh'));
  for (const path of shell) run(bash, ['-n', path]);
  run('docker', ['run', '--rm', '--network', 'none', '--name', `synkro-infra-test-lint-${randomUUID()}`,
    '--label', 'io.synkro.infra.disposable=true', '--label', 'io.synkro.infra.test-run=lint',
    '-v', `${root}:/mnt:ro`, 'koalaman/shellcheck@sha256:bb596a0d169b85ddd81d8b6d3a2ff6d5baf5fca10b97f575ebc647c3dff62b3d', ...shell]);
  run(process.execPath, ['--test', 'tests/configuration.test.mjs', 'tests/sales-boundary.test.mjs']);
  run('git', ['diff', '--check']);
  console.log('PASS syntax, ShellCheck, configuration and diff checks');
} catch (error) { console.error(error.message); process.exitCode = 1; }
