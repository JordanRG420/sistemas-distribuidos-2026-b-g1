import { mkdirSync, lstatSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { protect } from './protect.mjs';

export function parseEnvironment(text) {
  const result = {};
  for (const [index, raw] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match) throw new Error(`invalid environment line ${index + 1}`);
    const [, name] = match;
    if (Object.hasOwn(result, name)) throw new Error(`duplicate environment variable ${name}`);
    let value = match[2].trim();
    if (/^["']/.test(value)) {
      if (value.at(-1) !== value[0] || value.length < 2) throw new Error(`invalid quoting on line ${index + 1}`);
      value = value.slice(1, -1);
    }
    result[name] = value;
  }
  return result;
}

export function validateConfig(values) {
  for (const key of ['MONGO_ADMIN_USER', 'MONGO_ADMIN_PASSWORD', 'SALES_APP_PASSWORD', 'MONGO_INTERNAL_KEY',
    'COMPOSE_PROJECT_NAME', 'MONGO_NETWORK', 'MONGO_REPLICA_SET', 'MONGO_STARTUP_TIMEOUT_SECONDS', 'MONGO_CONNECT_TIMEOUT_MS']) {
    if (!values[key] || values[key].startsWith('<') || /[\r\n\0]/.test(values[key])) throw new Error(`set ${key} to a non-placeholder value`);
  }
  if (!/^[a-z][a-z0-9_-]{0,63}$/i.test(values.MONGO_ADMIN_USER) || values.MONGO_ADMIN_USER === 'sales_app') throw new Error('invalid MONGO_ADMIN_USER (must differ from sales_app)');
  for (const key of ['MONGO_ADMIN_PASSWORD', 'SALES_APP_PASSWORD']) {
    if (values[key].length < 20) throw new Error(`use at least 20 characters for ${key}`);
  }
  if (values.MONGO_ADMIN_PASSWORD === values.SALES_APP_PASSWORD) throw new Error('use different administrator and application passwords');
  if (!/^[A-Za-z0-9+/=]{40,1024}$/.test(values.MONGO_INTERNAL_KEY)) throw new Error('invalid MONGO_INTERNAL_KEY: expected 40–1024 base64 characters');
  if (values.MONGO_REPLICA_SET !== 'rs0') throw new Error('MONGO_REPLICA_SET must be rs0');
  for (const [key, minimum, maximum] of [['MONGO_STARTUP_TIMEOUT_SECONDS', 10, 300], ['MONGO_CONNECT_TIMEOUT_MS', 500, 3000]]) {
    if (!/^\d+$/.test(values[key]) || Number(values[key]) < minimum || Number(values[key]) > maximum) throw new Error(`invalid ${key}: expected ${minimum}–${maximum}`);
  }
  for (const key of ['COMPOSE_PROJECT_NAME', 'MONGO_NETWORK']) {
    if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(values[key])) throw new Error(`invalid ${key}`);
  }
  if (values.MONGO_DISPOSABLE === 'true') {
    if (!/^synkro-infra-test-[a-z0-9-]+-(source|restore|bad)$/.test(values.COMPOSE_PROJECT_NAME) ||
      !/^[a-z0-9-]+$/.test(values.MONGO_TEST_RUN || '') || values.MONGO_NETWORK !== values.COMPOSE_PROJECT_NAME) throw new Error('disposable runs require an exclusive test project, network and run identity');
  } else if (!['synkro-dev', 'synkro-qa', 'synkro-main'].includes(values.COMPOSE_PROJECT_NAME) || values.MONGO_NETWORK !== 'platform') {
    throw new Error('persistent configuration requires synkro-dev, synkro-qa or synkro-main and platform');
  }
  return values;
}

export function composeEnvironment(values, directory) {
  return {
    COMPOSE_PROJECT_NAME: values.COMPOSE_PROJECT_NAME, COMPOSE_DISABLE_ENV_FILE: '1',
    MONGO_NETWORK: values.MONGO_NETWORK, MONGO_REPLICA_SET: values.MONGO_REPLICA_SET,
    MONGO_STARTUP_TIMEOUT_SECONDS: values.MONGO_STARTUP_TIMEOUT_SECONDS,
    MONGO_CONNECT_TIMEOUT_MS: values.MONGO_CONNECT_TIMEOUT_MS,
    MONGO_SECRET_DIR: resolve(directory).replaceAll('\\', '/'),
    MONGO_DISPOSABLE: values.MONGO_DISPOSABLE === 'true' ? 'true' : 'false',
    MONGO_TEST_RUN: values.MONGO_TEST_RUN || 'persistent',
  };
}

export function prepareSecrets(values, root) {
  validateConfig(values);
  const base = resolve(root, '.runtime');
  const directory = join(base, values.COMPOSE_PROJECT_NAME);
  for (const path of [base, directory]) {
    if (existsSync(path) && (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory())) throw new Error('runtime secret directory must be a real directory');
    mkdirSync(path, { recursive: true, mode: 0o700 });
    protect(path, true);
  }
  for (const [file, content] of [['admin.json', JSON.stringify({ user: values.MONGO_ADMIN_USER, password: values.MONGO_ADMIN_PASSWORD })],
    ['app.json', JSON.stringify({ user: 'sales_app', password: values.SALES_APP_PASSWORD })], ['internal-key', values.MONGO_INTERNAL_KEY]]) {
    const path = join(directory, file);
    if (existsSync(path) && (lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile())) throw new Error('runtime secrets must be regular files');
    // Preserve the inode of bind-mounted secrets; updates remain visible to an
    // explicit bootstrap check, which rejects password/key changes, never rotates.
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) writeFileSync(path, content, { mode: 0o600 });
    protect(path);
  }
  return directory;
}
