// Test data only. Schema, indexes, roles and grants always come from Sales.
const fs = require('fs');
const assert = require('assert/strict');
const crypto = require('crypto');
const equal = (a, b) => assert.equal(EJSON.stringify(a, { relaxed: false }), EJSON.stringify(b, { relaxed: false }));
const uuid = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sale = n => ({ _id: uuid(n), customerId: uuid(90), createdBy: uuid(91),
  date: new Date('2026-10-11T00:00:00Z'), totalCents: Long('1000'), active: true,
  idempotencyKey: `hu-inf-04-${n}`, details: [{ detailId: uuid(100 + n), productId: uuid(200 + n),
    quantity: Int32(2), unitPriceCents: Long('500'), subtotalCents: Long('1000'), active: true }] });
async function denied(fn, code) {
  let rejected = false;
  try { await fn(); } catch (error) { rejected = error.code === code; }
  assert.ok(rejected, `operation must fail with MongoDB code ${code}`);
}
async function main() {
  const action = process.env.TEST_ACTION;
  const secret = JSON.parse(fs.readFileSync('/run/secrets/admin.json', 'utf8'));
  const app = JSON.parse(fs.readFileSync('/run/secrets/app.json', 'utf8'));
  const uri = 'mongodb://synkro-mongo:27017/admin?replicaSet=rs0&serverSelectionTimeoutMS=2000&connectTimeoutMS=2000';
  const connection = await new Mongo(uri);
  const admin = connection.getDB('admin');
  assert.ok(await admin.auth(secret.user, secret.password));
  const database = connection.getDB('sales');
  assert.equal((await admin.runCommand({ getParameter: 1, enableTestCommands: 1 })).enableTestCommands, false);
  if (action === 'initial') {
    equal((await admin.getUser('sales_app')).roles, []);
    equal(await database.getCollectionNames(), []);
    print('PASS SALES-01 initial zero-role application user'); return;
  }
  equal((await admin.getUser('sales_app')).roles, [{ role: 'sales_writer', db: 'sales' }]);
  const appConnection = await new Mongo(uri);
  assert.ok(await appConnection.getDB('admin').auth(app.user, app.password));
  const collection = appConnection.getDB('sales').sale;
  if (action === 'snapshot') {
    const users = (await admin.runCommand({ usersInfo: 1, showCredentials: true })).users;
    const config = (await admin.runCommand({ replSetGetConfig: 1 })).config; delete config.term;
    const rows = await collection.find({}).sort({ _id: 1 }).toArray();
    const metadata = { options: (await database.getCollectionInfos({ name: 'sale' }))[0].options,
      indexes: await database.sale.getIndexes() };
    print(EJSON.stringify({ usersDigest: crypto.createHash('sha256').update(EJSON.stringify(users)).digest('hex'),
      config, metadata, rows }, { relaxed: false })); return;
  }
  if (action === 'baseline') {
    await collection.findOne({});
    print('PASS SALES-02 application authentication, read and exact grant'); return;
  }
  if (action === 'seed' || action === 'permissions') {
    const number = action === 'seed' ? 1 : 3;
    await collection.insertOne(sale(number));
    if (action === 'seed') await collection.insertOne(sale(2));
    assert.equal((await collection.findOne({ _id: uuid(number) })).idempotencyKey, `hu-inf-04-${number}`);
    assert.equal((await collection.updateOne({ _id: uuid(number) }, { $set: { active: false } })).modifiedCount, 1);
    for (const doc of [sale(40), { ...sale(41), unexpected: true }, { ...sale(42), _id: 'not-a-uuid' },
      { ...sale(43), details: [] }, { ...sale(44), details: Array.from({ length: 101 }, () => sale(44).details[0]) },
      { ...sale(45), totalCents: '1000' }]) {
      if (doc._id === uuid(40)) doc.details[0].quantity = Int32(0);
      await denied(() => collection.insertOne(doc), 121);
    }
    await denied(() => collection.insertOne({ ...sale(46), idempotencyKey: `hu-inf-04-${number}` }), 11000);
    await denied(() => collection.updateOne({ _id: uuid(number) }, { $set: { totalCents: 'invalid' } }), 121);
    await denied(() => collection.deleteOne({ _id: uuid(number) }), 13);
    await denied(() => collection.deleteMany({}), 13);
    await denied(() => appConnection.getDB('infra_fixture').records.findOne({}), 13);
    for (const user of [secret.user, app.user]) {
      const bad = await new Mongo(uri);
      let rejected = false;
      try { rejected = !await bad.getDB('admin').auth(user, 'incorrect-disposable-password'); } catch { rejected = true; }
      assert.ok(rejected, 'incorrect credentials must be rejected');
    }
    print('PASS SALES-03 find/insert/update; denied remove, invalid BSON/schema, duplicate key and incorrect credentials'); return;
  }
  if (action === 'verify') {
    const rows = await collection.find({}).sort({ _id: 1 }).toArray();
    equal(rows.map(row => row._id), [uuid(1), uuid(2)]);
    equal(rows.map(row => row.active), [false, true]);
    const types = await collection.aggregate([{ $project: { total: { $type: '$totalCents' },
      date: { $type: '$date' }, active: { $type: '$active' }, quantity: { $type: { $arrayElemAt: ['$details.quantity', 0] } },
      price: { $type: { $arrayElemAt: ['$details.unitPriceCents', 0] } }, subtotal: { $type: { $arrayElemAt: ['$details.subtotalCents', 0] } } } }]).toArray();
    assert.ok(types.every(row => row.total === 'long' && row.date === 'date' && row.active === 'bool' &&
      row.quantity === 'int' && row.price === 'long' && row.subtotal === 'long'));
    for (const row of rows) {
      assert.equal(row.totalCents.toString(), '1000'); assert.equal(row.date.toISOString(), '2026-10-11T00:00:00.000Z');
      assert.equal(Number(row.details[0].quantity), 2); assert.equal(row.details[0].unitPriceCents.toString(), '500');
    }
    print('PASS SALES-04 exact Sales documents, values and BSON types'); return;
  }
  throw new Error('unsupported Sales test action');
}
main().catch(error => {
  const detail = error.name === 'AssertionError' ? `: ${error.message.split('\n')[0]}` : '';
  print(`FAIL Sales probe ${process.env.TEST_ACTION} (${error.code || error.name})${detail}`); quit(1);
});
