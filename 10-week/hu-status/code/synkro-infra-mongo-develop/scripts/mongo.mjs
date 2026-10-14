import { readFileSync, existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseEnvironment, validateConfig, prepareSecrets, composeEnvironment } from './config.mjs';
import { docker, inspect } from './docker.mjs';
import { assertOwned } from './disposable.mjs';
import { protect } from './protect.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const [operation, ...args] = process.argv.slice(2);
function option(name) {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`required ${name}`);
  return args[index + 1];
}
try {
  const file = resolve(option('--env-file'));
  const values = validateConfig(parseEnvironment(readFileSync(file, 'utf8')));
  const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(COMPOSE_|MONGO_|SALES_APP_)/i.test(name)));
  const runtime = resolve(root, '.runtime', values.COMPOSE_PROJECT_NAME);
  const env = { ...baseEnv, ...composeEnvironment(values, runtime) };
  const compose = (commands, timeout = 180000) => docker(['compose', '--env-file', file, '-f', resolve(root, 'compose.yml'), ...commands], { env, timeout });
  const health = (limit = 16000) => compose(['exec', '-T', 'synkro-mongo', 'bash', '/opt/synkro/health.sh'], limit);
  function targetId() {
    const id = compose(['ps', '-a', '-q', 'synkro-mongo']).trim();
    if (!id || id.includes('\n')) throw new Error('expected exactly one MongoDB container');
    return id;
  }
  function wait(seconds) {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 330) throw new Error('invalid wait timeout (1–330 seconds)');
    const deadline = Date.now() + seconds * 1000;
    while (Date.now() < deadline) {
      try { return health(Math.max(1, Math.min(16000, deadline - Date.now()))); } catch { /* bounded retry */ }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(500, Math.max(0, deadline - Date.now())));
    }
    throw new Error('authenticated PRIMARY readiness timed out');
  }
  function verifyNetwork() {
    if (!inspect('network', values.MONGO_NETWORK)) throw new Error(`external network ${values.MONGO_NETWORK} is missing; provision it explicitly`);
    const ids = docker(['ps', '--filter', `network=${values.MONGO_NETWORK}`, '--format', '{{.ID}}']).trim().split('\n').filter(Boolean);
    for (const id of ids) {
      const data = JSON.parse(docker(['inspect', id, '--format', '{"project":{{json (index .Config.Labels "com.docker.compose.project")}},"networks":{{json .NetworkSettings.Networks}}}']));
      if (data.project !== values.COMPOSE_PROJECT_NAME && Object.values(data.networks).some(network => network.Aliases?.includes('synkro-mongo') || network.DNSNames?.includes('synkro-mongo'))) {
        throw new Error(`synkro-mongo already exists on ${values.MONGO_NETWORK}; operate environments sequentially`);
      }
    }
  }
  function start() {
    verifyNetwork();
    prepareSecrets(values, root);
    compose(['up', '-d', '--wait', '--wait-timeout', String(Number(values.MONGO_STARTUP_TIMEOUT_SECONDS) + 30), 'synkro-mongo'], (Number(values.MONGO_STARTUP_TIMEOUT_SECONDS) + 90) * 1000);
    return health();
  }
  switch (operation) {
    case 'validate': console.log(`valid configuration: ${values.COMPOSE_PROJECT_NAME}`); break;
    case 'prepare': prepareSecrets(values, root); console.log(`protected secret files prepared for ${values.COMPOSE_PROJECT_NAME}`); break;
    case 'config': console.log(compose(['config'])); break;
    case 'start': console.log(start().trim()); break;
    case 'health': console.log(health().trim()); break;
    case 'status': console.log(compose(['ps']).trim()); console.log(health().trim()); break;
    case 'wait': console.log(wait(Number(option('--timeout-seconds'))).trim()); break;
    case 'bootstrap':
      prepareSecrets(values, root);
      console.log(compose(['exec', '-T', 'synkro-mongo', 'bash', '/opt/synkro/bootstrap.sh'], (Number(values.MONGO_STARTUP_TIMEOUT_SECONDS) + 5) * 1000).trim());
      break;
    case 'stop': compose(['stop', 'synkro-mongo']); console.log(`stopped ${values.COMPOSE_PROJECT_NAME}; named volumes preserved`); break;
    case 'restart': compose(['stop', 'synkro-mongo']); console.log(start().trim()); break;
    case 'backup':
    case 'restore-disposable':
    case 'restore-sales-disposable': {
      const database = option('--database');
      const archive = resolve(option('--archive'));
      if (!/^[a-z][a-z0-9_]{0,63}$/.test(database) || ['admin', 'config', 'local'].includes(database)) throw new Error('select an ordinary database; authentication metadata is excluded');
      health();
      const id = targetId();
      const container = inspect('container', id);
      const temporary = `/tmp/synkro-${randomUUID()}.archive.gz`;
      const backup = operation === 'backup';
      const salesRestore = operation === 'restore-sales-disposable';
      if (backup && existsSync(archive)) throw new Error('backup archive already exists; choose a new path');
      if (!backup) {
        const run = option('--test-run');
        if (values.MONGO_DISPOSABLE !== 'true' || run !== values.MONGO_TEST_RUN) throw new Error('restore is allowed only on the explicitly identified disposable test target');
        assertOwned(container, { project: values.COMPOSE_PROJECT_NAME, run, name: container.Name.slice(1), id: container.Id }, 'container');
        if (salesRestore) {
          if (database !== 'sales') throw new Error('Sales recovery restores only sales.sale');
          const sales = await import('./sales.mjs');
          const recorded = sales.recordedTarget(resolve(option('--manifest')), values);
          const checkout = resolve(option('--sales-checkout'));
          // Safety checks know only the selected application namespace. The
          // supported domain runner owns migration status/checksums/compatibility.
          const empty = ['exec', '-T', '-e', `MONGO_TOOLS_DB=${database}`, '-e', 'MONGO_TOOLS_COLLECTION=sale',
            'synkro-mongo', 'timeout', '12s', 'mongosh', '--nodb', '--quiet', '--file', '/opt/synkro/empty-collection.js'];
          compose(empty);
          await sales.runSales({ ...recorded, values, checkout, image: recorded.instance.salesImage, expected: 'unchanged', command: 'status' });
          await sales.runSales({ ...recorded, values, checkout, image: recorded.instance.salesImage, expected: 'unchanged' });
          compose(empty);
        } else {
          compose(['exec', '-T', '-e', `MONGO_TOOLS_DB=${database}`, 'synkro-mongo', 'timeout', '12s', 'mongosh', '--nodb', '--quiet', '--file', '/opt/synkro/empty-database.js']);
        }
        const input = openSync(archive, 'r');
        try { docker(['exec', '-i', id, 'bash', '/opt/synkro/receive-archive.sh', temporary], { stdio: [input, 'pipe', 'pipe'] }); }
        finally { closeSync(input); }
      }
      try {
        compose(['exec', '-T', '-e', `MONGO_TOOLS_DB=${database}`, '-e', `MONGO_TOOLS_ARCHIVE=${temporary}`, 'synkro-mongo', 'bash', '/opt/synkro/tools.sh', backup ? 'backup' : salesRestore ? 'restore-sales' : 'restore'], 125000);
        if (backup) {
          mkdirSync(dirname(archive), { recursive: true, mode: 0o700 });
          const output = openSync(archive, 'wx', 0o600);
          try { docker(['exec', id, 'cat', temporary], { stdio: ['ignore', output, 'pipe'] }); }
          finally { closeSync(output); }
          protect(archive);
        }
      } finally { docker(['exec', id, 'rm', '-f', temporary]); }
      console.log(salesRestore ? 'disposable Sales restore: sales.sale documents only; target schema, roles, users and Liquibase history retained'
        : `${backup ? 'backup' : 'disposable restore'} verified by tools: ${database}; data and collection metadata only, no users`);
      break;
    }
    default: throw new Error('supported operations: validate, prepare, config, start, status, health, wait, bootstrap, stop, restart, backup, restore-disposable, restore-sales-disposable');
  }
} catch (error) {
  // Never print child output buffers, process environments or file contents.
  console.error(`MongoDB operation failed: ${error.message}`);
  process.exitCode = 1;
}
