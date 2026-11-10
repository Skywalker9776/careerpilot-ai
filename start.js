// Entry point: restore the database from backup (only on a fresh disk), then start the server.
const persist = require('./persist');
persist.restoreIfNeeded()
  .then(r => { console.log('persist: ' + r); require('./server.js'); })
  .catch(e => { console.error('persist: cannot restore, refusing to start with an empty database:', e.message); process.exit(1); });
