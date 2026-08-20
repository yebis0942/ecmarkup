#!/usr/bin/env node
// Compares two impl-links.json files ignoring `meta.generated`, which changes
// on every regeneration. Prints "true" when they differ in any way that
// matters (clauses or engine metadata), "false" otherwise. Used by the update
// workflow to discard regenerations that would only bump the timestamp, so
// `meta.generated` effectively means "last content change".
//
// Usage: node scripts/impl-links/diff-significant.mjs <old.json> <new.json>

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function isSignificantDiff(oldData, newData) {
  const strip = data => JSON.stringify({ engines: data.meta?.engines, clauses: data.clauses });
  return strip(oldData) !== strip(newData);
}

function main() {
  const [oldPath, newPath] = process.argv.slice(2);
  if (!oldPath || !newPath) {
    console.error('Usage: diff-significant.mjs <old.json> <new.json>');
    process.exit(2);
  }
  const oldData = JSON.parse(readFileSync(oldPath, 'utf8'));
  const newData = JSON.parse(readFileSync(newPath, 'utf8'));
  console.log(isSignificantDiff(oldData, newData) ? 'true' : 'false');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
