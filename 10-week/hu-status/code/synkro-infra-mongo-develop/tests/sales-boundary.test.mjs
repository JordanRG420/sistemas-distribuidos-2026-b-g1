import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

async function probe(action) {
  const output = [];
  const rows = [{ _id: 'fixture', opaquePublicData: true }];
  const collection = { find: () => ({ sort: () => ({ toArray: async () => rows }) }),
    findOne: async () => null, getIndexes: async () => [{ opaqueMetadata: true }] };
  const database = new Proxy({ sale: collection,
    getCollectionNames: async () => action === 'initial' ? [] : ['sale', 'renamed-owner-ledger'],
    getCollectionInfos: async () => [{ options: { opaqueMetadata: true } }] }, {
    get(target, name) {
      if (!(name in target)) throw new Error('infrastructure must not access private domain collections');
      return target[name];
    }
  });
  const admin = { auth: async () => true,
    getUser: async () => ({ roles: action === 'initial' ? [] : [{ role: 'sales_writer', db: 'sales' }] }),
    runCommand: async command => command.getParameter ? { enableTestCommands: false }
      : command.usersInfo ? { users: [{ user: 'operator' }] } : { config: { _id: 'rs0', term: 4 } } };
  const Mongo = class { getDB(name) { return name === 'admin' ? admin : database; } };
  const context = { Mongo, process: { env: { TEST_ACTION: action } },
    EJSON: { stringify: JSON.stringify }, print: value => output.push(value),
    quit: () => { throw new Error('public probe must work without Sales internals'); },
    require(name) {
      if (name === 'assert/strict') return assert;
      if (name === 'crypto') return crypto;
      if (name === 'fs') return { readFileSync(file) {
        assert.ok(['/run/secrets/admin.json', '/run/secrets/app.json'].includes(file), 'only protected credentials may be read');
        return JSON.stringify({ user: 'operator', password: 'test-only' });
      } };
      throw new Error('Sales checkout must not be available to application probes');
    } };
  await vm.runInNewContext(readFileSync(new URL('sales-probe.js', import.meta.url), 'utf8'), context);
  return output;
}
for (const action of ['initial', 'baseline', 'snapshot']) {
  test(`BOUNDARY-01: ${action} works with unavailable Sales modules and a private renamed ledger`, async () => {
    const output = await probe(action);
    if (action === 'snapshot') {
      const snapshot = JSON.parse(output[0]);
      assert.equal(snapshot.rows[0]._id, 'fixture');
      assert.deepEqual(Object.keys(snapshot).sort(), ['config', 'metadata', 'rows', 'usersDigest']);
    } else assert.match(output[0], /^PASS/);
  });
}

test('BOUNDARY-02: migration success uses the supported runner summary, independent of migration count', async () => {
  const { runnerResult } = await import('../scripts/runner-result.mjs');
  const update = count => `PASS preflight: compatible\nUPDATE SUMMARY\nRun: ${count}\nPASS postflight: compatible\n`;
  for (const count of [1, 17, 29]) assert.equal(runnerResult(update(count), 'applied'), count);
  assert.equal(runnerResult(update(0), 'unchanged'), 0);
  assert.throws(() => runnerResult(update(0), 'applied'));
  assert.throws(() => runnerResult(update(17), 'unchanged'));
  assert.throws(() => runnerResult('Run: 17', 'applied'));
  assert.throws(() => runnerResult('PASS preflight:\nPASS postflight:\nRun: invalid', 'applied'));
  assert.throws(() => runnerResult(update(1), 'unsupported'));
  assert.equal(runnerResult('The selected database is up to date.\n', 'unchanged', 'status'), 0);
  assert.equal(runnerResult('[REDACTED] is up to date\n', 'unchanged', 'status'), 0);
  assert.throws(() => runnerResult('17 changesets have not been applied', 'unchanged', 'status'));
  assert.throws(() => runnerResult('17 changesets have not been applied\nThe selected database is up to date\n', 'unchanged', 'status'));
  assert.throws(() => runnerResult(update(0) + 'Run: 17\n', 'unchanged'));
  assert.throws(() => runnerResult('Liquibase command succeeded', 'unchanged', 'status'));
});

async function emptyCollection(database, collection, { exists = true, document = null } = {}) {
  const calls = [];
  const context = { process: { env: { MONGO_TOOLS_DB: database, MONGO_TOOLS_COLLECTION: collection } },
    Mongo: class {}, print: () => {}, quit: () => { throw new Error('restoration refused'); },
    require(name) {
      assert.equal(name, '/opt/synkro/common.js', 'guard must use infrastructure authentication only');
      return { authenticated: async () => ({ connection: { getDB(name) {
        calls.push(['database', name]);
        return { getCollectionInfos: async filter => { calls.push(['exists', filter.name]); return exists ? [{}] : []; },
          getCollection(name) { calls.push(['collection', name]); return { findOne: async () => document }; } };
      } } }) };
    } };
  await vm.runInNewContext(readFileSync(new URL('../mongo/scripts/empty-collection.js', import.meta.url), 'utf8'), context);
  return calls;
}
test('BOUNDARY-03: restoration emptiness is a generic namespace safety check', async () => {
  for (const [database, collection] of [['sales', 'sale'], ['warehouse', 'events']]) {
    const calls = await emptyCollection(database, collection);
    assert.deepEqual(calls, [['database', database], ['exists', collection], ['collection', collection]]);
    await assert.rejects(emptyCollection(database, collection, { exists: false }));
    await assert.rejects(emptyCollection(database, collection, { document: { _id: 'existing' } }));
  }
  for (const [database, collection] of [['admin', 'users'], ['local', 'events'], ['sales', 'system.users'], ['sales', 'bad.name']]) {
    await assert.rejects(emptyCollection(database, collection));
  }
});
