// Free-hosting persistence: encrypted SQLite backup to a private GitHub repo, restored on a fresh start.
// Needs three Variables: PERSIST_GH_REPO (owner/name), PERSIST_GH_TOKEN (fine-grained token, Contents read/write on that repo only),
// and JWT_SECRET (the encryption key is derived from it). If any is missing, this module does nothing.
// Safety rules: never overwrite an existing local database; if a restore fails with a network error, refuse to start
// (so an empty database can never replace a good backup).
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const E = process.env;
const REPO = E.PERSIST_GH_REPO, TOKEN = E.PERSIST_GH_TOKEN;
const API = (E.PERSIST_GH_API || 'https://api.github.com').replace(/\/$/, '');
const FILE = E.PERSIST_FILE || 'careerpilot-db.enc';
const enabled = () => !!(REPO && TOKEN && E.JWT_SECRET);
const DATA_DIR = () => E.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = () => path.join(DATA_DIR(), 'careerpilot.db');
const MAGIC = Buffer.from('CPB1');

const key = () => crypto.createHash('sha256').update('careerpilot-backup-v1:' + E.JWT_SECRET).digest();
function encrypt(plain) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(zlib.gzipSync(plain)), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), enc]);
}
function decrypt(buf) {
  if (buf.length < 33 || !buf.subarray(0, 4).equals(MAGIC)) throw new Error('backup file format not recognised');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(4, 16));
  d.setAuthTag(buf.subarray(16, 32));
  return zlib.gunzipSync(Buffer.concat([d.update(buf.subarray(32)), d.final()]));
}

const headers = () => ({ Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'careerpilot-backup', 'X-GitHub-Api-Version': '2022-11-28' });
const url = p => API + '/repos/' + REPO + p;
async function gh(p, opt = {}) { return fetch(url(p), { ...opt, headers: { ...headers(), ...(opt.headers || {}) }, signal: AbortSignal.timeout(60000) }); }

let lastSha = null;
async function getRemote() { // -> { sha, data } or null when no backup exists yet
  const r = await gh('/contents/' + encodeURIComponent(FILE));
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('GitHub read failed: HTTP ' + r.status);
  const j = await r.json();
  let b64 = j.content;
  if (!b64 || j.encoding === 'none') { // larger than 1 MB: fetch the blob
    const b = await gh('/git/blobs/' + j.sha);
    if (!b.ok) throw new Error('GitHub blob read failed: HTTP ' + b.status);
    b64 = (await b.json()).content;
  }
  return { sha: j.sha, data: Buffer.from(String(b64).replace(/\n/g, ''), 'base64') };
}

async function restoreIfNeeded() {
  if (REPO && !(TOKEN && E.JWT_SECRET)) throw new Error('PERSIST_GH_REPO is set but PERSIST_GH_TOKEN or JWT_SECRET is missing');
  if (!enabled()) return 'disabled';
  if (fs.existsSync(DB_FILE())) return 'local database present, no restore';
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      const remote = await getRemote();
      if (!remote) { console.log('persist: no remote backup yet, starting fresh'); return 'fresh'; }
      const plain = decrypt(remote.data);
      fs.mkdirSync(DATA_DIR(), { recursive: true });
      const tmp = DB_FILE() + '.restoring';
      fs.writeFileSync(tmp, plain); fs.renameSync(tmp, DB_FILE());
      lastSha = remote.sha;
      console.log('persist: restored database from backup (' + plain.length + ' bytes)');
      return 'restored';
    } catch (e) { lastErr = e; console.error('persist: restore attempt ' + (i + 1) + ' failed:', e.message); await new Promise(r => setTimeout(r, 2000 * (i + 1))); }
  }
  throw lastErr; // refuse to start empty and later overwrite a good backup
}

let busy = false, lastSig = '', lastHash = '', lastOk = null;
const sig = f => ['', '-wal'].map(s => { try { const t = fs.statSync(f + s); return t.mtimeMs + ':' + t.size; } catch { return '-'; } }).join('|');
async function backupNow(db, force) {
  if (!enabled() || busy) return false;
  const s = sig(DB_FILE());
  if (!force && s === lastSig) return false;
  busy = true;
  const tmp = path.join(DATA_DIR(), 'persist-' + Date.now() + '.tmp.db');
  try {
    await db.backup(tmp);
    const plain = fs.readFileSync(tmp), h = crypto.createHash('sha256').update(plain).digest('hex');
    if (h === lastHash) { lastSig = s; return false; }
    const body = { message: 'backup ' + new Date().toISOString(), content: encrypt(plain).toString('base64') };
    for (let attempt = 0; attempt < 2; attempt++) {
      if (lastSha === null) { const r = await getRemote(); lastSha = r ? r.sha : undefined; }
      const put = await gh('/contents/' + encodeURIComponent(FILE), { method: 'PUT', body: JSON.stringify({ ...body, ...(lastSha ? { sha: lastSha } : {}) }) });
      if (put.ok) { lastSha = (await put.json()).content.sha; lastSig = s; lastHash = h; lastOk = new Date().toISOString(); console.log('persist: backup saved (' + plain.length + ' bytes)'); return true; }
      if (put.status === 409 || put.status === 422) { lastSha = null; continue; } // stale sha, refetch and retry once
      throw new Error('GitHub write failed: HTTP ' + put.status);
    }
    throw new Error('GitHub write conflict');
  } catch (e) { console.error('persist: backup failed:', e.message); return false; }
  finally { busy = false; fs.unlink(tmp, () => {}); }
}

function start(db) {
  if (!enabled()) { console.log('persist: off (set PERSIST_GH_REPO, PERSIST_GH_TOKEN to keep data on free hosting)'); return; }
  const every = Math.max(1, Number(E.BACKUP_INTERVAL_MIN) || 5) * 60000;
  setTimeout(() => backupNow(db, true), 20000);
  setInterval(() => backupNow(db, false), every).unref();
  let closing = false;
  const bye = async () => { if (closing) return; closing = true; await backupNow(db, false); process.exit(0); };
  process.on('SIGTERM', bye); process.on('SIGINT', bye);
  console.log('persist: backups on, every ' + every / 60000 + ' min');
}
const status = () => ({ enabled: enabled(), lastBackup: lastOk });

module.exports = { enabled, restoreIfNeeded, backupNow, start, status, encrypt, decrypt };
