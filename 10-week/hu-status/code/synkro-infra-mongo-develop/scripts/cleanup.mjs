// Explicit recovery of manifests from interrupted DISPOSABLE tests only.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { capture, cleanup } from './disposable.mjs';
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--manifests-dir') throw new Error('required --manifests-dir tests/.artifacts');
  const directory = resolve(args[1]);
  if (existsSync(directory)) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
      const path = resolve(directory, entry.name, 'manifest.json');
      if (!existsSync(path)) continue;
      const instances = JSON.parse(readFileSync(path, 'utf8'));
      for (const instance of instances) { capture(instance); cleanup(instance); }
      writeFileSync(path, JSON.stringify(instances, null, 2));
    }
  }
} catch (error) { console.error(`cleanup refused or failed: ${error.message}`); process.exitCode = 1; }
