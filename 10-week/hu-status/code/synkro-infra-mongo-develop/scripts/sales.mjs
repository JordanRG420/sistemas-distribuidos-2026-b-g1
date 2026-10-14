import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { docker, inspect } from './docker.mjs';
import { assertOwned, assertClientOwned } from './disposable.mjs';
import { validateConfig } from './config.mjs';
import { runnerResult } from './runner-result.mjs';

export const SALES_SHA = '9cfbde7db4bea7bacad70370c60f91f8eb917c04';
const imageName = `synkro-infra-sales-runner:${SALES_SHA}`;
const encode = value => encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
export function verifyCheckout(checkout) {
  try {
    const git = args => execFileSync('git', ['--no-optional-locks', '-C', checkout, ...args], { encoding: 'utf8', timeout: 10000 }).trim();
    if (git(['rev-parse', 'HEAD']) !== SALES_SHA || git(['status', '--porcelain'])) throw new Error('revision');
    for (const file of ['deploy/migrate.sh', 'deploy/liquibase.Dockerfile', 'deploy/compose.yml']) readFileSync(resolve(checkout, file));
  } catch { throw new Error(`Sales requires a clean read-only checkout at ${SALES_SHA}`); }
  return checkout;
}
export function buildRunner(checkout) {
  verifyCheckout(checkout);
  // The owner's unchanged Dockerfile installs its pinned Liquibase/extension/driver.
  docker(['build', '--label', `io.synkro.infra.sales-revision=${SALES_SHA}`, '-t', imageName,
    '-f', resolve(checkout, 'deploy/liquibase.Dockerfile'), resolve(checkout, 'deploy')], { timeout: 300000 });
  return docker(['image', 'inspect', imageName, '--format', '{{.Id}}']).trim();
}
export function assertRecordedInstance(instance, values) {
  if (instance.project !== values.COMPOSE_PROJECT_NAME || instance.network !== values.MONGO_NETWORK ||
    instance.run !== values.MONGO_TEST_RUN || values.MONGO_DISPOSABLE !== 'true' || instance.resources.length !== 4) {
    throw new Error('operation requires the exact recorded disposable infrastructure target');
  }
  for (const [kind, name] of [['network', instance.network], ['container', `${instance.project}-synkro-mongo-1`],
    ['volume', `${instance.project}_mongo-data`], ['volume', `${instance.project}_mongo-config`]]) {
    const identity = instance.resources.find(item => item.kind === kind && item.name === name && !item.removed);
    if (!identity) throw new Error('missing recorded disposable resource identity');
    assertOwned(inspect(kind, name), { ...identity, project: instance.project, run: instance.run }, kind);
  }
}
export function recordedTarget(manifest, values) {
  const instances = JSON.parse(readFileSync(manifest, 'utf8'));
  const matches = instances.filter(item => item.project === values.COMPOSE_PROJECT_NAME && item.run === values.MONGO_TEST_RUN);
  if (matches.length !== 1) throw new Error('manifest must identify exactly one disposable target');
  assertRecordedInstance(matches[0], values);
  return { instance: matches[0], save: () => writeFileSync(manifest, JSON.stringify(instances, null, 2)) };
}
function secretVariants(values, uri) {
  const secrets = [values.MONGO_ADMIN_PASSWORD, values.SALES_APP_PASSWORD, values.MONGO_INTERNAL_KEY, uri].filter(Boolean);
  return secrets.flatMap(value => [value, encodeURIComponent(value), encode(value), encodeURIComponent(encodeURIComponent(value))]);
}
function assertSafe(text, values, uri) {
  if (secretVariants(values, uri).some(secret => text.includes(secret)) || /mongodb(?:\+srv)?:\/\/[^\s/]+:[^\s@]+@/i.test(text)) {
    throw new Error('credential exposure detected; raw diagnostics withheld');
  }
}
function clientIdentity(instance, save) {
  const name = `${instance.project}-client-${randomUUID()}`;
  const client = { name, cidFile: resolve('.runtime', instance.project, `${name}.cid`) };
  (instance.clients ||= []).push(client); save(); return client;
}
function clientArgs(instance, client) {
  return ['--name', client.name, '--cidfile', client.cidFile, '--network', instance.network,
    '--label', 'io.synkro.infra.client=true', '--label', 'io.synkro.infra.disposable=true',
    '--label', `io.synkro.infra.test-run=${instance.run}`, '--label', `io.synkro.infra.test-project=${instance.project}`];
}
function removeClient(instance, client, save) {
  if (!client.id && existsSync(client.cidFile)) client.id = readFileSync(client.cidFile, 'utf8').trim();
  const resource = inspect('container', client.name);
  if (resource) {
    assertClientOwned(resource, { ...client, project: instance.project, run: instance.run });
    docker(['container', 'rm', '-f', client.id]);
  }
  client.removed = true; save();
}
export async function runSales({ instance, values, checkout, image, save, expected, command = 'update' }) {
  if (!['applied', 'unchanged'].includes(expected) || !['update', 'status'].includes(command) ||
    (command === 'status' && expected !== 'unchanged')) throw new Error('unsupported Sales runner operation');
  validateConfig(values); verifyCheckout(checkout); assertRecordedInstance(instance, values);
  if (!/^sha256:[a-f0-9]{64}$/.test(image)) throw new Error('use the exact built Sales image identity');
  const metadata = JSON.parse(docker(['image', 'inspect', image, '--format',
    '{"id":{{json .Id}},"revision":{{json (index .Config.Labels "io.synkro.infra.sales-revision")}},"entrypoint":{{json .Config.Entrypoint}}}']));
  if (image !== instance.salesImage || metadata.id !== image || metadata.revision !== SALES_SHA ||
    JSON.stringify(metadata.entrypoint) !== JSON.stringify(['bash', '/liquibase/changelog-root/deploy/migrate.sh'])) {
    throw new Error('Sales runner must retain the recorded pinned image and supported entrypoint');
  }
  const uri = `mongodb://${encode(values.MONGO_ADMIN_USER)}:${encode(values.MONGO_ADMIN_PASSWORD)}@synkro-mongo:27017/sales?replicaSet=rs0&authSource=admin&serverSelectionTimeoutMS=2000&connectTimeoutMS=2000&socketTimeoutMS=5000`;
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(LIQUIBASE_|MONGODB_|JAVA_|JDK_|_JAVA_)/i.test(name)));
  Object.assign(env, { LIQUIBASE_COMMAND_URL: uri, LIQUIBASE_COMMAND_CHANGELOG_FILE: 'changelog/changelog-master.yaml', LIQUIBASE_LOG_LEVEL: 'info' });
  const server = instance.resources.find(item => item.kind === 'container').id;
  docker(['exec', server, 'bash', '/opt/synkro/health.sh'], { timeout: 16000 });
  const client = clientIdentity(instance, save);
  const observed = new Set(); let exposure; let output = ''; let timedOut = false;
  try {
    client.id = docker(['create', ...clientArgs(instance, client), '--tmpfs', '/tmp:mode=1777',
      '-e', 'LIQUIBASE_COMMAND_URL', '-e', 'LIQUIBASE_COMMAND_CHANGELOG_FILE', '-e', 'LIQUIBASE_LOG_LEVEL',
      '-v', `${resolve(checkout)}:/liquibase/changelog-root:ro`, '--workdir', '/liquibase/changelog-root', image, command], { env }).trim();
    save();
    const status = await new Promise((complete, reject) => {
      const child = spawn('docker', ['start', '-a', client.id], { env, stdio: ['ignore', 'pipe', 'pipe'] });
      const collect = chunk => { output += chunk.toString(); if (output.length > 8 * 1024 * 1024) { exposure = new Error('Sales diagnostic limit exceeded'); child.kill(); } };
      child.stdout.on('data', collect); child.stderr.on('data', collect);
      const sample = setInterval(() => {
        try {
          const args = docker(['top', client.id, '-eo', 'pid,args'], { timeout: 2000 }); assertSafe(args, values, uri);
          for (const name of ['bash', 'mongosh', 'java']) if (new RegExp(`(?:^|[ /])${name}(?:[ \\n]|$)`, 'm').test(args)) observed.add(name);
        } catch (error) { if (/exposure/.test(error.message)) { exposure = error; child.kill(); } }
      }, 250);
      const deadline = setTimeout(() => { timedOut = true; child.kill(); }, 90000);
      child.on('error', error => { clearInterval(sample); clearTimeout(deadline); reject(error); });
      child.on('close', code => { clearInterval(sample); clearTimeout(deadline); complete(code); });
    });
    assertSafe(output, values, uri); assertSafe(docker(['logs', client.id]), values, uri);
    if (exposure) throw exposure;
    if (timedOut) throw new Error('Sales runner exceeded its 90-second deadline');
    if (status !== 0) {
      const classification = output.match(/Authentication\w*|MongoServerSelectionError|MongoNetworkError|MongoTimeoutException|incompatible[^\n]{0,120}|DiagnosticError/);
      throw new Error(`Sales runner failed (${status}): ${classification?.[0] || 'supported runner rejected the operation'}`);
    }
    const applied = runnerResult(output, expected, command);
    if (['bash', 'mongosh', 'java'].some(name => !observed.has(name))) throw new Error('missing real Sales process observation');
    console.log(`PASS Sales supported runner: ${command}; ${applied} changes; ${command === 'update' ? 'preflight/postflight' : 'up to date'}; bash/mongosh/java arguments and logs free of credentials`);
    return applied;
  } finally { removeClient(instance, client, save); }
}
