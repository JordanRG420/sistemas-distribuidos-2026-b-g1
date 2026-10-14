// Infrastructure-only fixture. Never creates Sales domain objects or a validator.
const fs = require('fs');
const assert = require('assert/strict');
// Shell documents/arrays cross VM realms. Compare exact serialized values so
// Node's prototype identity check does not reject equal MongoDB results.
function equal(actual, expected, message) { assert.equal(JSON.stringify(actual), JSON.stringify(expected), message); }
(async () => {
  try {
    const timeout = Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 2000);
    const uri = `mongodb://${process.env.MONGO_CLIENT_HOST || 'synkro-mongo'}:27017/admin?replicaSet=rs0&serverSelectionTimeoutMS=${timeout}&connectTimeoutMS=${timeout}&socketTimeoutMS=${timeout}`;
    const connection = await new Mongo(uri);
    const admin = connection.getDB('admin');
    const credentials = JSON.parse(fs.readFileSync('/run/secrets/admin.json', 'utf8'));
    const app = JSON.parse(fs.readFileSync('/run/secrets/app.json', 'utf8'));
    const mode = process.env.TEST_ACTION;
    if (mode === 'wrong-admin' || mode === 'wrong-app') {
      const user = mode === 'wrong-admin' ? credentials.user : app.user;
      let rejected = false;
      try { rejected = !(await admin.auth(user, 'incorrect-disposable-password')); } catch { rejected = true; }
      assert.ok(rejected, 'incorrect credentials must fail');
    } else if (mode === 'unauthenticated') {
      let denied = false;
      try { await connection.getDB('infra_fixture').records.findOne({}); } catch (error) { denied = error.code === 13; }
      assert.ok(denied, 'unauthenticated remote operations must fail');
    } else {
      assert.ok(await admin.auth(credentials.user, credentials.password));
      const hello = await admin.hello();
      assert.equal(hello.setName, 'rs0');
      assert.equal(hello.isWritablePrimary, true);
      equal(hello.hosts, ['synkro-mongo:27017']);
      const database = connection.getDB('infra_fixture');
      if (mode === 'initial') {
        const user = await admin.getUser('sales_app');
        equal(user.roles, []);
        assert.equal((await connection.getDB('sales').getCollectionNames()).length, 0);
        assert.equal((await connection.getDB('sales').runCommand({ rolesInfo: 1 })).roles.length, 0);
        const appConnection = await new Mongo(uri);
        const appAdmin = appConnection.getDB('admin');
        assert.ok(await appAdmin.auth(app.user, app.password));
        let denied = false;
        try { await appConnection.getDB('infra_fixture').records.findOne({}); } catch (error) { denied = error.code === 13; }
        assert.ok(denied, 'unmigrated app must have no domain privileges');
      } else if (mode === 'insert') {
        assert.equal(await database.records.countDocuments({}), 0);
        await database.records.insertMany([
          { _id: '11111111-1111-4111-8111-111111111111', value: Long('1234567890123'), quantity: Int32(2),
            date: new Date('2026-10-11T00:00:00Z'), active: true },
          { _id: '22222222-2222-4222-8222-222222222222', value: Long('999'), quantity: Int32(3),
            date: new Date('2026-10-11T00:00:00Z'), active: false },
        ]);
        // A built-in role on the temporary infrastructure database tests generic
        // grant preservation. This is NOT a Sales migration or permission check.
        await admin.grantRolesToUser('sales_app', [{ role: 'read', db: 'infra_fixture' }]);
      } else if (mode === 'verify') {
        const rows = await database.records.find({}).sort({ _id: 1 }).toArray();
        assert.equal(rows.length, 2);
        equal(rows.map(row => row._id), ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']);
        equal(rows.map(row => row.value.toString()), ['1234567890123', '999']);
        equal(rows.map(row => Number(row.quantity)), [2, 3]);
        equal(rows.map(row => row.active), [true, false]);
        assert.ok(rows.every(row => row.date.toISOString() === '2026-10-11T00:00:00.000Z'));
        const types = await database.records.aggregate([{ $project: { value: { $type: '$value' }, quantity: { $type: '$quantity' } } }]).toArray();
        assert.ok(types.every(row => row.value === 'long' && row.quantity === 'int'));
      } else if (mode === 'snapshot') {
        const cfg = await admin.runCommand({ replSetGetConfig: 1 });
        // Election term changes on restart; preserve and compare every actual
        // configuration field, including version and replicaSetId.
        delete cfg.config.term;
        const users = await admin.runCommand({ usersInfo: 1, showCredentials: true });
        // Only a digest of user credential metadata is emitted; never the hashes.
        const crypto = require('crypto');
        const digest = crypto.createHash('sha256').update(EJSON.stringify(users.users)).digest('hex');
        print(JSON.stringify({ config: cfg.config, usersDigest: digest,
          grants: (await admin.getUser('sales_app')).roles }));
        return;
      } else if (mode === 'restore-users') {
        equal((await admin.getUser('sales_app')).roles, [], 'data-only restore must not copy source users/grants');
      } else if (mode === 'step-down') {
        try { await admin.runCommand({ replSetStepDown: 20, force: true }); } catch (error) {
          assert.ok([11600, 11602, 189, 91].includes(error.code), 'only expected step-down disconnects');
        }
      } else if (mode === 'drift') {
        const config = (await admin.runCommand({ replSetGetConfig: 1 })).config;
        config.members[0].host = 'localhost:27017';
        config.version++;
        assert.equal((await admin.runCommand({ replSetReconfig: config })).ok, 1);
      } else throw new Error('unknown test action');
      assert.equal((await admin.runCommand({ getParameter: 1, enableTestCommands: 1 })).enableTestCommands, false);
    }
    print(`PASS ${mode}`);
  } catch (error) {
    print(`FAIL infrastructure probe ${process.env.TEST_ACTION} (${error.code || error.name}): ${error.message}`);
    quit(1);
  }
})();
