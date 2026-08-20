import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';

import { loadSpecNames, nameToKey } from './spec-names.mjs';

describe('nameToKey', () => {
  it('strips a trailing parameter list', () => {
    assert.strictEqual(nameToKey('Array.prototype.map ( _callback_ [ , _thisArg_ ] )'), 'arrayprototype.map');
    assert.strictEqual(nameToKey('parseInt ( _string_, _radix_ )'), 'parseint');
  });

  it('lowercases and removes whitespace', () => {
    assert.strictEqual(nameToKey('Math . abs'), 'math.abs');
  });

  it('preserves get/set prefixes', () => {
    assert.strictEqual(nameToKey('get Map.prototype.size'), 'getmapprototype.size');
    assert.strictEqual(nameToKey('set Object.prototype.__proto__'), 'setobjectprototype.__proto__');
  });

  it('normalizes well-known-symbol notations to one form', () => {
    const canonical = nameToKey('Array.prototype [ %Symbol.iterator% ] ( )');
    assert.strictEqual(canonical, 'arrayprototype[symbol.iterator]');
    assert.strictEqual(nameToKey('Array.prototype [ Symbol.iterator ] ( )'), canonical);
    assert.strictEqual(nameToKey('Array.prototype [ @@iterator ] ( )'), canonical);
  });

  it('unwraps %intrinsic% notation', () => {
    assert.strictEqual(
      nameToKey('%TypedArray%.prototype.set ( _source_ )'),
      nameToKey('TypedArray.prototype.set ( )'),
    );
  });

  it('collapses the .prototype separator so intrinsic and path spellings match', () => {
    assert.strictEqual(
      nameToKey('%GeneratorPrototype%.next ( _value_ )'),
      nameToKey('Generator.prototype.next ( _value_ )'),
    );
    assert.strictEqual(nameToKey('Generator.prototype.next ( _value_ )'), 'generatorprototype.next');
  });

  it('strips ecmarkup value markup', () => {
    assert.strictEqual(nameToKey('Symbol.for ( *undefined* )'), 'symbol.for');
  });
});

describe('loadSpecNames', () => {
  const dir = mkdtempSync(join(tmpdir(), 'spec-names-'));
  after(() => rmSync(dir, { recursive: true, force: true }));

  function load(html) {
    const file = join(dir, 'spec.html');
    writeFileSync(file, html);
    return loadSpecNames(file);
  }

  it('maps built-in function clauses and alias clauses, skipping the rest', () => {
    const map = load(`
      <emu-clause id="sec-array.prototype.map" type="built-in function">
        <h1>Array.prototype.map ( _callbackfn_ [ , _thisArg_ ] )</h1>
      </emu-clause>
      <emu-clause id="sec-get-map.prototype.size" type="built-in function">
        <h1>get Map.prototype.size</h1>
      </emu-clause>
      <emu-clause id="sec-array.prototype-symbol.iterator">
        <h1>Array.prototype [ %Symbol.iterator% ] ( )</h1>
      </emu-clause>
      <emu-clause id="sec-createarrayiterator" type="abstract operation">
        <h1>CreateArrayIterator ( _array_, _kind_ )</h1>
      </emu-clause>
      <emu-clause id="sec-tostring">
        <h1>ToString ( _argument_ )</h1>
      </emu-clause>
      <emu-clause id="sec-the-array-constructor">
        <h1>The Array Constructor</h1>
      </emu-clause>
    `);
    assert.strictEqual(map.get(nameToKey('Array.prototype.map ( )')), 'sec-array.prototype.map');
    assert.strictEqual(map.get(nameToKey('get Map.prototype.size')), 'sec-get-map.prototype.size');
    assert.strictEqual(
      map.get(nameToKey('Array.prototype [ @@iterator ] ( )')),
      'sec-array.prototype-symbol.iterator',
    );
    // Abstract operations, bare AO names, and prose headings are excluded.
    assert.strictEqual(map.has(nameToKey('CreateArrayIterator ( )')), false);
    assert.strictEqual(map.has(nameToKey('ToString ( )')), false);
    assert.strictEqual([...map.values()].includes('sec-the-array-constructor'), false);
  });

  it('drops inline markup in titles and lets typed clauses win over aliases', () => {
    const map = load(`
      <emu-clause id="sec-typed" type="built-in function">
        <h1><ins>Array.of ( ..._items_ )</ins></h1>
      </emu-clause>
      <emu-clause id="sec-alias">
        <h1>Array.of ( ..._items_ )</h1>
      </emu-clause>
    `);
    assert.strictEqual(map.get(nameToKey('Array.of ( )')), 'sec-typed');
  });
});
