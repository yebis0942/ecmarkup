'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { JSDOM } = require('jsdom');

const build = require('../lib/ecmarkup').build;

// A minimal emu document containing a single clause with an explicit id and an
// <h1> header (the header is required for a version bar to be inserted).
const DOC =
  '<!doctype html><pre class=metadata>toc: false\ncopyright: false</pre>' +
  '<emu-clause id=sec-test><h1>Test Section</h1><p>body</p></emu-clause>';

const VERSIONS = [
  { key: 'es5', label: 'ES5' },
  { key: 'es6', label: 'ES2015' },
];

// fetch callback: biblio requests (*.json) get an empty object; anything else
// (i.e. the root document) gets DOC. The version-bar manifest is NOT fetched
// through this callback -- it is read from disk via fs by the builder.
function fetch(file) {
  return /\.json$/.test(file) ? '{}' : DOC;
}

// Track temp dirs created per test so they can be cleaned up afterwards.
let tempDirs = [];

function mkTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/**
 * Write a version-bar manifest (and a sibling `version-bar-data/` directory with
 * one JSON file per section) to a fresh temp dir. Returns the manifest path and
 * the data directory.
 */
function writeManifest(sections, versions = VERSIONS) {
  const dir = mkTempDir('vb-manifest-');
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ versions, sections }));
  const dataDir = path.join(dir, 'version-bar-data');
  fs.mkdirSync(dataDir);
  for (const id of Object.keys(sections)) {
    fs.writeFileSync(
      path.join(dataDir, encodeURIComponent(id) + '.json'),
      JSON.stringify({ html: '<p>section content</p>' }),
    );
  }
  return { manifestPath, dataDir };
}

function findGeneratedFile(spec, predicate) {
  for (const [key, contents] of spec.generatedFiles) {
    if (predicate(key)) return { key, contents };
  }
  return undefined;
}

