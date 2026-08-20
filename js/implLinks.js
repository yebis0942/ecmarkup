'use strict';

// Implementation links widget: adds a per-clause button that opens a panel of
// links to that clause's implementation in various JS engines.
// A small index (impl-links-index.json, clause ids only) is fetched eagerly to
// know where to attach buttons; the full link data (impl-links.json, generated
// by scripts/impl-links/) is only fetched when a button is first clicked.

let implLinksEngineOrder = ['v8', 'jsc', 'sm', 'qjs'];

let implLinksState = {
  openPanel: null, // the currently open panel element, or null
  openButton: null, // the button that opened it (for focus return / aria)
  dataPromise: null, // promise for the full impl-links.json, started on first click
};

function implLinksDataUrl() {
  return window.implLinksDataUrl || 'impl-links.json';
}

function implLinksIndexUrl() {
  // The index lives next to the data file, whatever directory that is.
  let dataUrl = implLinksDataUrl();
  return dataUrl.slice(0, dataUrl.lastIndexOf('/') + 1) + 'impl-links-index.json';
}

function initImplLinks() {
  if (typeof fetch !== 'function') return;
  let fetched;
  try {
    fetched = fetch(implLinksIndexUrl());
  } catch (e) {
    return;
  }
  fetched
    .then(response => (response.ok ? response.json() : null))
    .then(index => {
      if (index != null && Array.isArray(index.ids)) {
        setupImplLinks(index.ids);
      }
    })
    .catch(() => {
      // Index unavailable (e.g. file:// or missing/invalid file): do nothing.
    });
}

function fetchImplLinksData() {
  if (implLinksState.dataPromise == null) {
    implLinksState.dataPromise = fetch(implLinksDataUrl())
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (
          data != null &&
          data.meta != null &&
          data.meta.engines != null &&
          data.clauses != null
        ) {
          return data;
        }
        return null;
      })
      .catch(() => null);
  }
  return implLinksState.dataPromise;
}

function setupImplLinks(ids) {
  let attached = false;
  for (let i = 0; i < ids.length; i++) {
    let id = ids[i];
    let clause = document.getElementById(id);
    if (!clause) continue;
    if (clause.tagName !== 'EMU-CLAUSE' && clause.tagName !== 'EMU-ANNEX') continue;
    let h1 = clause.querySelector('h1');
    if (!h1) continue;
    // Only attach to direct h1 children of this clause
    if (h1.parentNode !== clause) continue;

    let btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'impl-links-btn';
    btn.textContent = 'impl';
    btn.title = 'Engine implementations of this section';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      toggleImplLinksPanel(btn, id);
    });
    h1.appendChild(btn);
    attached = true;
  }
  if (!attached) return;

  // Close panel on outside click
  document.addEventListener('click', e => {
    if (
      implLinksState.openPanel &&
      !implLinksState.openPanel.contains(e.target) &&
      !e.target.classList.contains('impl-links-btn')
    ) {
      closeImplLinksPanel();
    }
  });

  // Close panel on Escape, returning focus to the button that opened it
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && implLinksState.openPanel) {
      let btn = implLinksState.openButton;
      closeImplLinksPanel();
      if (btn) btn.focus();
    }
  });
}

function toggleImplLinksPanel(btn, sectionId) {
  if (implLinksState.openPanel && implLinksState.openPanel._sectionId === sectionId) {
    closeImplLinksPanel();
    return;
  }
  closeImplLinksPanel();
  openImplLinksPanel(btn, sectionId);
}

function closeImplLinksPanel() {
  if (implLinksState.openPanel) {
    implLinksState.openPanel.remove();
    implLinksState.openPanel = null;
  }
  if (implLinksState.openButton) {
    implLinksState.openButton.setAttribute('aria-expanded', 'false');
    implLinksState.openButton = null;
  }
}

function implLinkUrl(engine, link, tplKey) {
  let templates = engine.templates;
  if (templates == null) return null;
  let template = templates[tplKey];
  if (typeof template !== 'string') return null;
  return template.replace('{path}', encodeURI(link.p)).replace('{line}', link.l);
}

function openImplLinksPanel(btn, sectionId) {
  let panel = document.createElement('div');
  panel.className = 'impl-links-panel';
  panel._sectionId = sectionId;

  let status = document.createElement('div');
  status.className = 'impl-links-status';
  status.textContent = 'loading…';
  panel.appendChild(status);

  // Position relative to button
  btn.parentNode.style.position = 'relative';
  btn.parentNode.appendChild(panel);

  btn.setAttribute('aria-expanded', 'true');
  implLinksState.openPanel = panel;
  implLinksState.openButton = btn;

  fetchImplLinksData().then(data => {
    // The panel may have been closed (or replaced) while the data loaded.
    if (implLinksState.openPanel !== panel) return;
    if (data == null || data.clauses[sectionId] == null) {
      status.textContent = 'failed to load implementation links';
      return;
    }
    status.remove();
    renderImplLinksPanel(panel, sectionId, data);
  });
}

function renderImplLinksPanel(panel, sectionId, data) {
  let clauseData = data.clauses[sectionId];
  for (let i = 0; i < implLinksEngineOrder.length; i++) {
    let engineKey = implLinksEngineOrder[i];
    let links = clauseData[engineKey];
    let engine = data.meta.engines[engineKey];
    if (!Array.isArray(links) || links.length === 0 || engine == null) continue;

    let row = document.createElement('div');
    row.className = 'impl-links-row';

    let label = document.createElement('span');
    label.className = 'impl-links-engine';
    label.textContent = engine.label;
    if (engine.tag != null) {
      let tag = document.createElement('span');
      tag.className = 'impl-links-engine-tag';
      tag.textContent = engine.tag;
      label.appendChild(tag);
    }
    row.appendChild(label);

    for (let j = 0; j < links.length; j++) {
      let link = links[j];
      let tplKeys = Object.keys(engine.templates || {});
      // Engines with a single template may omit `tpl` on their links.
      let primaryKey = link.tpl != null ? link.tpl : tplKeys[0];
      let url = implLinkUrl(engine, link, primaryKey);
      if (url == null) continue;
      let a = document.createElement('a');
      a.className = 'impl-links-link';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = link.t;
      row.appendChild(a);
      // Same location on the engine's other hosts (e.g. a GitHub fallback
      // for V8's Chromium Code Search links).
      for (let k = 0; k < tplKeys.length; k++) {
        if (tplKeys[k] === primaryKey) continue;
        let altUrl = implLinkUrl(engine, link, tplKeys[k]);
        if (altUrl == null) continue;
        let alt = document.createElement('a');
        alt.className = 'impl-links-link impl-links-alt';
        alt.href = altUrl;
        alt.target = '_blank';
        alt.rel = 'noopener';
        alt.textContent = '[' + tplKeys[k] + ']';
        alt.title = 'Same location on ' + tplKeys[k];
        row.appendChild(alt);
      }
    }

    panel.appendChild(row);
  }
}

document.addEventListener('DOMContentLoaded', initImplLinks);
