const fs = require('fs');
const common = require('/opt/synkro/common.js');
const secret = common.credentials('admin');
const milliseconds = Number(process.env.MONGO_CONNECT_TIMEOUT_MS);
fs.writeFileSync(process.env.MONGO_TOOLS_CONFIG, JSON.stringify({
  uri: `mongodb://${encodeURIComponent(secret.user)}@127.0.0.1:27017/?authSource=admin&replicaSet=rs0&serverSelectionTimeoutMS=${milliseconds}&connectTimeoutMS=${milliseconds}`,
  password: secret.password,
}), { mode: 0o600 });
