const common = require('/opt/synkro/common.js');
(async () => {
  try {
    const deadline = Date.now() + Number(process.env.MONGO_STARTUP_TIMEOUT_SECONDS) * 1000;
    const secret = common.credentials('admin');
    let admin;
    // The authenticated mongod may still be opening its persistent storage.
    while (Date.now() < deadline) {
      try {
        const connection = await new Mongo(common.uri());
        admin = connection.getDB('admin');
        if ((await admin.runCommand({ ping: 1 })).ok === 1) break;
      } catch { admin = undefined; }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!admin) throw new Error('MongoDB connection readiness timed out');
    print('bootstrap phase: authenticated mongod reachable');
    let loggedIn = false;
    try { loggedIn = Boolean(await admin.auth(secret.user, secret.password)); } catch { /* first start or a safely rejected mismatch */ }
    let status;
    try { status = await admin.runCommand({ replSetGetStatus: 1 }); }
    catch (error) {
      if (error.code === 13 || error.code === 18) throw new Error('MONGO_ADMIN_USER/MONGO_ADMIN_PASSWORD mismatch or preexisting users; no changes performed');
      if (error.code !== 94) throw error;
      status = { code: 94 };
    }
    if (status.code === 94) {
      const initiated = await admin.runCommand({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: 'synkro-mongo:27017' }] } });
      if (initiated.ok !== 1) throw new Error('replica initialization failed');
    } else if (status.ok !== 1) throw new Error('unexpected replica set status');
    let primary = false;
    while (Date.now() < deadline) {
      if ((await admin.hello()).isWritablePrimary) { primary = true; break; }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!primary) throw new Error('writable PRIMARY readiness timed out');
    print('bootstrap phase: writable PRIMARY ready');
    if (!loggedIn) {
      // Localhost exception permits exactly the first administrator. Any
      // existing user/role closes it; a failed auth never authorizes repair.
      try { await admin.createUser({ user: secret.user, pwd: secret.password, roles: [{ role: 'root', db: 'admin' }] }); }
      catch { throw new Error('administrator bootstrap denied; check original credentials and existing users'); }
      if (!await admin.auth(secret.user, secret.password)) throw new Error('administrator verification failed');
    }
    common.compatible((await admin.runCommand({ replSetGetConfig: 1 })).config);
    print('bootstrap phase: replica configuration verified');
    const administrator = (await admin.runCommand({ usersInfo: secret.user })).users[0];
    let hasRoot = false;
    if (administrator && Array.isArray(administrator.roles)) {
      for (const role of administrator.roles) if (role.role === 'root' && role.db === 'admin') hasRoot = true;
    }
    if (!hasRoot) throw new Error('existing administrator lacks the expected root role; no grant performed');
    const app = common.credentials('app');
    if (!await admin.getUser('sales_app')) await admin.createUser({ user: 'sales_app', pwd: app.password, roles: [] });
    // Existing roles are never passed to updateUser, replaced or revoked.
    await common.authenticated(Mongo, 'app');
    if (!(await admin.hello()).isWritablePrimary) throw new Error('PRIMARY lost during bootstrap verification');
    print('bootstrap verified: rs0 PRIMARY, administrator and sales_app in admin; existing credentials and grants preserved');
  } catch (error) {
    // Errors generated above contain no secrets; raw server errors may contain
    // commands or values, so only emit an allowlisted operational message.
    const safe = /^(MongoDB connection|MONGO_ADMIN_|writable PRIMARY|incompatible replica|administrator bootstrap|administrator verification|existing administrator|SALES_APP_PASSWORD|PRIMARY lost|replica initialization|unexpected replica)/;
    print(safe.test(error.message) ? error.message : `bootstrap MongoDB command failed (${error.name}, code ${error.code || 'unknown'})`);
    quit(1);
  }
})();
