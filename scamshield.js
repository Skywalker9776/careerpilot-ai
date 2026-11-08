// Scam Shield: automatic red-flag check for job listings (pattern rules, not AI, not a guarantee).
// "danger" = listing asks candidates for money, seed phrases or wallet connections (blocked at posting).
// "caution" = patterns common in scams that deserve a careful look.
const RULES = [
  { level: 'danger', code: 'seed_phrase', label: 'Asks candidates to share a seed phrase, private key or wallet password',
    re: /\b(send|share|provide|submit|enter|give|paste|reveal)\b[^.\n]{0,40}\b(seed phrase|recovery phrase|secret recovery|private key|mnemonic|wallet password)/i },
  { level: 'danger', code: 'connect_wallet', label: 'Asks candidates to connect their wallet to apply or get verified',
    re: /\bconnect (your |a |the )?wallet\b[^.\n]{0,30}\b(to apply|to verify|to start|to get started|to claim|to confirm)/i },
  { level: 'danger', code: 'upfront_fee', label: 'Asks candidates to pay a fee or deposit',
    re: /\b(registration|application|training|onboarding|processing|verification|security|equipment|starter|admin|activation)\s+(fee|deposit|payment)\b|\b(refundable|security)\s+deposit\b|\b(must|need to|required to|have to)\s+(pay|deposit|invest|send)\b|\bpay\s+(a\s+)?(small\s+)?(fee|deposit)\s+(to|before|upfront|first)/i },
  { level: 'danger', code: 'send_crypto_first', label: 'Asks candidates to send or invest crypto first',
    re: /\b(send|transfer|deposit|invest)\s+(\w+\s+){0,3}(usdt|usdc|btc|bitcoin|eth|ethereum|bnb|crypto|tokens?)\s+(to|first|before|to start|to begin)\b|\binvest(ing)?\s+(first|to start|to begin)\b/i },
  { level: 'danger', code: 'check_scam', label: 'Mentions depositing a check or buying equipment from their vendor',
    re: /\b(cashier'?s?|certified)\s+check\b|\bdeposit (the |this )?check\b|\bpurchase (your own )?(laptop|equipment|software)\s+(from|through)\s+(our|a)\s+(vendor|supplier)/i },
  { level: 'caution', code: 'guaranteed_earnings', label: 'Promises guaranteed or unusually high earnings',
    re: /\bguaranteed\s+(returns?|profits?|income|earnings)\b|\b(100%|risk[- ]free)\s+(profit|returns?)\b|\bearn\s+(up to\s+)?\$?\s?\d[\d,]{2,}\s*(\/|per|a)\s*(day|hour|week)\b/i },
  { level: 'caution', code: 'chat_only', label: 'Asks you to apply or talk only through a chat app',
    re: /\b(contact|apply|message|dm|reach|text)\b[^.\n]{0,25}\b(only\s+)?(on|via|through|using)\s+(telegram|whatsapp|signal|discord)\b/i },
  { level: 'caution', code: 'short_links', label: 'Uses shortened or invite-only links',
    re: /\b(bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|t\.co)\/|t\.me\/\+/i },
  { level: 'caution', code: 'install_to_apply', label: 'Asks you to install an app or extension to apply or get paid',
    re: /\b(download|install)\s+(our|this|the)\s+(app|extension|software|wallet)\b[^.\n]{0,30}\b(to apply|to start|to get paid|to continue)/i },
  { level: 'caution', code: 'no_experience_high_pay', label: 'High pay with no experience required',
    re: /\bno experience (needed|required|necessary)\b[^]{0,200}\$\s?\d{3,}\s*(\/|per)\s*(day|hour)|\$\s?\d{3,}\s*(\/|per)\s*(day|hour)[^]{0,200}\bno experience (needed|required|necessary)\b/i },
];

function scanText(text) {
  const t = String(text || '');
  const flags = RULES.filter(r => r.re.test(t)).map(r => ({ code: r.code, level: r.level, label: r.label }));
  const level = flags.some(f => f.level === 'danger') ? 'danger' : flags.length ? 'caution' : 'ok';
  return { level, flags };
}
const scanJob = j => scanText([j && j.title, j && j.description, j && j.company, Array.isArray(j && j.tags) ? j.tags.join(' ') : ''].filter(Boolean).join('\n'));

module.exports = { scanText, scanJob, RULES };
