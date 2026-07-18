/**
 * Generate version bar data from published ECMAScript specification HTML files.
 *
 * Usage:
 *   npx tsx scripts/generate-version-bar-data.ts [--config scripts/version-bar-config.json] [--spec-html path/to/current-spec.html] --out-dir out/version-bar-data
 *
 * This script:
 * 1. Reads version config (version keys, labels, URLs)
 * 2. Fetches each version's HTML (with disk cache in .version-cache/)
 * 3. Parses sections from each version using JSDOM
 * 4. Optionally reads oldids from the current spec to map renamed section IDs
 * 5. Outputs:
 *    - version-bar-manifest.json (version list + which sections exist in which versions)
 *    - version-bar-data/<section-id>.json (HTML content per version per section)
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
// Type-only import: shares the manifest shape with the runtime consumer in src/Spec.ts.
// (tsx erases type-only imports, so this has no effect on execution.) The local shape
// must stay structurally identical to Spec.VersionBarManifest.
import type { VersionBarManifest } from '../src/Spec';

interface VersionConfig {
  key: string;
  label: string;
  url: string;
}

interface Config {
  versions: VersionConfig[];
}

function parseArgs(argv: string[]) {
  let configPath = path.join(__dirname, 'version-bar-config.json');
  let outDir = '';
  let specHtml = '';

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--config' && argv[i + 1]) {
      configPath = argv[++i];
    } else if (argv[i] === '--out-dir' && argv[i + 1]) {
      outDir = argv[++i];
    } else if (argv[i] === '--spec-html' && argv[i + 1]) {
      specHtml = argv[++i];
    }
  }

  if (!outDir) {
    console.error('Usage: npx tsx scripts/generate-version-bar-data.ts --out-dir <dir> [--config <config.json>] [--spec-html <spec.html>]');
    process.exit(1);
  }

  return { configPath, outDir, specHtml };
}

const CACHE_DIR = path.join(__dirname, '..', '.version-cache');

async function fetchWithCache(url: string): Promise<string> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Use URL as cache key (sanitized)
  const cacheKey = url.replace(/[^a-zA-Z0-9]/g, '_');
  const cachePath = path.join(CACHE_DIR, cacheKey + '.html');

  if (fs.existsSync(cachePath)) {
    console.log(`  [cache hit] ${url}`);
    return fs.readFileSync(cachePath, 'utf-8');
  }

  console.log(`  [fetching] ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  fs.writeFileSync(cachePath, html, 'utf-8');
  return html;
}

/**
 * Shared helper for the per-section data file name.
 *
 * The client (js/versionBar.js) fetches these files as
 * `encodeURIComponent(sectionId) + '.json'`, so the writer must produce exactly
 * the same name to avoid 404s. Percent-encoding also neutralizes path traversal:
 * any '/', '\\', '.' sequences in an id become percent escapes, so the result is
 * always a single, flat file name with no directory separators.
 */
export function sectionFileName(sectionId: string): string {
  return encodeURIComponent(sectionId) + '.json';
}

/**
 * Return true when an attribute value resolves to a `javascript:` URL.
 * Control characters and surrounding whitespace are stripped first, mirroring how
 * browsers normalize URLs before dispatching them.
 */
function isJavascriptUrl(value: string): boolean {
  const normalized = value.replace(/[\x00-\x20]+/g, '').toLowerCase();
  return normalized.startsWith('javascript:');
}

/**
 * Conservatively sanitize a section HTML fragment before it is persisted.
 *
 * Trust boundary: the output of this function is written into the per-section JSON
 * files and later inserted by the client via `innerHTML` (see js/versionBar.js).
 * Because the client performs no sanitization of its own, the fragment MUST be
 * sanitized here, at write time, so that only already-safe HTML crosses the
 * boundary. This removes active-content elements, event-handler attributes, and
 * `javascript:` URLs.
 */
// Elements that can execute code or load external resources.
const DANGEROUS_ELEMENTS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
];

// A single reusable parsing document. Creating a fresh JSDOM per fragment is far
// too memory-hungry at spec scale (tens of thousands of fragments would spawn
// tens of thousands of JSDOM instances and exhaust the heap), so we parse every
// fragment into a detached <div> owned by one shared document instead.
let sanitizeDoc: Document | null = null;

