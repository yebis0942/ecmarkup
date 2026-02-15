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

interface VersionConfig {
  key: string;
  label: string;
  url: string;
}

interface Config {
  versions: VersionConfig[];
}

interface ManifestSection {
  presentIn: string[];
}

interface Manifest {
  versions: { key: string; label: string }[];
  sections: Record<string, ManifestSection>;
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
 * Extract all emu-clause and emu-annex sections from the HTML.
 * Returns a map of section ID -> innerHTML.
 */
function extractSections(html: string): Map<string, string> {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const sections = new Map<string, string>();

  for (const clause of doc.querySelectorAll('emu-clause[id], emu-annex[id]')) {
    const id = clause.getAttribute('id');
    if (id) {
      sections.set(id, clause.innerHTML);
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

  for (const version of config.versions) {
    console.log(`Processing ${version.label}...`);
    const html = await fetchWithCache(version.url);
    const sections = extractSections(html);
    console.log(`  Extracted ${sections.size} sections`);
    versionSections.set(version.key, sections);
  }

  // Collect all section IDs (resolved to current IDs)
  const allSectionIds = new Set<string>();
  for (const [, sections] of versionSections) {
    for (const id of sections.keys()) {
      allSectionIds.add(resolveId(id, oldIdMap));
    }
  }

  // Build manifest
  const manifest: Manifest = {
    versions: config.versions.map(v => ({ key: v.key, label: v.label })),
    sections: {},
  };

  for (const sectionId of [...allSectionIds].sort()) {
    const presentIn: string[] = [];
    for (const version of config.versions) {
      const sections = versionSections.get(version.key)!;
      // Check if this section (or any of its old IDs) exists in this version
      const found = sections.has(sectionId) ||
        [...sections.keys()].some(id => resolveId(id, oldIdMap) === sectionId);
      if (found) {
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

  // Write manifest
  const manifestPath = path.join(outDir, 'version-bar-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Wrote manifest: ${manifestPath} (${Object.keys(manifest.sections).length} sections)`);

  // Write per-section detail files
  let sectionFileCount = 0;
  for (const sectionId of allSectionIds) {
    const sectionData: Record<string, string> = {};

    for (const version of config.versions) {
      const sections = versionSections.get(version.key)!;
      // Find the content: try the current ID first, then look for old IDs
      let content = sections.get(sectionId);
      if (!content) {
        for (const [id, html] of sections) {
          if (resolveId(id, oldIdMap) === sectionId) {
            content = html;
            break;
          }
        }
      }
      if (content) {
        sectionData[version.key] = content;
      }
    }

    if (Object.keys(sectionData).length > 0) {
      const sectionPath = path.join(dataDir, `${sectionId}.json`);
      fs.writeFileSync(sectionPath, JSON.stringify(sectionData), 'utf-8');
      sectionFileCount++;
    }
  }

  console.log(`Wrote ${sectionFileCount} section detail files to ${dataDir}`);
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
