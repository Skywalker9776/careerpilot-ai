'use strict';

const ROLE_RULES = [
  ['Trading & markets', /\\b(trader|trading|market maker|quant|portfolio|investment|financial analyst)\\b/i],
  ['Engineering', /\\b(engineer|developer|software|frontend|backend|full.?stack|solidity|rust|protocol)\\b/i],
  ['Security & audit', /\\b(security|auditor|audit|penetration|smart contract review)\\b/i],
  ['Research & data', /\\b(research|analyst|data scientist|data analyst|on.chain|tokenomics)\\b/i],
  ['Business & growth', /\\b(business development|partnership|sales|growth|marketing|community)\\b/i],
  ['Operations & compliance', /\\b(operations|compliance|kyc|aml|risk|legal)\\b/i],
  ['Product & design', /\\b(product manager|product designer|ux|ui designer)\\b/i]
];
const LEVEL_RULES = [
  ['Internship', /\\b(intern|internship|trainee)\\b/i],
  ['Entry level', /\\b(junior|entry.?level|graduate|associate)\\b/i],
  ['Mid level', /\\b(mid.?level|intermediate)\\b/i],
  ['Senior', /\\b(senior|sr\\.?|lead|staff|principal)\\b/i],
  ['Executive', /\\b(head of|director|vice president|vp|chief|cto|ceo)\\b/i]
];
const TYPE_RULES = [
  ['Internship', /\\b(intern|internship)\\b/i],
  ['Part-time', /\\b(part.?time)\\b/i],
  ['Contract', /\\b(contract|contractor|freelance|consultant)\\b/i],
  ['Full-time', /\\b(full.?time|permanent)\\b/i]
];

function textOf(job) {
  return [job.title, job.company, job.location, ...(Array.isArray(job.tags) ? job.tags : []), job.description]
    .filter(Boolean).join(' ');
}
function classify(job) {
  const title = String(job.title || '');
  const text = textOf(job);
  const role = ROLE_RULES.find(([, re]) => re.test(title))?.[0] || 'Other';
  const level = LEVEL_RULES.find(([, re]) => re.test(title))?.[0] || 'Not stated';
  const type = TYPE_RULES.find(([, re]) => re.test(text))?.[0] || 'Not stated';
  const min = Number(job.salaryMin) || 0;
  const max = Number(job.salaryMax) || 0;
  return { ...job, roleFamily: role, seniority: level, employmentType: type,
    salaryKnown: min > 0 || max > 0, salaryMin: min, salaryMax: max };
}
function dedupe(jobs) {
  const seen = new Set(), out = [];
  for (const raw of jobs) {
    const job = classify(raw);
    const key = [job.company, job.title, job.location]
      .map(v => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')).join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}
function filterRadarJobs(jobs, filters = {}, now = Date.now()) {
  const q = String(filters.q || '').trim().toLowerCase().slice(0, 120);
  const location = String(filters.location || '').trim().toLowerCase().slice(0, 80);
  const role = String(filters.role || '').trim();
  const level = String(filters.level || '').trim();
  const type = String(filters.type || '').trim();
  const minSalary = Math.max(0, Number(filters.minSalary) || 0);
  const maxSalary = Math.max(0, Number(filters.maxSalary) || 0);
  const days = Math.max(0, Math.min(365, Number(filters.postedWithinDays) || 0));
  const remote = filters.remote === true || filters.remote === '1';
  const visa = filters.visa === true || filters.visa === '1';
  const all = dedupe(jobs);
  const matches = all.filter(job => {
    const hay = textOf(job).toLowerCase();
    if (q && !q.split(/\\s+/).every(term => hay.includes(term))) return false;
    if (location && !String(job.location || '').toLowerCase().includes(location)) return false;
    if (remote && !job.remote) return false;
    if (visa && !job.visaSponsorship) return false;
    if (role && job.roleFamily !== role) return false;
    if (level && job.seniority !== level) return false;
    if (type && job.employmentType !== type) return false;
    if (minSalary || maxSalary) {
      if (!job.salaryKnown) return false;
      if (minSalary && job.salaryMax && job.salaryMax < minSalary) return false;
      if (maxSalary && job.salaryMin && job.salaryMin > maxSalary) return false;
    }
    if (days) {
      const posted = Date.parse(job.date || '');
      if (!Number.isFinite(posted) || posted < now - days * 86400000 || posted > now + 86400000) return false;
    }
    return true;
  });
  matches.sort((a, b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0));
  return { jobs: matches, totalBeforeFilters: all.length, duplicateCount: Math.max(0, jobs.length - all.length) };
}
function buildRadarSummary(jobs, now = Date.now()) {
  const all = dedupe(jobs);
  const counts = key => all.reduce((n, job) => n + (job[key] ? 1 : 0), 0);
  const roleCounts = {}, levelCounts = {};
  for (const job of all) {
    roleCounts[job.roleFamily] = (roleCounts[job.roleFamily] || 0) + 1;
    levelCounts[job.seniority] = (levelCounts[job.seniority] || 0) + 1;
  }
  const dated = all.map(j => Date.parse(j.date || '')).filter(Number.isFinite);
  const newest = dated.length ? Math.max(...dated) : null;
  return {
    sampleSize: all.length,
    companies: new Set(all.map(j => String(j.company || '').trim().toLowerCase()).filter(Boolean)).size,
    directListings: all.filter(j => j.native).length,
    remoteListings: counts('remote'),
    explicitlySponsoredListings: counts('visaSponsorship'),
    salaryDisclosedListings: all.filter(j => j.salaryKnown).length,
    undatedListings: all.length - dated.length,
    postedLast24Hours: dated.filter(t => t >= now - 86400000 && t <= now).length,
    newestListingAt: newest ? new Date(newest).toISOString() : null,
    roleFamilies: Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    seniority: Object.entries(levelCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    confidence: all.length >= 30 ? 'broader sample' : all.length >= 10 ? 'limited sample' : 'small sample'
  };
}
module.exports = { classify, dedupe, filterRadarJobs, buildRadarSummary };
