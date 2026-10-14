import { spawnSync } from 'node:child_process';
export const MONGO_IMAGE = 'mongo:7.0@sha256:1f995ad6fdb93244a1addab1b58f934a0bc2f5643c38e02f5e9d7f0c7d227a7b';
export function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) {
    // Classify without publishing raw child buffers, which may contain secrets.
    const diagnostic = `${result.stderr || ''}\n${result.stdout || ''}`;
    const category = result.error?.code === 'ETIMEDOUT' ? 'timeout'
      : /cidfile|container ID file/i.test(diagnostic) ? 'cidfile'
      : /already in use|already exists/i.test(diagnostic) ? 'name conflict'
      : /No such image|pull access denied/i.test(diagnostic) ? 'image unavailable'
      : /network.*not found/i.test(diagnostic) ? 'network unavailable'
      : /invalid mount|mount.*denied|bind source/i.test(diagnostic) ? 'mount'
      : /permission denied|access is denied/i.test(diagnostic) ? 'permission'
      : /Cannot connect|error during connect|connection refused/i.test(diagnostic) ? 'daemon unavailable'
      : `exit ${result.status ?? result.error?.code ?? 'unknown'}`;
    throw new Error(`Docker operation failed (${args[0]}: ${category}); inspect the target's safe health/bootstrap messages`);
  }
  return result.stdout;
}
export function inspect(kind, name) {
  const format = kind === 'container'
    ? '{"Id":{{json .Id}},"Name":{{json .Name}},"Config":{"Labels":{{json .Config.Labels}}}}'
    : kind === 'network' ? '{"Id":{{json .Id}},"Name":{{json .Name}},"Labels":{{json .Labels}}}'
      : '{"Name":{{json .Name}},"CreatedAt":{{json .CreatedAt}},"Labels":{{json .Labels}}}';
  // Daemon errors are not evidence of absence. Check availability separately.
  docker(['info', '--format', '{{.ServerVersion}}']);
  try { return JSON.parse(docker([kind, 'inspect', name, '--format', format])); }
  catch {
    const names = docker([kind === 'container' ? 'ps' : kind, ...(kind === 'container' ? ['-a'] : ['ls']), '--format', kind === 'container' ? '{{.Names}}' : '{{.Name}}']).trim().split('\n');
    if (names.includes(name)) throw new Error(`cannot inspect existing ${kind}`);
    return null;
  }
}
