const fs = require('fs');
function credentials(name) {
  return JSON.parse(fs.readFileSync(`/run/secrets/mongo-${name}`, 'utf8'));
}
function uri(host = '127.0.0.1', replica = false) {
  const milliseconds = Number(process.env.MONGO_CONNECT_TIMEOUT_MS);
  if (!Number.isInteger(milliseconds) || milliseconds < 500 || milliseconds > 3000) throw new Error('invalid MONGO_CONNECT_TIMEOUT_MS');
  return `mongodb://${host}:27017/admin?${replica ? 'replicaSet=rs0' : 'directConnection=true'}&serverSelectionTimeoutMS=${milliseconds}&connectTimeoutMS=${milliseconds}&socketTimeoutMS=${milliseconds}`;
}
function compatible(config) {
  const member = config.members?.[0];
  if (config._id !== 'rs0' || config.members.length !== 1 || member._id !== 0 || member.host !== 'synkro-mongo:27017' ||
    member.arbiterOnly === true || member.hidden === true || member.buildIndexes === false ||
    (member.priority ?? 1) !== 1 || (member.votes ?? 1) !== 1) throw new Error('incompatible replica configuration; expected one writable rs0 member at synkro-mongo:27017; no reconfiguration performed');
}
async function authenticated(MongoClass, name = 'admin') {
  const connection = await new MongoClass(uri());
  const admin = connection.getDB('admin');
  const secret = credentials(name);
  try {
    if (!await admin.auth(secret.user, secret.password)) throw new Error('authentication rejected');
  } catch { throw new Error(`${name === 'app' ? 'SALES_APP_PASSWORD' : 'MONGO_ADMIN_USER/MONGO_ADMIN_PASSWORD'} mismatch; no password rotation performed`); }
  return { connection, admin };
}
module.exports = { credentials, uri, compatible, authenticated };
