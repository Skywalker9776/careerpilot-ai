const test = require('node:test'), assert = require('node:assert');
const { scanText } = require('./scamshield');
const lvl = t => scanText(t).level;
test('blocks seed phrase requests', () => assert.equal(lvl('To get started please send us your seed phrase for verification'), 'danger'));
test('blocks wallet connect to apply', () => assert.equal(lvl('Connect your wallet to apply and get verified'), 'danger'));
test('blocks upfront fees', () => { assert.equal(lvl('A refundable deposit of 50 USDT is required'), 'danger'); assert.equal(lvl('Training fee: $30'), 'danger'); assert.equal(lvl('You need to pay a fee before you start'), 'danger'); });
test('blocks send crypto first', () => assert.equal(lvl('Send 100 USDT to start your account'), 'danger'));
test('cautions guaranteed earnings and chat-only', () => { assert.equal(lvl('Earn $500 per day, guaranteed income!'), 'caution'); assert.equal(lvl('Apply only via Telegram'), 'caution'); });
test('legit crypto roles pass', () => {
  assert.equal(lvl('Senior Solidity Engineer. Audit smart contracts, manage private key custody systems and HSM policies. Salary 120-160k USD in USDC.'), 'ok');
  assert.equal(lvl('Community manager for our DAO. Join our Discord to learn more, apply on our website. Remote.'), 'ok');
  assert.equal(lvl('Security engineer: wallet security, key management, incident response. Pay in USDT or fiat.'), 'ok');
  assert.equal(lvl('Compliance analyst (KYC/AML). Experience required. Competitive salary.'), 'ok');
});
test('returns flag labels', () => assert.ok(scanText('Training fee required').flags[0].label.length > 5));
