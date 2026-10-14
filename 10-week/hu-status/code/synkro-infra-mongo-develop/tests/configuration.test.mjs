import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const config = await import('../scripts/config.mjs');
const disposable = await import('../scripts/disposable.mjs');
const valid = {
  COMPOSE_PROJECT_NAME: 'synkro-dev', MONGO_ADMIN_USER: 'operator',
  MONGO_ADMIN_PASSWORD: 'random-$!@:\\" password', SALES_APP_PASSWORD: 'different-$!@:\\" password',
  MONGO_INTERNAL_KEY: 'A'.repeat(1008), MONGO_REPLICA_SET: 'rs0',
  MONGO_STARTUP_TIMEOUT_SECONDS: '60', MONGO_CONNECT_TIMEOUT_MS: '2000',
  MONGO_NETWORK: 'platform',
};

test('CONF-01: examples declare separate projects, placeholders and complete settings', () => {
  for (const [environment, project] of [['dev', 'synkro-dev'], ['qa', 'synkro-qa'], ['main', 'synkro-main']]) {
    const values = config.parseEnvironment(readFileSync(`env/${environment}.env.example`, 'utf8'));
    assert.equal(values.COMPOSE_PROJECT_NAME, project);
    assert.equal(values.MONGO_NETWORK, 'platform');
    for (const key of Object.keys(valid)) assert.ok(values[key], key);
    assert.throws(() => config.validateConfig(values), /MONGO_ADMIN_USER/);
  }
});

test('CONF-02: passwords are literal data; environment files cannot execute or interpolate code', () => {
  assert.deepEqual(config.parseEnvironment("# comment\r\nMONGO_ADMIN_PASSWORD='a $() ! \\\" b'\r\n"),
    { MONGO_ADMIN_PASSWORD: 'a $() ! \\" b' });
  assert.throws(() => config.parseEnvironment('PASSWORD=a\nPASSWORD=b'), /duplicate/);
  assert.throws(() => config.parseEnvironment('export PASSWORD=a'), /line 1/);
});

test('CONF-03: missing secrets and invalid limits fail without echoing values', () => {
  for (const key of ['MONGO_ADMIN_USER', 'MONGO_ADMIN_PASSWORD', 'SALES_APP_PASSWORD', 'MONGO_INTERNAL_KEY']) {
    assert.throws(() => config.validateConfig({ ...valid, [key]: '' }), new RegExp(key));
  }
  for (const update of [{ MONGO_REPLICA_SET: 'other' }, { MONGO_STARTUP_TIMEOUT_SECONDS: '0' },
    { MONGO_CONNECT_TIMEOUT_MS: 'infinity' }, { MONGO_ADMIN_USER: 'sales_app' }, { MONGO_INTERNAL_KEY: 'bad' },
    { COMPOSE_PROJECT_NAME: '../escape' }]) assert.throws(() => config.validateConfig({ ...valid, ...update }));
  assert.doesNotThrow(() => config.validateConfig(valid));
});

