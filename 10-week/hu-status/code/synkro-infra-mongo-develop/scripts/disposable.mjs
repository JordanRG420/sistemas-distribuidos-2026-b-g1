import { docker, inspect, MONGO_IMAGE } from './docker.mjs';
import { existsSync, readFileSync } from 'node:fs';
export { MONGO_IMAGE };
export function assertClientOwned(resource, identity) {
  const labels = resource?.Config?.Labels;
  if (!/^synkro-infra-test-[a-z0-9-]+-(source|restore|bad)$/.test(identity.project) ||
    !/^[a-f0-9]{64}$/.test(identity.id || '') || resource?.Id !== identity.id ||
    resource?.Name !== `/${identity.name}` || !identity.name.startsWith(`${identity.project}-client-`) ||
    labels?.['io.synkro.infra.client'] !== 'true' || labels?.['io.synkro.infra.disposable'] !== 'true' ||
    labels?.['io.synkro.infra.test-project'] !== identity.project || labels?.['io.synkro.infra.test-run'] !== identity.run) {
    throw new Error('refusing cleanup of unknown or replaced disposable client');
  }
}
export function assertOwned(resource, identity, kind) {
  const labels = kind === 'container' ? resource.Config?.Labels : resource.Labels;
  if (!/^synkro-infra-test-[a-z0-9-]+-(source|restore|bad)$/.test(identity.project) ||
    !resource || labels?.['io.synkro.infra.disposable'] !== 'true' ||
    labels?.['io.synkro.infra.test-run'] !== identity.run ||
    labels?.['com.docker.compose.project'] !== identity.project ||
    resource.Name.replace(/^\//, '') !== identity.name ||
    (kind === 'container' && labels?.['com.docker.compose.service'] !== 'synkro-mongo') ||
    (kind === 'volume' && (resource.CreatedAt !== identity.createdAt ||
      !['mongo-data', 'mongo-config'].includes(labels?.['com.docker.compose.volume']) ||
      identity.name !== `${identity.project}_${labels['com.docker.compose.volume']}`)) ||
    (kind !== 'volume' && resource.Id !== identity.id)) throw new Error('refusing operation on unknown, replaced or non-disposable resource');
}
export function createNetwork(instance) {
  docker(['info', '--format', '{{.ServerVersion}}']);
  for (const [kind, name] of [['network', instance.network], ['volume', `${instance.project}_mongo-data`], ['volume', `${instance.project}_mongo-config`]]) {
    if (inspect(kind, name)) throw new Error(`refusing preexisting disposable ${kind}: ${name}`);
  }
  if (docker(['ps', '-a', '--filter', `label=com.docker.compose.project=${instance.project}`, '--format', '{{.ID}}']).trim()) throw new Error('refusing preexisting test project');
  const id = docker(['network', 'create', '--label', 'io.synkro.infra.disposable=true', '--label', `io.synkro.infra.test-run=${instance.run}`,
    '--label', `com.docker.compose.project=${instance.project}`, instance.network]).trim();
  instance.resources.push({ kind: 'network', name: instance.network, id });
}
export function capture(instance) {
  // A successful daemon inventory proves absent client names without running
  // three failed-inspect/availability/list commands for every completed client.
  const clientNames = new Set(docker(['ps', '-a', '--format', '{{.Names}}']).trim().split('\n'));
  for (const client of instance.clients || []) {
    if (!client.id && existsSync(client.cidFile)) client.id = readFileSync(client.cidFile, 'utf8').trim();
    const resource = clientNames.has(client.name) ? inspect('container', client.name) : null;
    if (resource) assertClientOwned(resource, { ...client, project: instance.project, run: instance.run });
    else client.removed = true;
  }
  if (!instance.resources.some(resource => resource.kind === 'network')) return;
  const containers = docker(['ps', '-a', '--filter', `label=com.docker.compose.project=${instance.project}`, '--format', '{{.Names}}']).trim();
  for (const [kind, name] of [...containers.split('\n').filter(Boolean).map(name => ['container', name]),
    ['volume', `${instance.project}_mongo-data`], ['volume', `${instance.project}_mongo-config`]]) {
    const resource = inspect(kind, name);
    if (!resource) continue;
    const recorded = instance.resources.find(item => item.kind === kind && item.name === name);
    const identity = { project: instance.project, run: instance.run, name, id: recorded?.id || resource.Id || name,
      createdAt: recorded?.createdAt || resource.CreatedAt };
    assertOwned(resource, identity, kind);
    if (!recorded) instance.resources.push({ kind, name, id: identity.id, ...(kind === 'volume' ? { createdAt: identity.createdAt } : {}) });
  }
}
export function cleanup(instance) {
  // Validate ALL extant identities before removing anything. Never compose down -v.
  for (const item of instance.resources) {
    const resource = inspect(item.kind, item.name);
    if (resource) assertOwned(resource, { ...item, project: instance.project, run: instance.run }, item.kind);
  }
  const clientNames = new Set(docker(['ps', '-a', '--format', '{{.Names}}']).trim().split('\n'));
  for (const client of instance.clients || []) {
    const resource = clientNames.has(client.name) ? inspect('container', client.name) : null;
    if (resource) assertClientOwned(resource, { ...client, project: instance.project, run: instance.run });
  }
  for (const client of instance.clients || []) {
    // Removal uses the validated immutable ID, never the reusable name.
    if (clientNames.has(client.name)) docker(['container', 'rm', '-f', client.id]);
    client.removed = true;
  }
  for (const kind of ['container', 'volume', 'network']) {
    for (const item of instance.resources.filter(item => item.kind === kind)) {
      if (!inspect(kind, item.name)) continue;
      docker([kind, 'rm', ...(kind === 'container' ? ['-f'] : []), kind === 'volume' ? item.name : item.id]);
      item.removed = true;
      console.log(`CLEANED ${kind} ${item.name} (${item.id})`);
    }
  }
}
