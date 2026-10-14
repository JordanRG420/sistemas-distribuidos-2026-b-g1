import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const run = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const artifacts = resolve('tests/.artifacts', run);
mkdirSync(artifacts, { recursive: true });
const secrets = Array.from({ length: 4 }, () => randomBytes(24).toString('base64') + '$!@:\\" space');
const keys = [randomBytes(756).toString('base64'), randomBytes(756).toString('base64')];
const key = keys[0];
const root = resolve('.');
function execute(program, args, timeout = 180000) {
  return execFileSync(program, args, { encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'] });
}
function cli(file, operation, extra = []) {
  return execute(process.execPath, ['--', 'scripts/mongo.mjs', operation, '--env-file', file, ...extra]);
}
function docker(args) { return execute('docker', args); }
function resource(stage) {
  const project = `synkro-infra-test-${run}-${stage}`;
  const file = resolve(artifacts, `${stage}.env`);
  const index = stage === 'source' ? 0 : 1;
  writeFileSync(file, `COMPOSE_PROJECT_NAME=${project}\nMONGO_NETWORK=${project}\nMONGO_ADMIN_USER=${index ? 'restore_operator' : 'infra_operator'}\nMONGO_ADMIN_PASSWORD='${secrets[index * 2]}'\nSALES_APP_PASSWORD='${secrets[index * 2 + 1]}'\nMONGO_INTERNAL_KEY=${keys[index]}\nMONGO_REPLICA_SET=rs0\nMONGO_STARTUP_TIMEOUT_SECONDS=60\nMONGO_CONNECT_TIMEOUT_MS=1000\nMONGO_TEST_RUN=${run}\nMONGO_DISPOSABLE=true\n`, { mode: 0o600 });
  return { project, file, run, network: project, resources: [] };
}
const instances = [];
let failure;
try {
  // Import only after recording this script's existence; red execution fails on
  // the missing implementation and cannot touch Docker resources.
  const disposable = await import('../scripts/disposable.mjs');
  const { inspect } = await import('../scripts/docker.mjs');
  const source = resource('source'); instances.push(source);
  const target = resource('restore'); instances.push(target);
  function prepare(instance) {
    disposable.createNetwork(instance);
    writeFileSync(resolve(artifacts, 'manifest.json'), JSON.stringify(instances, null, 2));
    console.log(cli(instance.file, 'start').trim());
    disposable.capture(instance);
    writeFileSync(resolve(artifacts, 'manifest.json'), JSON.stringify(instances, null, 2));
  }
  let clientSequence = 0;
  function probe(instance, action) {
    const runtime = resolve('.runtime', instance.project);
    const number = ++clientSequence;
    const client = { name: `${instance.project}-client-${number}`, cidFile: resolve(artifacts, `client-${number}.cid`) };
    (instance.clients ||= []).push(client);
    writeFileSync(resolve(artifacts, 'manifest.json'), JSON.stringify(instances, null, 2));
    try {
      return docker(['run', '--rm', '--name', client.name, '--cidfile', client.cidFile,
      '--network', instance.network, '--tmpfs', '/data/db', '--tmpfs', '/data/configdb', '--label', `io.synkro.infra.test-run=${run}`,
      '--label', `io.synkro.infra.test-project=${instance.project}`, '--label', 'io.synkro.infra.client=true',
      '--label', 'io.synkro.infra.disposable=true', '-e', `TEST_ACTION=${action}`, '-e', 'MONGO_CONNECT_TIMEOUT_MS=1000',
      '-v', `${runtime}:/run/secrets:ro`, '-v', `${root}/tests:/tests:ro`, '--entrypoint', 'mongosh',
      disposable.MONGO_IMAGE, '--nodb', '--quiet', '--file', '/tests/probe.js']).trim();
    } finally {
      if (existsSync(client.cidFile)) client.id = readFileSync(client.cidFile, 'utf8').trim();
      const resource = inspect('container', client.name);
      if (resource) disposable.assertClientOwned(resource, { ...client, project: instance.project, run });
      else client.removed = true;
      writeFileSync(resolve(artifacts, 'manifest.json'), JSON.stringify(instances, null, 2));
    }
  }
  prepare(source);
  console.log(probe(source, 'initial'));
  console.log(probe(source, 'unauthenticated'));
  console.log(probe(source, 'wrong-admin'));
  console.log(probe(source, 'wrong-app'));
  const first = probe(source, 'snapshot');
  console.log(cli(source.file, 'bootstrap').trim());
  assert.equal(probe(source, 'snapshot'), first, 'bootstrap must preserve users/password hashes and configuration');
  console.log(probe(source, 'insert'));
  const withFixtureGrant = probe(source, 'snapshot');
  console.log(cli(source.file, 'bootstrap').trim());
  assert.equal(probe(source, 'snapshot'), withFixtureGrant, 'bootstrap must preserve the independent fixture grant');
  console.log(probe(source, 'verify'));
  const originalVolume = docker(['volume', 'inspect', `${source.project}_mongo-data`, '--format', '{{.CreatedAt}}']);
  const originalId = docker(['ps', '-q', '--filter', `label=com.docker.compose.project=${source.project}`]).trim();
  const originalKey = docker(['exec', originalId, 'sha256sum', '/data/db/.replica-key']);
  assert.equal(docker(['exec', originalId, 'stat', '-c', '%a %U', '/data/db/.replica-key']).trim(), '400 mongodb');
  console.log(cli(source.file, 'stop').trim());
  console.log(cli(source.file, 'start').trim());
  assert.equal(docker(['volume', 'inspect', `${source.project}_mongo-data`, '--format', '{{.CreatedAt}}']), originalVolume);
  assert.equal(probe(source, 'snapshot'), withFixtureGrant);
  assert.equal(docker(['exec', originalId, 'sha256sum', '/data/db/.replica-key']), originalKey);
  console.log(probe(source, 'verify'));
  console.log(cli(source.file, 'restart').trim());
  assert.equal(probe(source, 'snapshot'), withFixtureGrant);
  console.log(probe(source, 'verify'));
  const archive = resolve(artifacts, 'infra-fixture.archive.gz');
  console.log(cli(source.file, 'backup', ['--database', 'infra_fixture', '--archive', archive]).trim());
  prepare(target);
  console.log(probe(target, 'initial'));
  console.log(cli(target.file, 'restore-disposable', ['--database', 'infra_fixture', '--archive', archive, '--test-run', run]).trim());
  console.log(probe(target, 'verify'));
  console.log(probe(target, 'restore-users'));
  console.log(probe(source, 'verify'));
  console.log(probe(source, 'step-down'));
  assert.throws(() => cli(source.file, 'health'), 'non-PRIMARY must fail health');
  const started = Date.now();
  assert.throws(() => cli(source.file, 'wait', ['--timeout-seconds', '2']));
  assert.ok(Date.now() - started < 10000, 'bounded wait must terminate');
  console.log('PASS non-PRIMARY health and bounded wait');
  console.log(cli(source.file, 'wait', ['--timeout-seconds', '40']).trim());
  const mismatch = readFileSync(source.file, 'utf8').replace(secrets[1], 'changed-disposable-password');
  const mismatchFile = resolve(artifacts, 'mismatch.env'); writeFileSync(mismatchFile, mismatch, { mode: 0o600 });
  assert.throws(() => cli(mismatchFile, 'bootstrap'), /MONGO|bootstrap|credential|password/i);
  cli(source.file, 'bootstrap');
  assert.equal(probe(source, 'snapshot'), withFixtureGrant);
  console.log('PASS password mismatch rejected without rotation');
  const badAdminFile = resolve(artifacts, 'admin-mismatch.env');
  writeFileSync(badAdminFile, readFileSync(source.file, 'utf8').replace(secrets[0], 'changed-administrator-password'), { mode: 0o600 });
  assert.throws(() => cli(badAdminFile, 'bootstrap'));
  assert.throws(() => cli(badAdminFile, 'health'));
  cli(source.file, 'bootstrap');
  assert.equal(probe(source, 'snapshot'), withFixtureGrant);
  const badKeyFile = resolve(artifacts, 'key-mismatch.env');
  writeFileSync(badKeyFile, readFileSync(source.file, 'utf8').replace(key, randomBytes(756).toString('base64')), { mode: 0o600 });
  cli(source.file, 'stop');
  assert.throws(() => cli(badKeyFile, 'start'));
  assert.throws(() => cli(badKeyFile, 'health'));
  cli(source.file, 'start');
  assert.equal(probe(source, 'snapshot'), withFixtureGrant);
  assert.equal(docker(['exec', originalId, 'sha256sum', '/data/db/.replica-key']), originalKey);
  console.log('PASS administrator mismatch and internal-key replacement rejected');
  for (const instance of instances) {
    disposable.capture(instance);
    const id = instance.resources.find(resource => resource.kind === 'container').id;
    const logs = docker(['logs', id]);
    const args = docker(['top', id, '-eo', 'pid,args']);
    for (const secret of [...secrets, ...keys]) {
      assert.ok(!logs.includes(secret), 'logs must not contain secrets');
      assert.ok(!args.includes(secret), 'process arguments must not contain secrets');
    }
  }
  console.log('PASS secrets absent from logs and running process arguments');
  console.log(probe(target, 'drift'));
  assert.throws(() => cli(target.file, 'bootstrap'));
  assert.throws(() => cli(target.file, 'health'));
  assert.throws(() => cli(target.file, 'restart'));
  console.log('PASS incompatible state and failed startup rejected');
  console.log('PASS independent infrastructure suite; Sales domain verification runs in tests/sales-integration.mjs');
} catch (error) {
  failure = error;
  // No Docker inspection dumps or raw stderr: they can contain environment data.
  console.error(`FAIL infrastructure suite: ${error.message.split('\n')[0]}`);
  if (error.name === 'AssertionError') console.error(error.message);
  if (error.stderr) console.error(String(error.stderr).trim());
  if (error.stdout) {
    let message = String(error.stdout);
    for (const secret of [...secrets, ...keys]) message = message.replaceAll(secret, '[REDACTED]').replaceAll(encodeURIComponent(secret), '[REDACTED]');
    console.error(message.trim());
  }
  for (const instance of instances) {
    const names = docker(['ps', '-a', '--filter', `label=com.docker.compose.project=${instance.project}`, '--format', '{{.ID}}']).trim();
    for (const id of names.split('\n').filter(Boolean)) {
      const safe = docker(['logs', id]).split('\n').filter(line => /^(bootstrap |MongoDB initialization |MONGO_INTERNAL_KEY |persistent database )/.test(line));
      safe.forEach(line => console.error(line));
    }
  }
} finally {
  if (instances.length) {
    const disposable = await import('../scripts/disposable.mjs');
    for (const instance of instances) {
      try { disposable.capture(instance); disposable.cleanup(instance); }
      catch (error) { failure ||= error; console.error(`FAIL cleanup: ${error.message}`); }
    }
    writeFileSync(resolve(artifacts, 'manifest.json'), JSON.stringify(instances, null, 2));
  }
}
if (failure) process.exitCode = 1;