test('CONF-04: Compose output contains scoped named storage and no passwords or host ports', () => {
  for (const project of ['synkro-dev', 'synkro-qa', 'synkro-main']) {
    const dir = mkdtempSync(join(tmpdir(), 'mongo-config-'));
    try {
      const environment = config.composeEnvironment({ ...valid, COMPOSE_PROJECT_NAME: project }, dir);
      const rendered = execFileSync('docker', ['compose', '--env-file', 'env/dev.env.example', '-f', 'compose.yml', 'config', '--format', 'json'],
        { env: { ...process.env, ...environment }, encoding: 'utf8' });
      const model = JSON.parse(rendered);
      const service = model.services['synkro-mongo'];
      assert.equal(model.name, project);
      assert.equal(service.container_name, undefined);
      assert.ok(!service.ports?.length);
      assert.equal(model.volumes['mongo-data'].name, `${project}_mongo-data`);
      assert.equal(model.volumes['mongo-config'].name, `${project}_mongo-config`);
      assert.equal(model.networks.platform.external, true);
      assert.equal(model.networks.platform.name, 'platform');
      assert.ok(service.healthcheck.test.length > 1);
      assert.match(service.image, /^mongo:7\.0.*@sha256:[a-f0-9]{64}$/);
      assert.ok(!rendered.includes(valid.MONGO_ADMIN_PASSWORD));
      assert.ok(!rendered.includes(valid.SALES_APP_PASSWORD));
      assert.ok(!rendered.includes(valid.MONGO_INTERNAL_KEY));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});

test('CONF-05: real environments, runtime secrets, keys and backups are ignored; CODEOWNERS is unchanged', () => {
  for (const path of ['.env', 'env/dev.env', 'env/qa.env', 'env/main.env', '.runtime/test/admin.json',
    'secrets/replica.key', 'backups/dump.archive', 'tests/.artifacts/run/manifest.json']) {
    execFileSync('git', ['check-ignore', '-q', path]);
  }
  // Pin the repository blob byte-for-byte. Working-tree line endings are Git's
  // checkout filters (CRLF here on Windows, LF on the Linux CI runner).
  assert.equal(createHash('sha256').update(execFileSync('git', ['show', ':.github/CODEOWNERS'])).digest('hex'),
    '90259bc8c38ab38565c6124948ad303efbca886cecd360645076b001e1136a81');
  assert.deepEqual(readFileSync('.github/CODEOWNERS'), execFileSync('git', ['cat-file', '--filters', 'HEAD:.github/CODEOWNERS']));
});

test('CONF-06: cleanup refuses persistent, unknown, replaced or foreign resources', () => {
  const identity = { project: 'synkro-infra-test-123-source', run: '123', name: 'synkro-infra-test-123-source_mongo-data', id: 'original', createdAt: 'original-time' };
  const resource = { Name: identity.name, CreatedAt: identity.createdAt, Labels: { 'io.synkro.infra.test-run': '123',
    'io.synkro.infra.disposable': 'true', 'com.docker.compose.project': identity.project, 'com.docker.compose.volume': 'mongo-data' } };
  assert.doesNotThrow(() => disposable.assertOwned(resource, identity, 'volume'));
  for (const changed of [{ ...identity, project: 'synkro-main' }, { ...identity, run: 'foreign' },
    { ...identity, name: 'other' }]) assert.throws(() => disposable.assertOwned(resource, changed, 'volume'));
  assert.throws(() => disposable.assertOwned({ ...resource, Labels: {} }, identity, 'volume'));
  assert.throws(() => disposable.assertOwned({ ...resource, CreatedAt: 'replacement-time' }, identity, 'volume'));
  assert.throws(() => disposable.assertOwned({ ...resource, Labels: { ...resource.Labels, 'com.docker.compose.volume': 'foreign' } }, identity, 'volume'));
  const container = { Id: 'replacement', Name: '/test', Config: { Labels: resource.Labels } };
  assert.throws(() => disposable.assertOwned(container, { ...identity, name: 'test' }, 'container'));
});

test('CONF-07: CLI requires an explicit file and ignores inherited secret values', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mongo-env-'));
  try {
    const path = join(directory, 'incomplete.env');
    writeFileSync(path, Object.entries({ ...valid, MONGO_ADMIN_PASSWORD: '' }).map(([key, value]) => `${key}=${value}`).join('\n'));
    const missing = spawnSync(process.execPath, ['--', 'scripts/mongo.mjs', 'validate'], { encoding: 'utf8', env: { ...process.env, ...valid } });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /required --env-file/);
    const incomplete = spawnSync(process.execPath, ['--', 'scripts/mongo.mjs', 'validate', '--env-file', path], { encoding: 'utf8', env: { ...process.env, ...valid } });
    assert.notEqual(incomplete.status, 0);
    assert.match(incomplete.stderr, /MONGO_ADMIN_PASSWORD/);
    assert.ok(!incomplete.stderr.includes(valid.SALES_APP_PASSWORD));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CONF-08: protected secret files preserve literal passwords and resist directory redirection', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mongo-secret-'));
  try {
    const runtime = config.prepareSecrets(valid, directory);
    assert.deepEqual(JSON.parse(readFileSync(join(runtime, 'admin.json'), 'utf8')), { user: valid.MONGO_ADMIN_USER, password: valid.MONGO_ADMIN_PASSWORD });
    assert.equal(readFileSync(join(runtime, 'internal-key'), 'utf8'), valid.MONGO_INTERNAL_KEY);
    if (process.platform !== 'win32') assert.equal(statSync(join(runtime, 'admin.json')).mode & 0o777, 0o600);
    const other = join(directory, '.runtime', 'synkro-qa');
    symlinkSync(runtime, other, process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => config.prepareSecrets({ ...valid, COMPOSE_PROJECT_NAME: 'synkro-qa' }, directory), /directory/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CONF-09: secret preparation creates a valid environment quietly and refuses overwrite', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mongo-new-env-'));
  try {
    const path = join(directory, 'dev.env');
    const args = ['--', 'scripts/new-environment.mjs', '--environment', 'dev', '--admin-user', 'operator', '--env-file', path];
    const output = execFileSync(process.execPath, args, { encoding: 'utf8' });
    const before = readFileSync(path, 'utf8');
    const values = config.validateConfig(config.parseEnvironment(before));
    assert.equal(values.COMPOSE_PROJECT_NAME, 'synkro-dev');
    assert.equal(values.MONGO_INTERNAL_KEY.length, 1008);
    assert.ok(!output.includes(values.MONGO_ADMIN_PASSWORD));
    assert.ok(!output.includes(values.SALES_APP_PASSWORD));
    assert.ok(!output.includes(values.MONGO_INTERNAL_KEY));
    const again = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.notEqual(again.status, 0);
    assert.equal(readFileSync(path, 'utf8'), before);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CONF-10: disposable client cleanup requires its recorded ID and exact ownership labels', () => {
  const identity = { project: 'synkro-infra-test-123-source', run: '123', name: 'synkro-infra-test-123-source-client-1', id: 'a'.repeat(64) };
  const client = { Id: identity.id, Name: `/${identity.name}`, Config: { Labels: {
    'io.synkro.infra.disposable': 'true', 'io.synkro.infra.test-run': '123',
    'io.synkro.infra.test-project': identity.project, 'io.synkro.infra.client': 'true',
  } } };
  assert.doesNotThrow(() => disposable.assertClientOwned(client, identity));
  assert.throws(() => disposable.assertClientOwned({ ...client, Id: 'replacement' }, identity));
  assert.throws(() => disposable.assertClientOwned({ ...client, Config: { Labels: {} } }, identity));
  assert.throws(() => disposable.assertClientOwned(client, { ...identity, project: 'synkro-dev' }));
});
