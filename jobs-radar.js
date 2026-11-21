'use strict';

const crypto = require('crypto');

const FEED_QUERIES = [
  { key: 'x-social', type: 'social', label: 'X / Twitter public posts', q: 'site:x.com OR site:twitter.com (crypto OR blockchain OR web3 OR "digital assets") (hiring OR "we are hiring" OR "job opening" OR vacancy)' },
  { key: 'reddit-social', type: 'social', label: 'Reddit public communities', q: 'site:reddit.com (crypto OR blockchain OR web3) (hiring OR "job opening" OR vacancy OR recruiter)' },
  { key: 'telegram-social', type: 'social', label: 'Public Telegram announcements', q: 'site:t.me (crypto OR blockchain OR web3) (hiring OR vacancy OR "job opening")' },
  { key: 'company-careers', type: 'company-news', label: 'Official company and startup career announcements', q: '(crypto OR blockchain OR web3 OR "digital assets") (careers OR "join our team" OR "open roles" OR "we are hiring") company startup protocol foundation' },
  { key: 'publisher-news', type: 'publisher-news', label: 'Newspaper and publisher job announcements', q: '(crypto OR blockchain OR web3 OR "digital assets") (jobs OR hiring OR vacancy OR recruitment) news newspaper' }
];
const BLOCKED = new Set(['indeed.com','www.indeed.com','linkedin.com','www.linkedin.com','glassdoor.com','www.glassdoor.com','ziprecruiter.com','monster.com']);
const CRYPTO = /\b(crypto|cryptocurrency|blockchain|web3|digital assets?|defi|decentralized finance|bitcoin|ethereum|solana|stablecoin|tokenization|smart contract|distributed ledger|virtual assets?)\b/i;
const JOB = /\b(hir(?:e|ing|es)|vacanc(?:y|ies)|job(?:s)?|career(?:s)?|recruit(?:er|ment|ing)|open role|position|opportunit(?:y|ies)|join (?:our|the) team|talent acquisition)\b/i;
const ROLE = /\b(engineer|developer|analyst|trader|researcher|designer|manager|director|officer|counsel|lawyer|auditor|architect|specialist|associate|intern|consultant|community|marketing|sales|operations|product|security|compliance|growth|partnership|business development|validator|moderator|writer|editor|support|customer success|quant|risk|finance|accountant|recruiter|executive|lead)\b/i;
const CATEGORY_RULES = [
  ['Trading & Markets', /\\b(trader|trading|market maker|quant|portfolio|investment)\\b/i],
  ['Engineering & Protocol', /\\b(engineer|developer|software|solidity|rust|protocol|frontend|backend|devops)\\b/i],
  ['Security & Audit', /\\b(security|auditor|audit|penetration|smart contract review)\\b/i],
  ['Research & Analytics', /\\b(research|analyst|data scientist|data analyst|on.chain|tokenomics)\\b/i],
  ['Product & Design', /\\b(product|designer|design|ux|ui)\\b/i],
  ['Business & Growth', /\\b(business development|partnership|sales|growth|marketing)\\b/i],
  ['Operations & Compliance', /\\b(operations|compliance|kyc|aml|risk|legal|policy)\\b/i],
  ['Community & Content', /\\b(community|moderator|content|writer|editor|social media)\\b/i],
  ['Customer Support', /\\b(support|customer success|customer service)\\b/i],
  ['Finance & Accounting', /\\b(finance|accountant|accounting|treasury)\\b/i]
];
function categoryOf(text) { return CATEGORY_RULES.find(([, re]) => re.test(text))?.[0] || 'Other'; }
const SOCIAL = /(^|\.)((x|twitter)\.com|(t|telegram)\.me|reddit\.com|discord\.com|discord\.gg)$/i;
const NEWS = /(news|times|post|journal|herald|guardian|reuters|bloomberg|forbes|coindesk|cointelegraph|decrypt|theblock)\./i;

