'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { classify, dedupe, filterRadarJobs, buildRadarSummary } = require('./radar');

const now = Date.now();
const fixtures = [
  { id:'1', title:'Senior Crypto Trader', company:'Alpha', location:'Remote', description:'Full-time role with visa sponsorship', tags:['Trading'], salaryMin:80000, salaryMax:120000, date:new Date(now-3600000).toISOString(), remote:true, visaSponsorship:true },
  { id:'2', title:'Junior Solidity Developer', company:'Beta', location:'Dubai', description:'Contract role', tags:['Solidity'], salaryMin:50000, salaryMax:70000, date:new Date(now-3*86400000).toISOString(), remote:false, visaSponsorship:false },
  { id:'3', title:'Senior Crypto Trader', company:'Alpha', location:'Remote', description:'Full-time role with visa sponsorship', tags:['Trading'], salaryMin:80000, salaryMax:120000, date:new Date(now-3600000).toISOString(), remote:true, visaSponsorship:true }
];

test('classifies role, seniority, employment type and disclosed salary', () => {
  const job = classify(fixtures[0]);
  assert.equal(job.roleFamily, 'Trading & markets');
  assert.equal(job.seniority, 'Senior');
  assert.equal(job.employmentType, 'Full-time');
  assert.equal(job.salaryKnown, true);
});
test('deduplicates equivalent company, title and location records', () => {
  assert.equal(dedupe(fixtures).length, 2);
});
test('combines remote, salary and recent-posting filters', () => {
  const result = filterRadarJobs(fixtures, { role:'Trading & markets', remote:true, minSalary:70000, postedWithinDays:2 }, now);
  assert.equal(result.jobs.length, 1);
  assert.equal(result.duplicateCount, 1);
});
test('filters seniority and preserves explicit unknown categories', () => {
  assert.equal(filterRadarJobs(fixtures, { level:'Entry level' }, now).jobs.length, 1);
  assert.equal(filterRadarJobs(fixtures, { type:'Part-time' }, now).jobs.length, 0);
});
test('summary exposes source coverage and data quality counts', () => {
  const summary = buildRadarSummary(fixtures, now);
  assert.equal(summary.sampleSize, 2);
  assert.equal(summary.companies, 2);
  assert.equal(summary.salaryDisclosedListings, 2);
  assert.equal(summary.postedLast24Hours, 1);
});
