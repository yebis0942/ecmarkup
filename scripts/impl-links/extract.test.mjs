import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import { extract as extractQjs } from './extract/qjs.mjs';

// A miniature quickjs.c exercising the shapes the extractor understands:
// a mapped table with a plain function, a magic function and an accessor,
// plus an unmapped table that must produce a warning, not a record.
const QUICKJS_C = `
static JSValue js_array_map(JSContext *ctx, JSValueConst this_val,
                            int argc, JSValueConst *argv)
{
    return JS_UNDEFINED;
}

static JSValue js_array_at(JSContext *ctx, JSValueConst this_val,
                           int argc, JSValueConst *argv, int magic)
{
    return JS_UNDEFINED;
}

static JSValue js_get_length(JSContext *ctx, JSValueConst this_val)
{
    return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_array_proto_funcs[] = {
    JS_CFUNC_DEF("map", 1, js_array_map ),
    JS_CFUNC_MAGIC_DEF("at", 1, js_array_at, 0 ),
    JS_CGETSET_DEF("length", js_get_length, NULL ),
};

static const JSCFunctionListEntry js_mystery_funcs[] = {
    JS_CFUNC_DEF("whatever", 0, js_array_map ),
};
`;

describe('qjs extractor', () => {
  const root = mkdtempSync(join(tmpdir(), 'qjs-fixture-'));
  writeFileSync(join(root, 'quickjs.c'), QUICKJS_C);
  after(() => rmSync(root, { recursive: true, force: true }));

  it('extracts entry and impl links for mapped tables and warns on unmapped ones', async () => {
    const { records, warnings } = await extractQjs(root);
    const byName = new Map(records.map(r => [r.name, r]));

    const map = byName.get('Array.prototype.map');
    assert(map, 'expected a record for Array.prototype.map');
    assert.deepStrictEqual(
      map.links.map(l => l.label),
      ['entry', 'impl (C)'],
    );
    assert(map.links.every(l => l.path === 'quickjs.c'));
    // The impl link points at the definition of js_array_map (line 2 of the fixture).
    assert.strictEqual(map.links[1].line, 2);

    assert(byName.has('Array.prototype.at'), 'magic defs are extracted');
    assert(byName.has('get Array.prototype.length'), 'getters get a get-prefixed name');

    assert(
      warnings.some(w => w.includes('js_mystery_funcs')),
      `expected an unmapped-table warning, got: ${JSON.stringify(warnings)}`,
    );
    assert(!byName.has('whatever'), 'unmapped tables produce no records');
  });
});