export function sanitizeSectionHtml(html: string): string {
  if (sanitizeDoc == null) {
    sanitizeDoc = new JSDOM('<!DOCTYPE html><body></body>').window.document;
  }
  // A detached container is cheap to allocate and easy to GC between calls.
  const root = sanitizeDoc.createElement('div');
  root.innerHTML = html;

  for (const el of root.querySelectorAll(DANGEROUS_ELEMENTS.join(','))) {
    el.remove();
  }

  // Strip event-handler attributes and javascript: URLs from every element.
  for (const el of root.querySelectorAll('*')) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        // on* event handler (onclick, onerror, onload, ...)
        el.removeAttribute(attr.name);
        continue;
      }
      // URL-bearing attributes: href, src, xlink:href, and similar `*:href` / `*:src`.
      if (
        name === 'href' ||
        name === 'src' ||
        name === 'xlink:href' ||
        name.endsWith(':href') ||
        name.endsWith(':src')
      ) {
        if (isJavascriptUrl(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  return root.innerHTML;
}

/**
 * Extract all emu-clause and emu-annex sections from the HTML.
 * Returns a map of section ID -> the section's own body HTML.
 */
export function extractSections(html: string): Map<string, string> {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const sections = new Map<string, string>();

  for (const clause of doc.querySelectorAll('emu-clause[id], emu-annex[id]')) {
    const id = clause.getAttribute('id');
    if (id) {
      // Store only this section's OWN body, excluding nested emu-clause / emu-annex
      // descendants. Taking the raw innerHTML would make a parent clause embed all of
      // its child clauses verbatim, so every child's content would be duplicated across
      // its ancestors, bloating the per-section data.
      //
      // We must NOT cloneNode(true) the clause here: on a large spec that copies the
      // whole subtree of every clause (top-level clauses hold thousands of nodes),
      // spiking memory into an OOM. Instead, temporarily swap each nested section for
      // an empty text node (which serializes to nothing), read the clause's innerHTML,
      // then restore the nested sections in reverse order so nested-within-nested is
      // rebuilt correctly.
      const nestedSections = clause.querySelectorAll('emu-clause, emu-annex');
      const restores: [Text, Element][] = [];
      for (const nested of nestedSections) {
        const placeholder = doc.createTextNode('');
        nested.replaceWith(placeholder);
        restores.push([placeholder, nested]);
      }
      sections.set(id, clause.innerHTML);
      for (let i = restores.length - 1; i >= 0; i--) {
        restores[i][0].replaceWith(restores[i][1]);
      }
    }
  }

  dom.window.close();
  return sections;
}

/**
 * Build oldid -> current-id mapping from the current spec HTML.
 * The current spec uses oldids="old1,old2" attributes on emu-clause/emu-annex elements.
 */
function buildOldIdMap(specHtml: string): Map<string, string> {
  const dom = new JSDOM(specHtml);
  const doc = dom.window.document;
  const oldIdMap = new Map<string, string>();

  for (const clause of doc.querySelectorAll('emu-clause[oldids], emu-annex[oldids]')) {
    const currentId = clause.getAttribute('id');
    const oldids = clause.getAttribute('oldids');
    if (currentId && oldids) {
      for (const oldid of oldids.split(',')) {
        const trimmed = oldid.trim();
        if (trimmed) {
          oldIdMap.set(trimmed, currentId);
        }
      }
    }
  }

  dom.window.close();
  return oldIdMap;
}

/**
 * Resolve a section ID to its canonical (current) ID using the oldid map.
 */
function resolveId(id: string, oldIdMap: Map<string, string>): string {
  return oldIdMap.get(id) ?? id;
}

/**
 * Build an O(1)-lookup reverse index for a single version: resolved (current) section ID
 * -> the section body to serve for it.
 *
 * This replaces the previous per-lookup `[...sections.keys()].some(...)` / full-key scans
 * (which made both manifest construction and the per-section loop O(n²)) with a single O(n)
 * pass per version. Precedence is preserved to match the original behavior exactly:
 *   1. A section whose raw id equals the queried id wins (the old `sections.get(id)` branch).
 *   2. Otherwise the first section (in document order) whose id resolves to the queried id
 *      wins (the old fallback loop that `break`s on the first match).
 * `resolved.has(id)` is therefore equivalent to the old `found` test, and `resolved.get(id)`
 * to the old content selection.
 */
function buildResolvedIndex(sections: Map<string, string>, oldIdMap: Map<string, string>): Map<string, string> {
  const resolved = new Map<string, string>();
  // Pass 1: first (document-order) section per resolved id — the fallback branch.
  for (const [id, content] of sections) {
    const rid = resolveId(id, oldIdMap);
    if (!resolved.has(rid)) {
      resolved.set(rid, content);
    }
  }
  // Pass 2: a direct raw-id match takes priority — the `sections.get(id)` branch.
  for (const [id, content] of sections) {
    resolved.set(id, content);
  }
  return resolved;
}

async function main() {
  const { configPath, outDir, specHtml } = parseArgs(process.argv);

  const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Build oldid map if spec HTML is provided
  let oldIdMap = new Map<string, string>();
  if (specHtml) {
    console.log('Building oldid map from current spec...');
    const html = fs.readFileSync(specHtml, 'utf-8');
    oldIdMap = buildOldIdMap(html);
    console.log(`  Found ${oldIdMap.size} oldid mappings`);
  }

  // Fetch and parse each version
  const versionSections = new Map<string, Map<string, string>>();

  // Each edition parses into a large (hundreds of MB) JSDOM tree. extractSections
  // discards it, but the collector does not reclaim it before the next edition is
  // parsed, so the trees pile up and exhaust the heap on a full multi-edition run.
  // When run with --expose-gc, force a collection between editions to keep the peak
  // at roughly one tree; without the flag this is a no-op (a slightly higher heap
  // limit, e.g. NODE_OPTIONS=--max-old-space-size, is then needed).
  const forceGc = (globalThis as { gc?: () => void }).gc;

  for (const version of config.versions) {
    console.log(`Processing ${version.label}...`);
    const html = await fetchWithCache(version.url);
    const sections = extractSections(html);
    console.log(`  Extracted ${sections.size} sections`);
    versionSections.set(version.key, sections);
    forceGc?.();
  }

  // Build a per-version O(1) reverse index (resolved id -> content) once, so the manifest
  // and per-section loops below are O(n) overall instead of O(n²).
  const versionResolved = new Map<string, Map<string, string>>();
  for (const version of config.versions) {
    versionResolved.set(version.key, buildResolvedIndex(versionSections.get(version.key)!, oldIdMap));
  }

  // Collect all section IDs (resolved to current IDs)
  const allSectionIds = new Set<string>();
  for (const [, sections] of versionSections) {
    for (const id of sections.keys()) {
      allSectionIds.add(resolveId(id, oldIdMap));
    }
  }

  // Build manifest
  const manifest: VersionBarManifest = {
    versions: config.versions.map(v => ({ key: v.key, label: v.label })),
    sections: {},
  };

  for (const sectionId of [...allSectionIds].sort()) {
    const presentIn: string[] = [];
    for (const version of config.versions) {
      // O(1) lookup: presence in the reverse index == the old
      // `sections.has(sectionId) || keys.some(id => resolveId(id) === sectionId)` test.
      if (versionResolved.get(version.key)!.has(sectionId)) {
        presentIn.push(version.key);
      }
    }
    if (presentIn.length > 0) {
      manifest.sections[sectionId] = { presentIn };
    }
  }

  // Write output
  fs.mkdirSync(outDir, { recursive: true });
  const dataDir = path.join(outDir, 'version-bar-data');
  fs.mkdirSync(dataDir, { recursive: true });
  const resolvedDataDir = path.resolve(dataDir);

  // Write manifest
  const manifestPath = path.join(outDir, 'version-bar-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Wrote manifest: ${manifestPath} (${Object.keys(manifest.sections).length} sections)`);

  // Write per-section detail files
  let sectionFileCount = 0;
  for (const sectionId of allSectionIds) {
    const sectionData: Record<string, string> = {};

    for (const version of config.versions) {
      // O(1) lookup via the reverse index (was an O(n) scan per version).
      const content = versionResolved.get(version.key)!.get(sectionId);
      if (content) {
        // Trust boundary: sanitize before persisting. These fragments are read back by
        // the client and inserted via innerHTML without further sanitization, so the
        // stored HTML must already be safe.
        sectionData[version.key] = sanitizeSectionHtml(content);
      }
    }

    if (Object.keys(sectionData).length > 0) {
      // Use the shared, percent-encoded file name so it matches the client's fetch URL
      // and cannot contain path separators.
      const sectionPath = path.join(dataDir, sectionFileName(sectionId));
      // Belt-and-suspenders: ensure the resolved path stays directly inside dataDir.
      const resolved = path.resolve(sectionPath);
      if (path.dirname(resolved) !== resolvedDataDir) {
        console.warn(`  [skip] Refusing to write section outside data dir: ${sectionId}`);
        continue;
      }
      fs.writeFileSync(sectionPath, JSON.stringify(sectionData), 'utf-8');
      sectionFileCount++;
    }
  }

  console.log(`Wrote ${sectionFileCount} section detail files to ${dataDir}`);
  console.log('Done.');
}

// Guard execution so the module can be imported (e.g. by tests) without running main().
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
