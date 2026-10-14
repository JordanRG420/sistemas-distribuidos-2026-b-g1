const common = require('/opt/synkro/common.js');
(async () => {
  try {
    const { connection } = await common.authenticated(Mongo);
    if ((await connection.getDB(process.env.MONGO_TOOLS_DB).getCollectionNames()).length) throw new Error('not empty');
    print('empty restoration target verified');
  } catch { print('restore refused: target database must be empty and authenticated'); quit(1); }
})();