function decode(s) {
  return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
}
function plain(s) { return decode(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
function tag(block, name) {
  const re = new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i');
  const m = block.match(re); return m ? decode(m[1]).trim() : '';
}
function safeUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase();
    if ([...BLOCKED].some(d => host === d || host.endsWith('.'+d))) return null;
    return u.toString();
  } catch { return null; }
}
function sourceHost(url) { try { return new URL(url).hostname.replace(/^www\./,'').toLowerCase(); } catch { return ''; } }
function parseRss(xml, feed) {
  const blocks = String(xml || '').match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return blocks.map(block => {
    const title = plain(tag(block,'title'));
    const description = plain(tag(block,'description') || tag(block,'content:encoded'));
    const rawLink = tag(block,'link') || ((block.match(/<link[^>]+href=["']([^"']+)/i)||[])[1] || '');
    const link = safeUrl(rawLink);
    const published = tag(block,'pubDate') || tag(block,'published') || tag(block,'updated') || tag(block,'dc:date');
    const date = Date.parse(published);
    const sourceTag = block.match(/<source\b[^>]*url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/source>/i);
    const sourceName = sourceTag ? plain(sourceTag[2]) : feed.label;
    const sourceUrl = sourceTag ? safeUrl(sourceTag[1]) : null;
    // Google News can wrap links to job aggregators; reject blocked publisher domains too.
    if (!title || !link || !Number.isFinite(date) || (sourceTag && !sourceUrl)) return null;
    const text = title + ' ' + description;
    if (!CRYPTO.test(text) || !JOB.test(text) || !ROLE.test(text)) return null;
    const host = sourceHost(sourceUrl || link);
    const channel = SOCIAL.test(host) ? 'social' : NEWS.test(host) || feed.type === 'publisher-news' ? 'publisher-news' : feed.type;
    const canonical = link.split('#')[0].replace(/\/$/,'');
    const fingerprint = crypto.createHash('sha256').update((canonical+'|'+title.toLowerCase()).slice(0,4000)).digest('hex');
    const confidence = channel === 'social' ? 'social lead' : channel === 'publisher-news' ? 'news lead' : 'company lead';
    return {
      id: fingerprint, title: title.slice(0,240), description: description.slice(0,1800),
      company: sourceName.slice(0,120), sourceName: sourceName.slice(0,120),
      sourceType: channel, category: categoryOf(text), sourceHost: host, sourceUrl: sourceUrl || link,
      url: link, publishedAt: new Date(date).toISOString(), confidence,
      status: 'new-lead'
    };
  }).filter(Boolean);
}
function buildFeeds() {
  return FEED_QUERIES.map(feed => ({
    ...feed,
    url: 'https://news.google.com/rss/search?' + new URLSearchParams({
      q: feed.q, hl: 'en-US', gl: 'US', ceid: 'US:en'
    }).toString()
  }));
}
async function collectFeeds(fetchImpl = fetch, now = Date.now()) {
  const feeds = buildFeeds(), all = [], health = [];
  for (const feed of feeds) {
    try {
      const response = await fetchImpl(feed.url, {
        headers: { 'user-agent': 'CareerPilotAI-JobsRadar/1.0 (+https://careerpilot-app-production-c211.up.railway.app)' },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const xml = await response.text();
      const items = parseRss(xml, feed).filter(j => {
        const t = Date.parse(j.publishedAt);
        return t <= now + 86400000 && t >= now - 30 * 86400000;
      });
      all.push(...items);
      health.push({ source: feed.label, status: 'ok', found: items.length });
    } catch (error) {
      health.push({ source: feed.label, status: 'unavailable', found: 0, error: String(error.message || error).slice(0,120) });
    }
  }
  const unique = new Map();
  for (const item of all) if (!unique.has(item.id)) unique.set(item.id, item);
  return { jobs: [...unique.values()].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)), sources: health };
}
module.exports = { FEED_QUERIES, buildFeeds, parseRss, collectFeeds, safeUrl, categoryOf };
