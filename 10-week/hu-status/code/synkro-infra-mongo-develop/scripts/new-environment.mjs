import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { validateConfig } from './config.mjs';
import { protect } from './protect.mjs';
try {
  const args = process.argv.slice(2);
  function option(name) {
    const index = args.indexOf(name);
    if (index < 0 || !args[index + 1]) throw new Error(`required ${name}`);
    return args[index + 1];
  }
  const environment = option('--environment');
  if (!['dev', 'qa', 'main'].includes(environment)) throw new Error('environment must be dev, qa or main');
  const values = validateConfig({
    COMPOSE_PROJECT_NAME: `synkro-${environment}`, MONGO_NETWORK: 'platform',
    MONGO_ADMIN_USER: option('--admin-user'), MONGO_ADMIN_PASSWORD: randomBytes(32).toString('base64url'),
    SALES_APP_PASSWORD: randomBytes(32).toString('base64url'), MONGO_INTERNAL_KEY: randomBytes(756).toString('base64'),
    MONGO_REPLICA_SET: 'rs0', MONGO_STARTUP_TIMEOUT_SECONDS: '60', MONGO_CONNECT_TIMEOUT_MS: '2000',
  });
  const path = resolve(option('--env-file'));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  protect(path);
  console.log(`protected ${environment} environment prepared; secrets were not printed`);
} catch (error) {
  console.error(error.code === 'EEXIST' ? 'environment file already exists; no secrets replaced' : `environment preparation failed: ${error.message}`);
  process.exitCode = 1;
}
