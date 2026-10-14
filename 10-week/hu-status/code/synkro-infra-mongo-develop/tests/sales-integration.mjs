import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const run = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const artifacts = resolve('tests/.artifacts', run);
mkdirSync(artifacts, { recursive: true, mode: 0o700 });
const checkoutArgument = process.argv.indexOf('--sales-checkout');
const checkout = resolve(checkoutArgument >= 0 ? process.argv[checkoutArgument + 1] : '.runtime/sales');
const secrets = Array.from({ length: 4 }, () => randomBytes(24).toString('base64') + '$!@:\\" /%+ space');
const keys = Array.from({ length: 2 }, () => randomBytes(756).toString('base64'));
const instances = [];
const manifest = resolve(artifacts, 'manifest.json');
const save = () => writeFileSync(manifest, JSON.stringify(instances, null, 2));
function execute(program, args, timeout = 180000) {
  const result = spawnSync(program, args, { encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0 || result.error) {
    let detail = `${result.stdout || ''}\n${result.stderr || ''}`.split('\n').filter(line => /^(FAIL Sales probe|MongoDB operation failed:|restore refused:)/.test(line)).join(' ');
    for (const secret of [...secrets, ...keys]) detail = detail.replaceAll(secret, '[REDACTED]').replaceAll(encodeURIComponent(secret), '[REDACTED]');
    throw new Error(`${program === process.execPath ? 'CLI' : program} failed (${result.status ?? 'timeout'})${detail ? `: ${detail}` : ''}`);
  }
  return result.stdout.trim();
}
const docker = args => execute('docker', args);
function cli(instance, action, extra = []) {
  try { return execute(process.execPath, ['--', 'scripts/mongo.mjs', action, '--env-file', instance.file, ...extra]); }
  finally {
    // Recovery's child process also records clients. Preserve its manifest
    // transactions before any later parent save, including on failure.
    if (existsSync(manifest)) {
      const recorded = JSON.parse(readFileSync(manifest, 'utf8'));
      for (const current of instances) {
        const saved = recorded.find(item => item.project === current.project && item.run === current.run);
        for (const client of saved?.clients || []) {
          const previous = (current.clients ||= []).find(item => item.name === client.name);
          if (previous) {
            if (previous.id && client.id) assert.equal(client.id, previous.id, 'recorded client identity cannot change');
            Object.assign(previous, client);
          } else current.clients.push(client);
        }
      }
    }
  }
}
function instance(stage, index) {
  const project = `synkro-infra-test-${run}-${stage}`;
  const values = { COMPOSE_PROJECT_NAME: project, MONGO_NETWORK: project, MONGO_ADMIN_USER: `${stage}_operator`,
    MONGO_ADMIN_PASSWORD: secrets[index * 2], SALES_APP_PASSWORD: secrets[index * 2 + 1], MONGO_INTERNAL_KEY: keys[index],
    MONGO_REPLICA_SET: 'rs0', MONGO_STARTUP_TIMEOUT_SECONDS: '60', MONGO_CONNECT_TIMEOUT_MS: '1000', MONGO_TEST_RUN: run, MONGO_DISPOSABLE: 'true' };
  const file = resolve(artifacts, `${stage}.env`);
  writeFileSync(file, Object.entries(values).map(([key, value]) => `${key}='${value}'`).join('\n'), { mode: 0o600 });
  const result = { project, run, network: project, file, resources: [] }; instances.push(result); save(); return { result, values };
}
let failed;
try {
  // Test-first red: this missing integration module must fail before creating resources.
  const sales = await import('../scripts/sales.mjs');
  const disposable = await import('../scripts/disposable.mjs');
  const { inspect } = await import('../scripts/docker.mjs');
  const root = resolve('.');
  sales.verifyCheckout(checkout);
  const image = sales.buildRunner(checkout);
  const { result: source, values: sourceValues } = instance('source', 0);
  const { result: target, values: targetValues } = instance('restore', 1);
  source.salesImage = image; target.salesImage = image; save();
  function start(current) { disposable.createNetwork(current); save(); console.log(cli(current, 'start')); disposable.capture(current); save(); }
  let sequence = 0;
  function probe(current, action) {
    const number = ++sequence;
    const client = { name: `${current.project}-client-${number}`, cidFile: resolve(artifacts, `client-${number}.cid`) };
    (current.clients ||= []).push(client); save();
    try {
      return docker(['run', '--rm', '--name', client.name, '--cidfile', client.cidFile, '--network', current.network,
        '--tmpfs', '/data/db', '--tmpfs', '/data/configdb', '--label', 'io.synkro.infra.client=true', '--label', 'io.synkro.infra.disposable=true',
        '--label', `io.synkro.infra.test-run=${run}`, '--label', `io.synkro.infra.test-project=${current.project}`,
        '-e', `TEST_ACTION=${action}`, '-v', `${resolve('.runtime', current.project)}:/run/secrets:ro`,
        '-v', `${root}/tests:/tests:ro`, '--entrypoint', 'mongosh', disposable.MONGO_IMAGE, '--nodb', '--quiet', '--file', '/tests/sales-probe.js']);
    } finally {
      if (existsSync(client.cidFile)) client.id = readFileSync(client.cidFile, 'utf8').trim();
      const resource = inspect('container', client.name);
      if (resource) disposable.assertClientOwned(resource, { ...client, project: current.project, run }); else client.removed = true;
      save();
    }
  }
  const migrate = (current, values, expected) => sales.runSales({ instance: current, values, checkout, image, save, expected });
  start(source); console.log(probe(source, 'initial'));
  const firstApplied = await migrate(source, sourceValues, 'applied'); console.log(probe(source, 'baseline'));
  const baseline = probe(source, 'snapshot');
  await migrate(source, sourceValues, 'unchanged'); assert.equal(probe(source, 'snapshot'), baseline);
  console.log('PASS SALES-02 owner runner validates migrations; zero-change replay preserves public state');
  console.log(probe(source, 'seed')); console.log(probe(source, 'verify'));
  const saved = probe(source, 'snapshot');
  for (const action of ['bootstrap', 'stop', 'start', 'restart', 'bootstrap']) {
    console.log(cli(source, action));
    if (action !== 'stop') { assert.equal(probe(source, 'snapshot'), saved, `${action} preserves users, passwords, grants, documents and collection metadata`); console.log(probe(source, 'verify')); }
  }
  await migrate(source, sourceValues, 'unchanged'); assert.equal(probe(source, 'snapshot'), saved);
  console.log('PASS SALES-05 post-migration bootstrap and named-volume lifecycle preserve all state');
  const archive = resolve(artifacts, 'sales.archive.gz'); console.log(cli(source, 'backup', ['--database', 'sales', '--archive', archive]));
  start(target); console.log(probe(target, 'initial'));
  const restoreArgs = ['--database', 'sales', '--archive', archive, '--test-run', run, '--manifest', manifest, '--sales-checkout', checkout];
  assert.throws(() => cli(target, 'restore-sales-disposable', restoreArgs), 'unmigrated target refused');
  assert.equal(await migrate(target, targetValues, 'applied'), firstApplied); console.log(probe(target, 'baseline'));
  const targetBefore = JSON.parse(probe(target, 'snapshot'));
  const forged = resolve(artifacts, 'foreign-manifest.json');
  const foreign = JSON.parse(readFileSync(manifest, 'utf8'));
  foreign.find(item => item.project === target.project).resources.find(item => item.kind === 'container').id = '0'.repeat(64);
  writeFileSync(forged, JSON.stringify(foreign));
  assert.throws(() => cli(target, 'restore-sales-disposable', restoreArgs.map(value => value === manifest ? forged : value)), 'replaced identity refused');
  assert.throws(() => cli(target, 'restore-disposable', ['--database', 'sales', '--archive', archive, '--test-run', run]), 'ordinary empty-database guard remains strict');
  const clientsBeforeRestore = target.clients.length;
  console.log(cli(target, 'restore-sales-disposable', restoreArgs));
  assert.equal(docker(['image', 'inspect', image, '--format', '{{.Id}}']), image,
    'recovery must preserve the pinned image identity for subsequent runner calls');
  assert.ok(target.clients.length >= clientsBeforeRestore + 2, 'status and update runner client identities must survive later parent manifest saves');
  console.log(probe(target, 'verify'));
  const sourceState = JSON.parse(saved); const targetAfter = JSON.parse(probe(target, 'snapshot'));
  assert.deepEqual(targetAfter.rows, sourceState.rows); assert.deepEqual(targetAfter.metadata, sourceState.metadata);
  assert.equal(targetAfter.usersDigest, targetBefore.usersDigest);
  assert.notEqual(targetAfter.usersDigest, sourceState.usersDigest, 'target retains independent credentials and identities');
  await migrate(target, targetValues, 'unchanged'); assert.equal(probe(target, 'snapshot'), JSON.stringify(targetAfter));
  assert.throws(() => cli(target, 'restore-sales-disposable', restoreArgs), 'nonempty application collection refused');
  console.log(probe(target, 'permissions')); assert.equal(probe(source, 'snapshot'), saved);
  console.log('PASS SALES-06 source unchanged; restored data/metadata, independent users, owner migration validation and application permissions verified');
  for (const changed of [{ MONGO_ADMIN_PASSWORD: `${sourceValues.MONGO_ADMIN_PASSWORD}-wrong` }]) {
    const started = Date.now();
    await assert.rejects(() => migrate(source, { ...sourceValues, ...changed }, 'unchanged'), /Sales runner failed.*Authentication/i);
    assert.ok(Date.now() - started < 95000, 'migration failure bounded');
  }
  assert.equal(probe(source, 'snapshot'), saved);
  console.log('PASS SALES-07 sanitized incorrect migration credentials rejected without state changes');
  save(); console.log(`PASS Sales integration and recovery run ${run}`);
} catch (error) { failed = error; console.error(`FAIL Sales suite: ${error.message.split('\n')[0]}`); }
finally {
  const disposable = await import('../scripts/disposable.mjs');
  for (const current of instances) { try { disposable.capture(current); disposable.cleanup(current); } catch (error) { failed ||= error; console.error(`FAIL cleanup: ${error.message}`); } }
  save();
}
if (failed) process.exitCode = 1;
