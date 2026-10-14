import { chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
export function protect(path, directory = false) {
  if (process.platform !== 'win32') { chmodSync(path, directory ? 0o700 : 0o600); return; }
  const account = spawnSync('whoami.exe', [], { encoding: 'utf8', timeout: 10000 });
  if (account.status !== 0) throw new Error('cannot identify owner for secret file protection');
  const principal = account.stdout.trim();
  const result = spawnSync('icacls.exe', [path, '/inheritance:r', '/grant:r', `${principal}:${directory ? '(OI)(CI)F' : 'F'}`,
    '/remove:g', '*S-1-1-0', '*S-1-5-11', '*S-1-5-32-545'], { encoding: 'utf8', timeout: 10000 });
  if (result.status !== 0) throw new Error('cannot restrict secret file ACL; verify owner permissions');
}
