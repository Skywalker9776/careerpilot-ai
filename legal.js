// Privacy policy, Terms and Fees pages. Text describes what the app actually does.
// Fees are rendered from the live configuration so the page can never disagree with what is charged.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const UPDATED = '6 November 2026';

function shell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} - CareerPilot AI</title>
<style>
:root{--bg:#030712;--fg:#e5e7eb;--mut:#9ca3af;--line:#1f2937;--acc:#a78bfa;--card:#0b1020}
@media (prefers-color-scheme: light){:root{--bg:#fff;--fg:#111827;--mut:#4b5563;--line:#e5e7eb;--acc:#6d28d9;--card:#f9fafb}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 64px}a{color:var(--acc)}
h1{font-size:28px;margin:8px 0}h2{font-size:19px;margin:30px 0 6px}p,li{color:var(--fg)}.mut{color:var(--mut);font-size:14px}
table{width:100%;border-collapse:collapse;margin:12px 0;background:var(--card)}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;font-size:14px;vertical-align:top}
code{word-break:break-all;font-size:13px}nav a{margin-right:14px;font-size:14px}.note{border:1px solid var(--line);background:var(--card);padding:10px 12px;border-radius:8px;font-size:14px}
</style></head><body><main>
<nav><a href="/">&larr; CareerPilot AI</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/fees">Fees</a></nav>
<h1>${esc(title)}</h1><p class="mut">Last updated: ${UPDATED}</p>${body}</main></body></html>`;
}

function contactLine(cfg) {
  const parts = [];
  if (cfg.contactEmail) parts.push(`email <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>`);
  if (cfg.contactX) parts.push(`X (Twitter) <a href="https://x.com/${esc(cfg.contactX)}" rel="noopener">@${esc(cfg.contactX)}</a>`);
  return parts.length ? 'You can contact us by ' + parts.join(' or ') + '.' : 'You can contact us through the in-app Copilot or by replying to any email we send you.';
}

function privacy(cfg) {
  return shell('Privacy Policy', `
<p>CareerPilot AI ("CareerPilot", "we") is operated by Akmal Bhutta. This policy explains what personal data the service handles, why, and the choices you have. ${contactLine(cfg)}</p>

<h2>1. Data we collect</h2>
<ul>
<li><b>Account data:</b> your email address and a password hash (we never store your password itself), or your Google account ID and name if you sign in with Google, or your wallet address if you sign in with a wallet, or your Internet Identity principal (a pseudonymous ID) if you sign in with Internet Identity. Your role (candidate or employer).</li>
<li><b>Profile data you choose to add:</b> display name, headline, location, short bio, contact email, company name and description, and a payout wallet address for referral commissions.</li>
<li><b>CV data (candidates):</b> the text extracted from the CV you upload or paste (we keep the text, not the original file), and the AI-generated profile, ATS analysis, job matches, cover-letter drafts and application records.</li>
<li><b>Employer data:</b> job postings, applicants' screening results and the stage you set for each applicant.</li>
<li><b>Payment data:</b> the blockchain, transaction hash, plan or product and amount of payments you ask us to verify. Blockchain transactions are public by nature.</li>
<li><b>Referral data:</b> your referral code, who signed up with it, and commission records.</li>
<li><b>Activity log:</b> a record of actions such as autopilot submissions, applications and job posts, shown to you in the Activity tab.</li>
<li><b>Technical data:</b> your IP address is used briefly in server memory for rate limiting and abuse prevention and is not stored in the database. Your login token is kept in your browser's local storage. We use no advertising or analytics cookies.</li>
</ul>

<h2>2. How we use it</h2>
<ul>
<li>To run your account, analyse your CV, suggest and draft job applications, and show employers screened applicants.</li>
<li>To verify payments and calculate referral commissions.</li>
<li>To keep the service secure and prevent abuse.</li>
<li>We do not sell your personal data and we do not use it for advertising.</li>
</ul>

<h2>3. AI processing</h2>
<p>When AI features are enabled, the text of your CV, job descriptions and your messages to the Copilot are sent to our AI provider (Anthropic's Claude API or Google's Gemini API, depending on how the service is configured) to produce analysis, drafts and answers. The provider processes that data under its own terms and privacy policy. Some providers' free tiers may allow them to use submitted text to improve their services, so avoid putting sensitive details in your CV. AI output can be wrong; you should check it before you rely on it or send it.</p>
<p><b>Employer screening:</b> AI screening is decision support only. Applicants are shown to employers under an alias, without name, contact details or CV, until the employer shortlists them. The system never rejects anyone automatically and never scores protected characteristics. Every hiring decision is made by a human employer.</p>
<p><b>Autopilot:</b> it is off unless you turn it on, it is capped, and it only submits to jobs posted directly on CareerPilot. Every action is logged. Jobs on other websites are only drafted for you to send yourself.</p>

<h2>4. Who else handles data</h2>
<ul>
<li><b>Railway</b> hosts the application and database.</li>
<li><b>Anthropic or Google (Gemini)</b> process text for AI features, as described above.</li>
<li><b>Internet Identity</b> (identity.ic0.app, run by the DFINITY Foundation) if you use Internet Identity sign-in. We receive only a pseudonymous principal, never your device or passkey details.</li>
<li><b>Google</b> if you use Google sign-in (and Google Fonts load the page's typefaces).</li>
<li><b>Blockchain nodes and explorers</b> (BNB Smart Chain RPC, ICP ledger) are queried with public transaction hashes to verify payments.</li>
<li><b>RemoteOK</b> and <b>CoinGecko</b> supply public job and price data; no personal data is sent to them.</li>
<li>An <b>email provider</b>, only if you ask us to email an application on your behalf.</li>
</ul>
<p>We may disclose data if the law requires it.</p>

<h2>5. Wallets and keys</h2>
<p>We will never ask for your private key or seed phrase. Wallet sign-in works by asking your wallet to sign a one-time message, which proves you control the address and moves no funds. Data written to a public blockchain cannot be deleted by us.</p>

<h2>6. Retention and deletion</h2>
<p>We keep your data while your account exists. You can delete your account at any time from the Activity tab of your dashboard ("Delete account"); this removes your account, CV text, applications, job postings and activity log. Payment and referral records (transaction hash, amount) may be kept where needed for accounting and fraud prevention.</p>

<h2>7. Your rights</h2>
<p>You can view and edit your data in the app and delete your account. Depending on where you live you may also have the right to request a copy, correction or restriction of your data, or to object to processing. Contact us to exercise these rights.</p>

<h2>8. Security</h2>
<p>Passwords are hashed, traffic is encrypted in transit, and access to employer-side applicant identity is restricted by stage. No system is perfectly secure, so please use a strong, unique password.</p>

<h2>9. Children</h2>
<p>CareerPilot is for people aged 18 or over. We do not knowingly collect data from anyone younger.</p>

<h2>10. Changes</h2>
<p>If we change this policy we will update the date above and, for significant changes, tell you in the app.</p>
<p class="note">This policy is a plain-language statement of how the service works. It has not been reviewed by a lawyer; requirements differ by country (for example GDPR in the EU/UK).</p>`);
}

function terms(cfg) {
  return shell('Terms of Service', `
<p>By creating an account or using CareerPilot AI you agree to these Terms and the <a href="/privacy">Privacy Policy</a>. ${contactLine(cfg)}</p>

<h2>1. The service</h2>
<p>CareerPilot AI helps candidates analyse CVs, find and apply to jobs, and helps employers post jobs and review AI-screened applicants. AI features provide suggestions only.</p>

<h2>2. Eligibility and accounts</h2>
<p>You must be 18 or older. Keep your login and wallet secure; you are responsible for activity on your account. Information you give must be accurate. Do not put false facts in a CV or posting.</p>

<h2>3. Acceptable use</h2>
<ul>
<li>No scams. Jobs must be real, and must never ask candidates for payments, deposits, private keys, seed phrases or wallet access.</li>
<li>No scams. Listings must never ask candidates for money, fees, deposits, crypto, seed phrases, private keys or wallet connections. CareerPilot runs an automatic Scam Shield check (pattern-based, not a guarantee) and rejects listings that trip its hard rules. Report suspicious listings to us (see Contact).</li>
<li>No discrimination. Employers must make lawful, non-discriminatory hiring decisions. AI screening is decision support; a human must make every hiring decision.</li>
<li>No scraping, mass-messaging, spam, fake reviews, malware, or attempts to break or overload the service.</li>
<li>No impersonation, and no uploading other people's personal data without a right to do so.</li>
</ul>
<p>We may remove content or suspend accounts that break these rules.</p>

<h2>4. Autopilot</h2>
<p>Autopilot is optional, capped, logged, and only submits to jobs posted directly on CareerPilot. You stay responsible for what is submitted in your name. Cover letters use only facts found in your CV.</p>

<h2>5. Payments and fees</h2>
<ul>
<li>Fees are listed on the <a href="/fees">Fees page</a> and are paid in crypto on BNB Smart Chain (BEP-20 network) or the Internet Computer (ICP) to the addresses shown there.</li>
<li>Blockchain payments are irreversible. Send the exact network and asset to the exact address shown; funds sent to the wrong address or network usually cannot be recovered. You also pay the network's gas fee.</li>
<li>A payment is credited only after automatic on-chain verification or manual Founder review of the transaction. Manual submissions stay pending until approved and may take time; submission does not guarantee approval. Each transaction can be used only once.</li>
<li>Subscriptions last 30 days and do not renew automatically. Listing fees buy one listing of 30 days.</li>
<li>Payments are non-refundable, except where we made an error or the law requires otherwise. If something goes wrong, contact us with your transaction hash.</li>
</ul>

<h2>6. Referral programme</h2>
<p>If someone signs up with your referral link and pays for a plan or product, ${esc(cfg.refPercent)}% of that verified payment is recorded as a commission. Commissions are paid out manually by the team to the payout wallet in your profile, and may be withheld for self-referrals, fraud or abuse. We may change or end the programme for future sign-ups.</p>

<h2>7. No advice</h2>
<p>CareerPilot is not career, legal, tax or financial advice. Market and price data is informational only. Crypto assets are volatile and risky.</p>

<h2>8. Availability and liability</h2>
<p>The service is provided "as is" and may change, have errors or be unavailable. To the extent the law allows, we are not liable for indirect or consequential loss, for hiring outcomes, for the accuracy of AI output, for third-party job listings, or for losses from blockchain transactions. Nothing here limits liability that cannot be limited by law.</p>

<h2>9. Ending your account</h2>
<p>You can delete your account at any time from the Activity tab of your dashboard. We may suspend or end accounts that breach these Terms.</p>

<h2>10. Changes and governing law</h2>
<p>We may update these Terms; continued use after the date above means you accept the update. These Terms are governed by the laws of the place where the operator is established, without regard to conflict-of-law rules.</p>
<p class="note">These Terms have not been reviewed by a lawyer.</p>`);
}

function fees(cfg) {
  const row = (name, p, what) => `<tr><td><b>${esc(name)}</b><br><span class="mut">${what}</span></td><td>${esc(p.bnb)} BNB</td><td>${esc(p.icp)} ICP</td></tr>`;
  const P = cfg.products;
  return shell('Fees', `
<p>Everything is paid in crypto, per use, with no auto-renewal. The network's gas fee is paid by the sender and is not part of the price.</p>

<h2>Candidates</h2>
<table><tr><th>Plan</th><th>BNB (BEP-20)</th><th>ICP</th></tr>
<tr><td><b>Free</b><br><span class="mut">Always free: sign-up, login, job search, matching, CV analysis, applying, and ${esc(cfg.freeDrafts)} AI application drafts per day</span></td><td>0</td><td>0</td></tr>
${row(P.base.name, P.base, `${P.base.dailyDrafts} AI drafts per day for ${cfg.cycleDays} days`)}
${row(P.elite.name, P.elite, `${P.elite.dailyDrafts} AI drafts per day for ${cfg.cycleDays} days`)}
</table>

<h2>Employers (crypto job listings and premium services)</h2>
<table><tr><th>Product</th><th>BNB (BEP-20)</th><th>ICP</th></tr>
${cfg.freeListings > 0 ? `<tr><td><b>First ${esc(cfg.freeListings)} job listing${cfg.freeListings === 1 ? '' : 's'}</b><br><span class="mut">Free during the beta</span></td><td>0</td><td>0</td></tr>` : `<tr><td><b>Employer sign-up and login</b><br><span class="mut">Free. You pay only when you publish a listing.</span></td><td>0</td><td>0</td></tr>`}
${row(P.listing.name, P.listing, `One standard listing, live for ${cfg.listingDays} days, with blind AI screening of applicants`)}
${row(P.featured.name, P.featured, `One listing live for ${cfg.listingDays} days, shown first in job lists with a Featured badge`)}
</table>

<h2>Where to pay</h2>
<table>
<tr><th>Network</th><th>Official address</th></tr>
<tr><td>BNB Smart Chain (BEP-20)</td><td><code>${esc(cfg.merchant.bnb || 'not configured')}</code></td></tr>
<tr><td>Internet Computer (ICP account ID)</td><td><code>${esc(cfg.merchant.icp || 'not configured')}</code></td></tr>
</table>
<p>Send only the listed asset on the listed network. After sending, paste the transaction hash into the Billing tab. Choose <b>Verify automatically</b> for on-chain verification, or <b>Submit for Founder review</b> if you need manual review. A manual submission remains pending and does not activate a plan or listing credit until the Founder approves it after checking the transaction on the relevant block explorer. Keep your transaction hash and do not submit it more than once.</p>
<p>Never pay anyone who contacts you privately claiming to be CareerPilot. The only official deposit addresses are the ones displayed inside your signed-in CareerPilot account and on this Fees page. Never share your seed phrase or private key.</p>

<h2>Referral commission</h2>
<p>${esc(cfg.refPercent)}% of each verified payment made by someone you referred, paid out manually to your payout wallet. See <a href="/terms">Terms</a>.</p>

<h2>Changes</h2>
<p>Prices may change. The price shown on this page at the time you pay applies. Payments are non-refundable except as stated in the <a href="/terms">Terms</a>.</p>`);
}

module.exports = { privacy, terms, fees };
