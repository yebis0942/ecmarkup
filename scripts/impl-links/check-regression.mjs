#!/usr/bin/env node
// Guards the impl-links data refresh against extractor breakage: an engine
// refactor that our extractors no longer understand shows up as a crater in
// the number of matched clauses, while genuine spec/engine drift only moves
// the counts a little.
//
// Usage:
//   node scripts/impl-links/check-regression.mjs <prev.json> <next.json>
//     Exits 1 when any engine's matched-clause count fell below
//     THRESHOLD (80%) of the previous count, or when an engine that has an
//     extractor disappeared from meta.engines entirely.
//   node scripts/impl-links/check-regression.mjs <prev.json> <next.json> --report
//     Additionally prints a markdown report (for the update PR body) to
//     stdout. The check result still determines the exit code.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ENGINE_ORDER, engines } from './config.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const EXTRACT_DIR = process.env.IMPL_LINKS_EXTRACT_DIR || join(SCRIPT_DIR, 'extract');
const THRESHOLD = 0.8;

export function matchedClauseCounts(data) {
  const counts = {};
  for (const key of Object.keys(data.meta?.engines ?? {})) counts[key] = 0;
  for (const byEngine of Object.values(data.clauses ?? {})) {
    for (const key of Object.keys(byEngine)) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

export function findRegressions(prevData, nextData, { hasExtractor } = {}) {
  hasExtractor ??= key => existsSync(join(EXTRACT_DIR, `${key}.mjs`));
  const prev = matchedClauseCounts(prevData);
  const next = matchedClauseCounts(nextData);
  const problems = [];
  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      if (hasExtractor(key)) {
        problems.push(`engine ${key} disappeared from meta.engines but its extractor exists`);
      }
      continue;
    }
    if (prev[key] > 0 && next[key] < prev[key] * THRESHOLD) {
      problems.push(
        `engine ${key}: matched clauses fell from ${prev[key]} to ${next[key]} ` +
          `(below ${THRESHOLD * 100}% threshold)`,
      );
    }
  }
  return problems;
}

export function report(prevData, nextData, { specRev } = {}) {
  const prev = matchedClauseCounts(prevData);
  const next = matchedClauseCounts(nextData);
  const lines = [];
  lines.push('| engine | tag (old → new) | matched clauses (old → new) | Δ |');
  lines.push('|---|---|---|---|');
  const keys = ENGINE_ORDER.filter(k => k in prev || k in next);
  for (const key of keys) {
    const label = engines[key]?.label ?? key;
    const oldTag = prevData.meta?.engines?.[key]?.tag ?? '—';
    const newTag = nextData.meta?.engines?.[key]?.tag ?? '—';
    const tag = oldTag === newTag ? oldTag : `${oldTag} → ${newTag}`;
    const oldCount = prev[key] ?? 0;
    const newCount = next[key] ?? 0;
    const count = oldCount === newCount ? String(oldCount) : `${oldCount} → ${newCount}`;
    const delta = newCount - oldCount;
    lines.push(`| ${label} | ${tag} | ${count} | ${delta >= 0 ? '+' : ''}${delta} |`);
  }
  const totalOld = Object.keys(prevData.clauses ?? {}).length;
  const totalNew = Object.keys(nextData.clauses ?? {}).length;
  lines.push('');
  lines.push(`Total clauses with links: ${totalOld} → ${totalNew}.`);
  if (specRev) lines.push(`ecma262 spec.html revision used: ${specRev}.`);
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const wantReport = args.includes('--report');
  const specRevArg = args.find(a => a.startsWith('--spec-rev='));
  const paths = args.filter(a => !a.startsWith('--'));
  if (paths.length !== 2) {
    console.error('Usage: check-regression.mjs <prev.json> <next.json> [--report] [--spec-rev=X]');
    process.exit(2);
  }
  const prevData = JSON.parse(readFileSync(paths[0], 'utf8'));
  const nextData = JSON.parse(readFileSync(paths[1], 'utf8'));

  if (wantReport) {
    console.log(report(prevData, nextData, { specRev: specRevArg?.slice('--spec-rev='.length) }));
  }

  const problems = findRegressions(prevData, nextData);
  for (const problem of problems) {
    console.error(`regression: ${problem}`);
  }
  if (problems.length > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
