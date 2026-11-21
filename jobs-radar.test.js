'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRss, buildFeeds } = require('./jobs-radar');

test('parses only recent crypto job announcements with role evidence', () => {
  const xml = '<rss><channel><item><title>Hiring Solidity Engineer at Example Protocol</title><description>Web3 blockchain startup opening a developer role.</description><link>https://example.org/careers/solidity</link><pubDate>Sat, 21 Nov 2026 08:00:00 GMT</pubDate><source url="https://example.org">Example Protocol</source></item></channel></rss>';
  const rows = parseRss(xml, { label:'test', type:'company-news' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, 'Hiring Solidity Engineer at Example Protocol');
  assert.equal(rows[0].sourceHost, 'example.org');
});
test('blocks LinkedIn, Indeed and non-HTTP links', () => {
  const xml = '<rss><item><title>Hiring Crypto Engineer</title><description>Blockchain engineer vacancy</description><link>https://www.linkedin.com/jobs/view/123</link><pubDate>Sat, 21 Nov 2026 08:00:00 GMT</pubDate></item><item><title>Hiring Crypto Analyst</title><description>Web3 analyst vacancy</description><link>javascript:alert(1)</link><pubDate>Sat, 21 Nov 2026 08:00:00 GMT</pubDate></item></rss>';
  assert.equal(parseRss(xml, { label:'test', type:'social' }).length, 0);
});
test('blocks excluded aggregators when Google News wraps the destination', () => {
  const xml = '<rss><item><title>Hiring Crypto Engineer</title><description>Blockchain engineer vacancy</description><link>https://news.google.com/rss/articles/abc</link><pubDate>Sat, 21 Nov 2026 08:00:00 GMT</pubDate><source url="https://www.indeed.com">Indeed</source></item></rss>';
  assert.equal(parseRss(xml, { label:'test', type:'publisher-news' }).length, 0);
});
test('does not classify general crypto news as a job', () => {
  const xml = '<rss><item><title>Bitcoin market update</title><description>Crypto prices rise today.</description><link>https://news.example.org/bitcoin</link><pubDate>Sat, 21 Nov 2026 08:00:00 GMT</pubDate></item></rss>';
  assert.equal(parseRss(xml, { label:'test', type:'publisher-news' }).length, 0);
});
test('defines multiple non-aggregator source discovery feeds', () => {
  const feeds = buildFeeds();
  assert.ok(feeds.some(f => f.key === 'x-social'));
  assert.ok(feeds.some(f => f.key === 'reddit-social'));
  assert.ok(feeds.some(f => f.key === 'company-careers'));
  assert.ok(feeds.every(f => f.url.includes('news.google.com/rss/search')));
});
