const common = require('/opt/synkro/common.js');
(async () => {
  try {
    const { admin } = await common.authenticated(Mongo);
    const hello = await admin.hello();
    if (hello.setName !== 'rs0' || !hello.isWritablePrimary) throw new Error('not the intended writable PRIMARY');
    common.compatible((await admin.runCommand({ replSetGetConfig: 1 })).config);
    if ((await admin.runCommand({ replSetGetStatus: 1 })).myState !== 1) throw new Error('not PRIMARY');
    print('healthy: authenticated rs0 writable PRIMARY');
  } catch {
    print('unhealthy: authentication, rs0 membership or writable PRIMARY verification failed');
    quit(1);
  }
})();
