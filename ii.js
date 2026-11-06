// Server-side verification of an Internet Identity login.
// The browser generates a throwaway P-256 session key, Internet Identity signs a delegation to that key
// (a canister signature), and the session key signs our one-time challenge. We verify both signatures
// and derive the user's principal. Anything unexpected fails closed.
const fs = require('fs');
const nodeCrypto = require('crypto');
const { Principal } = require('@dfinity/principal');
const { requestIdOf, IC_ROOT_KEY } = require('@dfinity/agent');

const II_CANISTER = 'rdmx6-jaaaa-aaaaa-aaadq-cai';
const ROOT_KEY = Buffer.from(IC_ROOT_KEY, 'hex').subarray(-96); // raw BLS key inside the DER wrapper
const DOMAIN_SEP = Buffer.from('\x1Aic-request-auth-delegation');
const CANISTER_SIG_OID = Buffer.from('2b0601040183b8430102', 'hex'); // 1.3.6.1.4.1.56387.1.2

let verifier = null;
async function loadVerifier() {
  if (verifier) return verifier;
  const m = await import('@dfinity/standalone-sig-verifier-web/standalone_sig_verifier_web.js');
  m.initSync(fs.readFileSync(require.resolve('@dfinity/standalone-sig-verifier-web/standalone_sig_verifier_web_bg.wasm')));
  verifier = m;
  return verifier;
}
function _setVerifierForTests(v) { verifier = v; }

const hexBytes = (h, max = 4096) => {
  if (typeof h !== 'string' || h.length % 2 || h.length > max * 2 || !/^[0-9a-f]*$/i.test(h)) throw new Error('bad hex');
  return Buffer.from(h, 'hex');
};
function der(buf, off) { // minimal DER reader: returns { tag, start, end }
  const tag = buf[off]; let len = buf[off + 1], p = off + 2;
  if (len & 0x80) { const n = len & 0x7f; if (n < 1 || n > 2) throw new Error('der'); len = 0; for (let i = 0; i < n; i++) len = (len << 8) | buf[p++]; }
  if (p + len > buf.length) throw new Error('der');
  return { tag, start: p, end: p + len };
}
// Canister-signature public key: SEQ { SEQ { OID }, BITSTRING { 0x00, idLen, canisterId, seed } }
function canisterOfKey(pub) {
  const top = der(pub, 0); if (top.tag !== 0x30) throw new Error('der');
  const alg = der(pub, top.start); if (alg.tag !== 0x30) throw new Error('der');
  const oid = der(pub, alg.start); if (oid.tag !== 0x06 || !pub.subarray(oid.start, oid.end).equals(CANISTER_SIG_OID)) throw new Error('not a canister signature key');
  const bits = der(pub, alg.end); if (bits.tag !== 0x03 || pub[bits.start] !== 0) throw new Error('der');
  const idLen = pub[bits.start + 1];
  if (idLen < 1 || idLen > 29 || bits.start + 2 + idLen > bits.end) throw new Error('der');
  return Principal.fromUint8Array(pub.subarray(bits.start + 2, bits.start + 2 + idLen)).toText();
}

// p: { sessionPublicKey, userPublicKey, delegationPubkey, expiration, delegationSignature, signature } (hex strings; expiration decimal ns)
async function verifyIILogin(p, message, nowMs = Date.now()) {
  try {
    const sessionPub = hexBytes(p.sessionPublicKey, 200), userPub = hexBytes(p.userPublicKey, 400), delPub = hexBytes(p.delegationPubkey, 200);
    const delSig = hexBytes(p.delegationSignature, 4000), sig = hexBytes(p.signature, 100);
    if (!/^\d{1,25}$/.test(String(p.expiration))) throw new Error('expiration');
    const expiration = BigInt(p.expiration);
    // 1. session key must be a P-256 key and be the key that was delegated to
    const key = nodeCrypto.createPublicKey({ key: sessionPub, format: 'der', type: 'spki' });
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails.namedCurve !== 'prime256v1') throw new Error('key type');
    if (!sessionPub.equals(delPub)) throw new Error('delegation is for a different key');
    // 2. delegation not expired
    if (expiration <= BigInt(nowMs) * 1000000n) throw new Error('delegation expired');
    // 3. delegation signed by Internet Identity (canister signature), and the key belongs to the II canister
    if (canisterOfKey(userPub) !== II_CANISTER) throw new Error('not issued by Internet Identity');
    const reqId = Buffer.from(requestIdOf({ pubkey: new Uint8Array(delPub), expiration }));
    const v = await loadVerifier();
    v.verifyCanisterSignature(new Uint8Array(Buffer.concat([DOMAIN_SEP, reqId])), new Uint8Array(delSig), new Uint8Array(userPub), new Uint8Array(ROOT_KEY));
    // 4. the session key signed our one-time challenge
    if (!nodeCrypto.verify('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }, sig)) throw new Error('challenge signature');
    return Principal.selfAuthenticating(new Uint8Array(userPub)).toText();
  } catch (e) {
    const err = new Error('Internet Identity sign-in could not be verified.'); err.status = 401; err.detail = e.message; throw err;
  }
}

module.exports = { verifyIILogin, canisterOfKey, _setVerifierForTests, II_CANISTER };
