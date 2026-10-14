// Generic restoration safety; domain compatibility belongs to its runner.
const common = require('/opt/synkro/common.js');
(async () => {
  try {
    const database = process.env.MONGO_TOOLS_DB;
    const collection = process.env.MONGO_TOOLS_COLLECTION;
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(database || '') || ['admin', 'config', 'local'].includes(database) ||
      !/^[a-z][a-z0-9_]{0,63}$/.test(collection || '')) throw new Error('ordinary namespace required');
    const { connection } = await common.authenticated(Mongo);
    const target = connection.getDB(database);
    if ((await target.getCollectionInfos({ name: collection })).length !== 1 ||
      await target.getCollection(collection).findOne({}) !== null) throw new Error('not empty');
    print('existing empty restoration collection verified');
  } catch { print('restore refused: target collection must exist and be empty and authenticated'); quit(1); }
})();