describe('version bar', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  it('generates version-bar DOM with per-version segments and edition numbers', async () => {
    const { manifestPath } = writeManifest({ 'sec-test': { presentIn: ['es6'] } });

    const spec = await build('root.html', fetch, {
      versionBar: manifestPath,
      assets: 'none',
    });
    const html = spec.toHTML();

    // Substring smoke checks.
    assert(html.includes('class="version-bar"'), 'expected a version-bar element');
    assert(
      html.includes('data-section-id="sec-test"'),
      'expected the version bar to carry the section id',
    );

    // Structural checks via a real DOM.
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const bar = doc.querySelector('.version-bar[data-section-id="sec-test"]');
    assert(bar, 'version bar element should exist for sec-test');

    const es6 = bar.querySelector('span[data-version="es6"]');
    const es5 = bar.querySelector('span[data-version="es5"]');
    assert(es6, 'expected a segment for es6');
    assert(es5, 'expected a segment for es5');

    // Edition number display: "es6" -> "6", "es5" -> "5".
    assert.strictEqual(es6.textContent, '6');
    assert.strictEqual(es5.textContent, '5');

    // es6 is in presentIn -> present segment (no --absent modifier).
    assert(es6.classList.contains('version-segment'));
    assert(!es6.classList.contains('version-segment--absent'), 'es6 should be present');

    // es5 is NOT in presentIn -> absent segment.
    assert(es5.classList.contains('version-segment'));
    assert(es5.classList.contains('version-segment--absent'), 'es5 should be marked absent');

    dom.window.close();
  });

  it('escapes </script> breakouts when embedding the manifest inline', async () => {
    const evilId = '</script><script>alert(1)</script>';
    const { manifestPath } = writeManifest({ [evilId]: { presentIn: ['es6'] } });

    const outDir = mkTempDir('vb-out-');
    const spec = await build('root.html', fetch, {
      versionBar: manifestPath,
      assets: 'inline',
      outfile: path.join(outDir, 'index.html'),
    });
    const html = spec.toHTML();

    // The raw breakout sequence must never appear verbatim in the output.
    assert(
      !html.includes('</script><script>alert'),
      'raw </script> breakout must not appear in the embedded manifest',
    );

    // It must be present in escaped (< / >) form instead.
    assert(
      html.includes('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e'),
      'the section id should be embedded with < and > escaped',
    );
  });

  it('emits per-section data under the assets dir for external builds', async () => {
    const { manifestPath } = writeManifest({ 'sec-test': { presentIn: ['es6'] } });

    const outDir = mkTempDir('vb-out-');
    const assetsDir = path.join(outDir, 'assets');
    const spec = await build('root.html', fetch, {
      versionBar: manifestPath,
      assets: 'external',
      assetsDir,
      outfile: path.join(outDir, 'index.html'),
    });

    // The per-section data file is copied under <assetsDir>/version-bar-data/.
    const expectedDataKey = path.join(assetsDir, 'version-bar-data', 'sec-test.json');
    assert(spec.generatedFiles.has(expectedDataKey), `expected generated file ${expectedDataKey}`);

    // The injected client JS points versionBarDataDir at the assets dir, relative
    // to the output file's directory (here just "assets").
    const js = findGeneratedFile(spec, k => k.endsWith(path.join('js', 'ecmarkup.js')));
    assert(js, 'expected a generated ecmarkup.js');
    assert(
      js.contents.includes('let versionBarDataDir = "assets"'),
      'expected versionBarDataDir to point at the relative assets dir',
    );
  });

  it('emits per-section data alongside the outfile for inline builds', async () => {
    const { manifestPath } = writeManifest({ 'sec-test': { presentIn: ['es6'] } });

    const outDir = mkTempDir('vb-out-');
    const spec = await build('root.html', fetch, {
      versionBar: manifestPath,
      assets: 'inline',
      outfile: path.join(outDir, 'index.html'),
    });

    // Data is placed next to the output HTML.
    const expectedDataKey = path.join(outDir, 'version-bar-data', 'sec-test.json');
    assert(spec.generatedFiles.has(expectedDataKey), `expected generated file ${expectedDataKey}`);

    // For an inline build the client fetches version-bar-data/<id>.json relative to
    // the page, so the injected directory is empty.
    const html = spec.toHTML();
    assert(
      html.includes('let versionBarDataDir = "";'),
      'expected an empty versionBarDataDir for inline builds',
    );
  });

  it('respects an explicit versionBarDir and does not auto-copy data', async () => {
    const { manifestPath } = writeManifest({ 'sec-test': { presentIn: ['es6'] } });

    const outDir = mkTempDir('vb-out-');
    const spec = await build('root.html', fetch, {
      versionBar: manifestPath,
      versionBarDir: 'custom/prefix',
      assets: 'external',
      assetsDir: path.join(outDir, 'assets'),
      outfile: path.join(outDir, 'index.html'),
    });

    // The injected value is exactly what the user asked for.
    const js = findGeneratedFile(spec, k => k.endsWith(path.join('js', 'ecmarkup.js')));
    assert(js, 'expected a generated ecmarkup.js');
    assert(
      js.contents.includes('let versionBarDataDir = "custom/prefix"'),
      'expected versionBarDataDir to equal the explicit versionBarDir',
    );

    // When the directory is user-managed, ecmarkup does not copy any data files.
    const autoCopied = findGeneratedFile(spec, k => k.includes('version-bar-data'));
    assert(
      !autoCopied,
      'no version-bar-data files should be auto-emitted when versionBarDir is explicit',
    );
  });

  it('does not emit any version-bar machinery when the option is absent', async () => {
    // Use assets:'none' so the static stylesheet (which always contains
    // `.version-bar` rules) is not inlined; this isolates the feature's own output.
    const spec = await build('root.html', fetch, { assets: 'none' });
    const html = spec.toHTML();

    assert(!html.includes('class="version-bar"'), 'no version-bar element should be generated');
    assert(!html.includes('version-segment'), 'no version-segment spans should be generated');
    assert(!html.includes('versionBarManifest'), 'no version-bar manifest should be injected');
  });
});
