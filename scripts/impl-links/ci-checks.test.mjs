import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isSignificantDiff } from './diff-significant.mjs';
import { findRegressions, matchedClauseCounts, report } from './check-regression.mjs';

function data({ generated = 't0', tags = { v8: '1.0' }, clauses = {} } = {}) {
  return {
    meta: {
      generated,
      engines: Object.fromEntries(
        Object.entries(tags).map(([k, tag]) => [k, { label: k, tag, templates: {} }]),
      ),
    },
    clauses,
  };
}

describe('diff-significant', () => {
  it('ignores meta.generated changes', () => {
    const a = data({ generated: 't0', clauses: { 'sec-x': { v8: [] } } });
    const b = data({ generated: 't1', clauses: { 'sec-x': { v8: [] } } });
    assert.strictEqual(isSignificantDiff(a, b), false);
  });

  it('detects clause and engine-tag changes', () => {
    const a = data({ clauses: { 'sec-x': { v8: [] } } });
    assert.strictEqual(isSignificantDiff(a, data({ clauses: {} })), true);
    assert.strictEqual(
      isSignificantDiff(a, data({ tags: { v8: '2.0' }, clauses: { 'sec-x': { v8: [] } } })),
      true,
    );
  });
});

describe('check-regression', () => {
  const prev = data({
    tags: { v8: '1.0', qjs: '1.0' },
    clauses: {
      'sec-a': { v8: [], qjs: [] },
      'sec-b': { v8: [] },
      'sec-c': { v8: [] },
      'sec-d': { v8: [] },
      'sec-e': { v8: [] },
    },
  });

  it('counts matched clauses per engine', () => {
    assert.deepStrictEqual(matchedClauseCounts(prev), { v8: 5, qjs: 1 });
  });

  it('passes when counts hold steady or grow', () => {
    assert.deepStrictEqual(findRegressions(prev, prev, { hasExtractor: () => true }), []);
  });

  it('fails when an engine count falls below the threshold', () => {
    const next = data({
      tags: { v8: '1.1', qjs: '1.0' },
      clauses: { 'sec-a': { v8: [], qjs: [] } },
    });
    const problems = findRegressions(prev, next, { hasExtractor: () => true });
    assert.strictEqual(problems.length, 1);
    assert.match(problems[0], /engine v8: matched clauses fell from 5 to 1/);
  });

  it('fails when an engine with an extractor disappears entirely', () => {
    const next = data({
      tags: { v8: '1.0' },
      clauses: {
        'sec-a': { v8: [] },
        'sec-b': { v8: [] },
        'sec-c': { v8: [] },
        'sec-d': { v8: [] },
        'sec-e': { v8: [] },
      },
    });
    const withExtractor = findRegressions(prev, next, { hasExtractor: () => true });
    assert.strictEqual(withExtractor.length, 1);
    assert.match(withExtractor[0], /engine qjs disappeared/);
    // No extractor -> intentionally removed, not a regression.
    assert.deepStrictEqual(findRegressions(prev, next, { hasExtractor: () => false }), []);
  });

  it('renders a markdown report with tags, counts, and the spec revision', () => {
    const next = data({
      tags: { v8: '1.1', qjs: '1.0' },
      clauses: { 'sec-a': { v8: [], qjs: [] }, 'sec-b': { v8: [] } },
    });
    const md = report(prev, next, { specRev: 'abc123' });
    // Engine labels come from config.mjs (v8 -> "V8", qjs -> "QuickJS").
    assert.match(md, /\| V8 \| 1\.0 → 1\.1 \| 5 → 2 \| -3 \|/);
    assert.match(md, /\| QuickJS \| 1\.0 \| 1 \| \+0 \|/);
    assert.match(md, /Total clauses with links: 5 → 2\./);
    assert.match(md, /abc123/);
  });
});
