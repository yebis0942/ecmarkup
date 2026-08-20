#!/usr/bin/env node
// Samples a few generated links per engine from impl-links.json and verifies
// they actually resolve: GitHub blob links are checked through
// raw.githubusercontent.com (the file exists and has at least the linked
// line), Searchfox links must return 200. Chromium Code Search is an SPA that
// returns 200 for any path, so v8's primary links are unverifiable and are
// covered by their GitHub fallback template instead.
//
// Usage: node scripts/impl-links/verify-links.mjs [impl-links.json] [--samples N]

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEFAULT_SAMPLES = 3;

function buildUrl(template, link) {
  return template.replace('{path}', encodeURI(link.p)).replace('{line}', link.l);
}

// GitHub blob URLs are verified via the raw host so we can count lines.
function toRawGithub(url) {
  const m = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/([^/]+)\/(.+?)(?:#L(\d+))?$/.exec(url);
  if (m == null) return null;
  return { raw: `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`, line: m[4] };
}

async function checkUrl(url) {
  const gh = toRawGithub(url);
  const target = gh ? gh.raw : url;
  const response = await fetch(target, { redirect: 'follow' });
  if (!response.ok) return `HTTP ${response.status} for ${target}`;
  if (gh && gh.line != null) {
    const text = await response.text();
    const lineCount = text.split('\n').length;
    if (lineCount < Number(gh.line)) {
      return `${target} has only ${lineCount} lines, link points at line ${gh.line}`;
    }
  }
  return null;
}

// Spread the samples across the clause list so we do not only test the
// alphabetically-first entries.
function sampleLinks(data, engineKey, samples) {
  const entries = [];
  for (const [clauseId, byEngine] of Object.entries(data.clauses)) {
    const links = byEngine[engineKey];
    if (Array.isArray(links) && links.length > 0) entries.push({ clauseId, link: links[0] });
  }
  if (entries.length === 0) return [];
  const picked = [];
  for (let i = 0; i < Math.min(samples, entries.length); i++) {
    picked.push(entries[Math.floor((i * (entries.length - 1)) / Math.max(samples - 1, 1))]);
  }
  return picked;
}

async function main() {
  const args = process.argv.slice(2);
  const samplesArg = args.indexOf('--samples');
  const samples = samplesArg !== -1 ? Number(args[samplesArg + 1]) : DEFAULT_SAMPLES;
  const dataPath =
    args.find(a => !a.startsWith('--') && a !== String(samples)) ?? 'impl-links.json';
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));

  const failures = [];
  for (const [engineKey, engine] of Object.entries(data.meta.engines)) {
    for (const { clauseId, link } of sampleLinks(data, engineKey, samples)) {
      for (const [tplKey, template] of Object.entries(engine.templates)) {
        if (template.startsWith('https://source.chromium.org/')) continue; // SPA, always 200
        const url = buildUrl(template, link);
        const problem = await checkUrl(url);
        console.log(`[${engineKey}/${tplKey}] ${clauseId}: ${problem ?? 'ok'}`);
        if (problem != null) failures.push(`[${engineKey}/${tplKey}] ${clauseId}: ${problem}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} link check(s) failed`);
    process.exit(1);
  }
  console.log('\nall sampled links ok');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
